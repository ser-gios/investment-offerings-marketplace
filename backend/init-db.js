/**
 * Initialize database for Supabase or SQLite
 * Run this once after deployment
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
  const isPostgres = process.env.DATABASE_URL ? true : false;
  
  if (isPostgres) {
    console.log('✓ Using PostgreSQL (Supabase)');
    console.log('Database will be initialized via Supabase SQL Editor');
    console.log('See: backend/migrations/001_initial_schema.sql');
  } else {
    console.log('✓ Using SQLite (Local Development)');
    console.log('Database will be created automatically by db.js');
  }
}

initDatabase().catch(err => {
  console.error('Error initializing database:', err);
  process.exit(1);
});
