'use strict';

const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck:     true,
  lazyConnect:          true,
});

redis.on('error', (err) => {
  console.error('[redis] connection error:', err.message);
});

async function connectRedis() {
  await redis.connect();
  console.log('[redis] connected');
}

/* ── Typed helpers ──────────────────────────────────────────────── */

async function cacheGet(key) {
  const raw = await redis.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
}

async function cacheSet(key, value, ttlSeconds) {
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, serialized);
  } else {
    await redis.set(key, serialized);
  }
}

async function cacheDel(...keys) {
  if (keys.length) await redis.del(...keys);
}

async function cacheGetOrSet(key, ttl, fetchFn) {
  const cached = await cacheGet(key);
  if (cached !== null) return cached;
  const value = await fetchFn();
  if (value !== null && value !== undefined) {
    await cacheSet(key, value, ttl);
  }
  return value;
}

module.exports = { redis, connectRedis, cacheGet, cacheSet, cacheDel, cacheGetOrSet };
