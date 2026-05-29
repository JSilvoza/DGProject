'use strict';

require('dotenv').config();

const fs   = require('fs');
const path = require('path');
const { pool, connectDB } = require('../config/db');

async function migrate() {
  await connectDB();
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations', '001_initial.sql'),
    'utf8'
  );
  await pool.query(sql);
  console.log('[migrate] schema applied');
  await pool.end();
}

migrate().catch((err) => {
  console.error('[migrate] failed:', err.message);
  process.exit(1);
});
