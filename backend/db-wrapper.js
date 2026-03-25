// Database wrapper that handles both SQLite (sync) and PostgreSQL (async)
const db = require('./db');

// For PostgreSQL, we need async versions
// This wrapper makes it easy to use

module.exports = {
  // Sync methods for SQLite compatibility
  prepare: db.prepare,
  exec: db.exec,
  
  // Async methods for both SQLite and PostgreSQL
  async query(sql, params = []) {
    if (process.env.DATABASE_URL) {
      // PostgreSQL: use async
      return await db.prepareAsync(sql).getAsync(...params);
    } else {
      // SQLite: use sync
      return db.prepare(sql).get(...params);
    }
  },
  
  async queryAll(sql, params = []) {
    if (process.env.DATABASE_URL) {
      // PostgreSQL: use async
      return await db.prepareAsync(sql).allAsync(...params);
    } else {
      // SQLite: use sync
      return db.prepare(sql).all(...params);
    }
  },
  
  async run(sql, params = []) {
    if (process.env.DATABASE_URL) {
      // PostgreSQL: use async
      return await db.prepareAsync(sql).runAsync(...params);
    } else {
      // SQLite: use sync
      return db.prepare(sql).run(...params);
    }
  },
  
  async exec(sql) {
    if (process.env.DATABASE_URL) {
      // PostgreSQL: use async
      return await db.execAsync(sql);
    } else {
      // SQLite: use sync
      return db.exec(sql);
    }
  }
};
