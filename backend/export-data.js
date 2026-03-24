/**
 * Export data from SQLite to JSON
 * Then we'll import to Supabase
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, 'marketplace.db'));

const tables = [
  'users',
  'projects',
  'deposits',
  'investments',
  'payouts',
  'project_files',
  'ratings',
  'market_listings'
];

const data = {};

tables.forEach(table => {
  try {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    data[table] = rows;
    console.log(`✓ Exported ${table}: ${rows.length} rows`);
  } catch (err) {
    console.log(`⚠ Table ${table} not found or error: ${err.message}`);
    data[table] = [];
  }
});

// Save to JSON
const outputFile = path.join(__dirname, 'exported-data.json');
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
console.log(`\n✓ Data exported to: ${outputFile}`);

// Create SQL insert statements
let sqlStatements = '';

Object.entries(data).forEach(([table, rows]) => {
  if (rows.length === 0) return;

  rows.forEach(row => {
    const columns = Object.keys(row);
    const values = columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
      if (typeof val === 'boolean') return val ? '1' : '0';
      return val;
    });

    sqlStatements += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
  });
});

const sqlFile = path.join(__dirname, 'insert-data.sql');
fs.writeFileSync(sqlFile, sqlStatements);
console.log(`✓ SQL statements generated: ${sqlFile}`);

db.close();
