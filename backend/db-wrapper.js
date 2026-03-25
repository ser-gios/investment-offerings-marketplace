// Database wrapper that handles both SQLite (sync) and PostgreSQL (async)
const db = require('./db');

// Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
function convertPlaceholders(sql) {
  if (!process.env.DATABASE_URL) return sql; // SQLite doesn't need conversion
  
  let paramCount = 0;
  return sql.replace(/\?/g, () => {
    paramCount++;
    return `$${paramCount}`;
  });
}

// For PostgreSQL, we need async versions
// This wrapper makes it easy to use

module.exports = {
  // Sync methods for SQLite compatibility
  prepare: db.prepare,
  exec: db.exec,
  
  // Async methods for both SQLite and PostgreSQL
  async query(sql, params = []) {
    if (process.env.DATABASE_URL) {
      // PostgreSQL: use async with converted placeholders
      const pgSql = convertPlaceholders(sql);
      return await db.prepareAsync(pgSql).getAsync(...params);
    } else {
      // SQLite: use sync
      return db.prepare(sql).get(...params);
    }
  },
  
  async queryAll(sql, params = []) {
    if (process.env.DATABASE_URL) {
      // PostgreSQL: use async with converted placeholders
      const pgSql = convertPlaceholders(sql);
      return await db.prepareAsync(pgSql).allAsync(...params);
    } else {
      // SQLite: use sync
      return db.prepare(sql).all(...params);
    }
  },
  
  async run(sql, params = []) {
    if (process.env.DATABASE_URL) {
      // PostgreSQL: use async with converted placeholders
      const pgSql = convertPlaceholders(sql);
      return await db.prepareAsync(pgSql).runAsync(...params);
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
