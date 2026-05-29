/**
 * infrastructure/storage.js — Cart persistence.
 * The ONLY place in the codebase that touches localStorage.
 */

const KEY = 'dg-cart-v1';
let _cache = null;

export function loadCart() {
  if (_cache) return _cache;
  try {
    _cache = JSON.parse(localStorage.getItem(KEY)) ?? { items: [] };
  } catch {
    _cache = { items: [] };
  }
  return _cache;
}

export function saveCart(state) {
  _cache = null;
  localStorage.setItem(KEY, JSON.stringify({
    ...state,
    updatedAt: new Date().toISOString(),
  }));
}

/* Invalidate in-memory cache if another tab writes to the same key */
window.addEventListener('storage', (e) => {
  if (e.key === KEY) _cache = null;
});
