'use strict';

require('dotenv').config();

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const compression = require('compression');
const rateLimit  = require('express-rate-limit');

const { connectDB, pool }  = require('./config/db');
const { connectRedis, redis } = require('./config/redis');
const routes       = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Security & transport ──────────────────────────────────────── */

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin:      process.env.CORS_ORIGIN?.split(',') || '*',
  methods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(compression());

/* ── Parsing ────────────────────────────────────────────────────── */

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false }));

/* ── Rate limiting ──────────────────────────────────────────────── */

app.use('/api', rateLimit({
  windowMs: 60_000,   // 1 minute
  max:      120,      // 120 req/min per IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: 'Too many requests — slow down.' },
}));

/* ── Health ─────────────────────────────────────────────────────── */

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    await redis.ping();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'degraded', error: err.message });
  }
});

/* ── API routes ─────────────────────────────────────────────────── */

app.use('/api/v1', routes);

/* ── 404 catch ──────────────────────────────────────────────────── */

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

/* ── Global error handler ───────────────────────────────────────── */

app.use(errorHandler);

/* ── Boot ────────────────────────────────────────────────────────── */

async function start() {
  await connectDB();
  await connectRedis();

  const server = app.listen(PORT, () => {
    console.log(`[server] listening on port ${PORT} (${process.env.NODE_ENV})`);
  });

  /* Graceful shutdown — drain connections before exit */
  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received — shutting down`);
    server.close(async () => {
      await pool.end();
      redis.disconnect();
      console.log('[server] shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});

module.exports = app; // for testing
