const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const USE_POSTGRES = process.env.DATABASE_URL ? true : false;

let pool = null;
let db = null;

if (USE_POSTGRES) {
  // PostgreSQL mode (Supabase)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // Simple wrapper to make PostgreSQL API similar to SQLite
  const dbAdapter = {
    prepare: (sql) => ({
      run: (...params) => {
        try {
          const result = pool.query(sql, params);
          return { changes: 1 };
        } catch (err) {
          throw err;
        }
      },
      get: async (...params) => {
        try {
          const result = await pool.query(sql, params);
          return result.rows[0];
        } catch (err) {
          throw err;
        }
      },
      all: async (...params) => {
        try {
          const result = await pool.query(sql, params);
          return result.rows;
        } catch (err) {
          throw err;
        }
      }
    }),
    exec: async (sql) => {
      try {
        await pool.query(sql);
      } catch (err) {
        throw err;
      }
    },
    transaction: (fn) => {
      return async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await fn(client);
          await client.query('COMMIT');
          return result;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      };
    }
  };

  module.exports = dbAdapter;
} else {
  // SQLite mode (local development)
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  db = new Database(path.join(__dirname, 'marketplace.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'investor',
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
      payout_frequency TEXT NOT NULL,
      interest_rate REAL NOT NULL,
      min_investment REAL NOT NULL DEFAULT 1000,
      max_investment REAL,
      total_pool REAL NOT NULL DEFAULT 0,
      funded_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      category TEXT,
      risk_level TEXT DEFAULT 'medium',
      duration_months INTEGER NOT NULL DEFAULT 12,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY,
      investor_id TEXT NOT NULL,
      amount REAL NOT NULL,
      tx_hash TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      blockchain_verified INTEGER DEFAULT 0,
      confirmation_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (investor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      investor_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      paid_from_balance INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (investor_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS project_files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      size INTEGER NOT NULL,
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS payouts (
      id TEXT PRIMARY KEY,
      investor_id TEXT NOT NULL,
      investment_id TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payout_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (investor_id) REFERENCES users(id),
      FOREIGN KEY (investment_id) REFERENCES investments(id)
    );
  `);

  module.exports = db;
}
