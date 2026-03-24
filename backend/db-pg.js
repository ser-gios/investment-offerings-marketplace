/**
 * PostgreSQL Database Adapter (Synchronous wrapper for Supabase)
 * Mimics SQLite API using pg library
 */

const { Client } = require('pg');
let client = null;

async function initDB() {
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not set, using SQLite');
    return require('./db');
  }

  console.log('✓ Initializing PostgreSQL connection...');
  client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✓ Connected to PostgreSQL');

  return {
    prepare: (sql) => ({
      run: async (...params) => {
        try {
          const result = await client.query(sql, params);
          return { changes: result.rowCount };
        } catch (err) {
          throw new Error(err.message);
        }
      },
      get: async (...params) => {
        try {
          const result = await client.query(sql, params);
          return result.rows[0];
        } catch (err) {
          throw new Error(err.message);
        }
      },
      all: async (...params) => {
        try {
          const result = await client.query(sql, params);
          return result.rows;
        } catch (err) {
          throw new Error(err.message);
        }
      }
    }),
    exec: async (sql) => {
      try {
        await client.query(sql);
      } catch (err) {
        throw new Error(err.message);
      }
    }
  };
}

module.exports = initDB();
