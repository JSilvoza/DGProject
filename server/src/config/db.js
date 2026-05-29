'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  connectionString:    process.env.DATABASE_URL,
  max:                 20,   // max connections in pool
  idleTimeoutMillis:   30_000,
  connectionTimeoutMillis: 3_000,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('[db] idle client error:', err.message);
});

/* Convenience wrapper — returns rows directly */
async function query(sql, params) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

/* Wraps multiple queries in a single transaction */
async function transaction(fn) {
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
}

async function connectDB() {
  const client = await pool.connect();
  client.release();
  console.log('[db] connected to PostgreSQL');
}

module.exports = { pool, query, transaction, connectDB };
