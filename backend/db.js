const path = require('path');
const fs = require('fs');

// Try to use PostgreSQL in production, fall back to SQLite in development
let db;

if (process.env.DATABASE_URL) {
  // Production: Use PostgreSQL via Supabase
  console.log('Using PostgreSQL (Supabase)');
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  db = {
    prepare: (sql) => ({
      run: (...params) => {
        try {
          pool.query(sql, params, (err, result) => {
            if (err) console.error('DB Error:', err);
          });
          return { changes: 1 };
        } catch (err) {
          console.error('DB Error:', err);
          throw err;
        }
      },
      get: (...params) => {
        try {
          let result = null;
          pool.query(sql, params, (err, res) => {
            if (err) console.error('DB Error:', err);
            result = res?.rows?.[0];
          });
          return result;
        } catch (err) {
          console.error('DB Error:', err);
          return null;
        }
      },
      all: (...params) => {
        try {
          let result = [];
          pool.query(sql, params, (err, res) => {
            if (err) console.error('DB Error:', err);
            result = res?.rows || [];
          });
          return result;
        } catch (err) {
          console.error('DB Error:', err);
          return [];
        }
      }
    }),
    exec: (sql) => {
      try {
        pool.query(sql, (err) => {
          if (err) console.error('DB Error:', err);
        });
      } catch (err) {
        console.error('DB Error:', err);
      }
    }
  };
} else {
  // Development: Use SQLite
  console.log('Using SQLite (local development)');
  const Database = require('better-sqlite3');

  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  db = new Database(path.join(__dirname, 'marketplace.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'investor', -- 'investor' | 'business' | 'admin'
    avatar TEXT,
    balance REAL NOT NULL DEFAULT 0,
    wallet_address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    payout_frequency TEXT NOT NULL, -- 'monthly' | 'quarterly' | 'annual'
    interest_rate REAL NOT NULL,
    min_investment REAL NOT NULL DEFAULT 1000,
    max_investment REAL,
    total_pool REAL NOT NULL DEFAULT 0,
    funded_amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'active' | 'closed' | 'suspended'
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid'
    category TEXT,
    risk_level TEXT DEFAULT 'medium',
    duration_months INTEGER NOT NULL DEFAULT 12,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS project_files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'presentation' | 'visual' | 'document'
    mime_type TEXT,
    size INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS investments (
    id TEXT PRIMARY KEY,
    investor_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'sold' | 'matured'
    purchase_price REAL NOT NULL,
    current_value REAL NOT NULL,
    interest_earned REAL NOT NULL DEFAULT 0,
    last_payout TEXT,
    paid_from_balance INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (investor_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS payouts (
    id TEXT PRIMARY KEY,
    investment_id TEXT NOT NULL,
    investor_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processed' | 'failed'
    scheduled_date TEXT NOT NULL,
    processed_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (investment_id) REFERENCES investments(id),
    FOREIGN KEY (investor_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    investor_id TEXT NOT NULL,
    payout_reliability INTEGER NOT NULL CHECK(payout_reliability BETWEEN 1 AND 5),
    transparency INTEGER NOT NULL CHECK(transparency BETWEEN 1 AND 5),
    overall INTEGER NOT NULL CHECK(overall BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(project_id, investor_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (investor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS market_listings (
    id TEXT PRIMARY KEY,
    investment_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    asking_price REAL NOT NULL,
    original_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'sold' | 'cancelled'
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (investment_id) REFERENCES investments(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS deposits (
    id TEXT PRIMARY KEY,
    investor_id TEXT NOT NULL,
    amount REAL NOT NULL,
    tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'failed'
    blockchain_verified INTEGER DEFAULT 0,
    confirmation_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (investor_id) REFERENCES users(id)
  );
`);

// Seed admin user
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Only seed data in SQLite (development), not PostgreSQL (production)
if (!process.env.DATABASE_URL) {
  // Ensure admin user exists with correct credentials
  db.prepare('DELETE FROM users WHERE email = ?').run('admin@nexvest.com');
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('sgalindo@outlook.com');
  if (!adminExists) {
    const hash = bcrypt.hashSync('julio2000', 10);
    db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)')
      .run(uuidv4(), 'sgalindo@outlook.com', hash, 'Admin', 'admin');
  }

  // Seed demo data
  const projectCount = db.prepare('SELECT COUNT(*) as cnt FROM projects').get();
  if (projectCount && projectCount.cnt === 0) {
  const hash = bcrypt.hashSync('demo123', 10);
  const bizId = uuidv4();
  const invId = uuidv4();

  db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)')
    .run(bizId, 'greentech@demo.com', hash, 'GreenTech Ventures', 'business');
  db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)')
    .run(invId, 'investor@demo.com', hash, 'Demo Investor', 'investor');

  const projects = [
    { id: uuidv4(), name: 'GreenTech Solar Farm', freq: 'quarterly', rate: 8.5, pool: 500000, funded: 320000, cat: 'Energy', risk: 'low', dur: 24, status: 'active' },
    { id: uuidv4(), name: 'Urban Logistics Hub', freq: 'monthly', rate: 11.2, pool: 250000, funded: 180000, cat: 'Logistics', risk: 'medium', dur: 18, status: 'active' },
    { id: uuidv4(), name: 'AgriTech Platform', freq: 'annual', rate: 15.0, pool: 1000000, funded: 450000, cat: 'Agriculture', risk: 'medium', dur: 36, status: 'active' },
    { id: uuidv4(), name: 'PropTech Rental Fund', freq: 'monthly', rate: 9.8, pool: 750000, funded: 750000, cat: 'Real Estate', risk: 'low', dur: 60, status: 'active' },
    { id: uuidv4(), name: 'FinTech Payment Rail', freq: 'quarterly', rate: 13.5, pool: 300000, funded: 90000, cat: 'Finance', risk: 'high', dur: 12, status: 'active' },
  ];

  const insertProject = db.prepare(`
    INSERT INTO projects (id, user_id, name, description, payout_frequency, interest_rate, min_investment, total_pool, funded_amount, category, risk_level, duration_months, status, payment_status, start_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'))
  `);
  const insertRating = db.prepare(`
    INSERT INTO ratings (id, project_id, investor_id, payout_reliability, transparency, overall, feedback)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of projects) {
    insertProject.run(p.id, bizId, p.name,
      `${p.name} is a ${p.risk} risk investment opportunity in the ${p.cat} sector offering ${p.rate}% annual returns paid ${p.freq}.`,
      p.freq, p.rate, 1000, p.pool, p.funded, p.cat, p.risk, p.dur, p.status, 'paid'
    );
    insertRating.run(uuidv4(), p.id, invId,
      Math.floor(Math.random() * 2) + 4,
      Math.floor(Math.random() * 2) + 3,
      Math.floor(Math.random() * 2) + 4,
      'Great returns and transparent communication.'
    );
  }

    // Seed an investment
    const projId = projects[0].id;
    const invInvestId = uuidv4();
    db.prepare('INSERT INTO investments (id, investor_id, project_id, amount, purchase_price, current_value) VALUES (?,?,?,?,?,?)')
      .run(invInvestId, invId, projId, 5000, 5000, 5212.5);
  }
}

module.exports = db;
