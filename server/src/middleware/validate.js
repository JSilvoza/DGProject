'use strict';

/* Throws a 400 error if required fields are missing or wrong type */
function require(fields, body) {
  const missing = fields.filter(f => body[f] == null || body[f] === '');
  if (missing.length) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }
}

/* Coerce and bound-check a numeric query param */
function intParam(val, defaultVal, min = 1, max = 1000) {
  const n = parseInt(val, 10);
  if (isNaN(n)) return defaultVal;
  return Math.min(Math.max(n, min), max);
}

/* Validate that a string looks like a UUID v4 */
function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function assertUUID(str, label = 'id') {
  if (!isUUID(str)) {
    const err = new Error(`Invalid ${label}`);
    err.status = 400;
    throw err;
  }
}

/* Validate email format */
function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(str));
}

module.exports = { require, intParam, isUUID, assertUUID, isEmail };
