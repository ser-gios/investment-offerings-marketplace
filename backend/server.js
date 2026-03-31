// Disable SSL certificate verification globally for development/Supabase pooler
// This allows self-signed certificates from pooler.supabase.com
if (process.env.NODE_ENV !== 'production' || process.env.DATABASE_URL?.includes('pooler')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - permissive for all origins
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Increase payload size limit for image uploads (base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/deposits', require('./routes/deposits'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Debug endpoints (no auth required)
const dbAsync = require('./db-wrapper');
app.post('/api/init-db', async (req, res) => {
  try {
    // Create project_files table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS project_files (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `, []);
    
    // Create ratings table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS ratings (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        investor_id TEXT NOT NULL,
        payout_reliability REAL,
        transparency REAL,
        overall REAL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (investor_id) REFERENCES users(id)
      )
    `, []);
    
    // Add new columns to projects table if they don't exist
    try {
      await dbAsync.run(`ALTER TABLE projects ADD COLUMN website_url TEXT`, []);
    } catch (e) {
      // Column might already exist
    }
    try {
      await dbAsync.run(`ALTER TABLE projects ADD COLUMN presentation_url TEXT`, []);
    } catch (e) {
      // Column might already exist
    }
    try {
      await dbAsync.run(`ALTER TABLE projects ADD COLUMN project_image TEXT`, []);
    } catch (e) {
      // Column might already exist
    }

    // Create platform configuration table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS platform_config (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `, []);

    // Create account transactions table for audit trail
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS account_transactions (
        id TEXT PRIMARY KEY,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        transaction_type TEXT NOT NULL,
        reference_id TEXT,
        reference_type TEXT,
        description TEXT,
        fee_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (from_user_id) REFERENCES users(id),
        FOREIGN KEY (to_user_id) REFERENCES users(id)
      )
    `, []);

    // Initialize platform configuration with default commission fee (3%)
    try {
      const existingConfig = await dbAsync.query(
        `SELECT value FROM platform_config WHERE key = ?`,
        ['commission_percentage']
      );
      if (!existingConfig) {
        const configId = require('uuid').v4();
        await dbAsync.run(
          `INSERT INTO platform_config (id, key, value, description) VALUES (?, ?, ?, ?)`,
          [configId, 'commission_percentage', '3', 'Porcentaje de comisión de inversiones (ej: 3 para 3%)']
        );
      }
    } catch (e) {
      console.warn('Could not initialize commission config:', e.message);
    }
    
    res.json({ success: true, message: 'Database tables initialized and updated' });
  } catch (e) {
    console.error('Init DB error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Auto-initialize database on startup
async function initializeDatabase() {
  try {
    console.log('Auto-initializing database...');
    // Create project_files table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS project_files (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `, []);
    
    // Create ratings table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS ratings (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        investor_id TEXT NOT NULL,
        payout_reliability REAL,
        transparency REAL,
        overall REAL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (investor_id) REFERENCES users(id)
      )
    `, []);
    
    // Add new columns to projects table if they don't exist
    try {
      await dbAsync.run(`ALTER TABLE projects ADD COLUMN website_url TEXT`, []);
    } catch (e) {
      // Column might already exist
    }
    try {
      await dbAsync.run(`ALTER TABLE projects ADD COLUMN presentation_url TEXT`, []);
    } catch (e) {
      // Column might already exist
    }
    try {
      await dbAsync.run(`ALTER TABLE projects ADD COLUMN project_image TEXT`, []);
    } catch (e) {
      // Column might already exist
    }

    // Create platform configuration table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS platform_config (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `, []);

    // Create account transactions table for audit trail
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS account_transactions (
        id TEXT PRIMARY KEY,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        transaction_type TEXT NOT NULL,
        reference_id TEXT,
        reference_type TEXT,
        description TEXT,
        fee_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (from_user_id) REFERENCES users(id),
        FOREIGN KEY (to_user_id) REFERENCES users(id)
      )
    `, []);

    // Initialize platform configuration with default commission fee (3%)
    try {
      const existingConfig = await dbAsync.query(
        `SELECT value FROM platform_config WHERE key = ?`,
        ['commission_percentage']
      );
      if (!existingConfig) {
        const configId = require('uuid').v4();
        await dbAsync.run(
          `INSERT INTO platform_config (id, key, value, description) VALUES (?, ?, ?, ?)`,
          [configId, 'commission_percentage', '3', 'Porcentaje de comisión de inversiones (ej: 3 para 3%)']
        );
      }
    } catch (e) {
      console.warn('Could not initialize commission config:', e.message);
    }
    
    console.log('✓ Database initialized successfully');
  } catch (e) {
    console.error('Failed to auto-initialize database:', e.message);
  }
}

app.listen(PORT, async () => {
  console.log(`NexVest API running on port ${PORT}`);
  await initializeDatabase();
});
