'use strict';

window.DG = window.DG || {};

/* ================================================================
   DG.cart — localStorage-backed cart state manager
   ================================================================ */

DG.cart = (() => {
  const KEY = 'dg-cart-v1';

  /* ── Persistence ─────────────────────────────────────────── */

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { items: [] };
    } catch {
      return { items: [] };
    }
  }

  function save(state) {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('dg:cart:updated', { detail: state }));
  }

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
    return getItems().reduce((sum, item) => {
      const product = DG.getProductById(item.productId);
      if (!product) return sum;
      const price = DG.getDisplayPrice(product);
      return sum + price * item.quantity;
    }, 0);
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
