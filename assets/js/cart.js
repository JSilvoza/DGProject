'use strict';

window.DG = window.DG || {};

/* ================================================================
   DG.cart — localStorage-backed cart state manager
   ================================================================ */

DG.cart = (() => {
  const KEY = 'dg-cart-v1';

  /* ── Persistence ─────────────────────────────────────────── */

  /* In-memory parse cache: avoids re-parsing localStorage on every
     getCount/getItems/getSubtotal call within the same JS task.
     Invalidated on every save() and on storage events from other tabs. */
  let _cache = null;

  function load() {
    if (_cache) return _cache;
    try {
      _cache = JSON.parse(localStorage.getItem(KEY)) || { items: [] };
    } catch {
      _cache = { items: [] };
    }
    return _cache;
  }

  function save(state) {
    _cache = null; // invalidate before write so next load() re-parses
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('dg:cart:updated', { detail: state }));
  }

  /* Cross-tab invalidation: another tab wrote to localStorage */
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) _cache = null;
  });

  /* ── Read ─────────────────────────────────────────────────── */

  function getState() {
    return load();
  }

  function getItems() {
    return load().items;
  }

  function getCount() {
    return getItems().reduce((sum, item) => sum + item.quantity, 0);
  }

  function getSubtotal() {
    /* Use snapshot price stored at add-time — avoids getProductById lookup
       per item and removes the products.js dependency from cart/checkout. */
    return getItems().reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  }

  function isEmpty() {
    return getItems().length === 0;
  }

  function hasItem(productId, size, color) {
    return getItems().some(
      i => i.productId === productId && i.size === size && i.color === color
    );
  }

  /* ── Write ────────────────────────────────────────────────── */

  function addItem(productId, size, color, quantity = 1) {
    const state = load();
    const existing = state.items.find(
      i => i.productId === productId && i.size === size && i.color === color
    );

    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, 10);
    } else {
      const product = DG.getProductById(productId);
      state.items.push({
        id:        `${productId}-${size}-${color}-${Date.now()}`,
        productId,
        slug:      product ? product.slug  : '',  // stored so cart.html needs no product lookup
        size,
        color,
        quantity:  Math.min(quantity, 10),
        name:      product ? product.name : '',
        price:     product ? DG.getDisplayPrice(product) : 0,
        image:     product ? product.images[0] : '',
        addedAt:   new Date().toISOString(),
      });
    }

    save(state);
    return true;
  }

  function removeItem(itemId) {
    const state = load();
    state.items = state.items.filter(i => i.id !== itemId);
    save(state);
  }

  function updateQuantity(itemId, quantity) {
    const state = load();
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    if (quantity < 1) {
      state.items = state.items.filter(i => i.id !== itemId);
    } else {
      item.quantity = Math.min(quantity, 10);
    }
    save(state);
  }

  function clearCart() {
    save({ items: [] });
  }

  /* ── Shipping ─────────────────────────────────────────────── */

  const SHIPPING_THRESHOLD = 150;  // free standard shipping above this
  const STANDARD_SHIPPING  = 9.95;
  const EXPRESS_SHIPPING   = 19.95;
  const OVERNIGHT_SHIPPING = 39.95;

  function getShipping() {
    return getSubtotal() >= SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  }

  function getTotal() {
    const sub = getSubtotal(); // single localStorage read
    return sub + (sub >= SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING);
  }

  /* ── Promo codes ──────────────────────────────────────────── */

  const PROMO_CODES = {
    'WELCOME10': 0.10,
    'DG20':      0.20,
    'VOID15':    0.15,
  };

  function applyPromo(code) {
    const rate = PROMO_CODES[code.toUpperCase()];
    if (!rate) return null;
    return {
      code: code.toUpperCase(),
      rate,
      discount: +(getSubtotal() * rate).toFixed(2),
    };
  }

  return {
    getState, getItems, getCount, getSubtotal,
    isEmpty, hasItem,
    addItem, removeItem, updateQuantity, clearCart,
    getShipping, getTotal, applyPromo,
    SHIPPING_THRESHOLD, STANDARD_SHIPPING, EXPRESS_SHIPPING, OVERNIGHT_SHIPPING,
  };
})();
