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

app.use(express.json());
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

app.listen(PORT, () => console.log(`NexVest API running on port ${PORT}`));
