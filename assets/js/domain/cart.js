/**
 * domain/cart.js — Immutable cart state transitions.
 * Pure functions only: take state, return new state.
 * Zero side effects. Zero DOM. Zero storage.
 */

export const SHIPPING_THRESHOLD = 150;
export const STANDARD_SHIPPING  = 9.95;
export const EXPRESS_SHIPPING   = 19.95;
export const OVERNIGHT_SHIPPING = 39.95;

export const PROMO_CODES = Object.freeze({
  WELCOME10: { rate: 0.10, min: 0   },
  DG20:      { rate: 0.20, min: 100 },
  VOID15:    { rate: 0.15, min: 50  },
});

export function createState() {
  return { items: [] };
}

export function addItem(state, { productId, slug, size, color, price, name, image, quantity = 1 }) {
  const existing = state.items.find(
    i => i.productId === productId && i.size === size && i.color === color
  );

  if (existing) {
    return {
      ...state,
      items: state.items.map(i =>
        i === existing
          ? { ...i, quantity: Math.min(i.quantity + quantity, 10) }
          : i
      ),
    };
  }

  return {
    ...state,
    items: [
      ...state.items,
      {
        id:        `${productId}-${size}-${color}-${Date.now()}`,
        productId, slug, size, color,
        quantity:  Math.min(quantity, 10),
        name, price, image,
        addedAt:   new Date().toISOString(),
      },
    ],
  };
}

export function removeItem(state, itemId) {
  return { ...state, items: state.items.filter(i => i.id !== itemId) };
}

export function updateQuantity(state, itemId, quantity) {
  if (quantity < 1) return removeItem(state, itemId);
  return {
    ...state,
    items: state.items.map(i =>
      i.id === itemId ? { ...i, quantity: Math.min(quantity, 10) } : i
    ),
  };
}

export function getCount(state) {
  return state.items.reduce((s, i) => s + i.quantity, 0);
}

export function getSubtotal(state) {
  return state.items.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0);
}

export function getShipping(subtotal, method = 'standard') {
  if (subtotal >= SHIPPING_THRESHOLD) return 0;
  if (method === 'express')           return EXPRESS_SHIPPING;
  if (method === 'overnight')         return OVERNIGHT_SHIPPING;
  return STANDARD_SHIPPING;
}

export function getTotal(state, method = 'standard', discount = 0) {
  const sub = getSubtotal(state);
  return sub + getShipping(sub, method) - discount;
}

export function validatePromo(code, subtotal) {
  const promo = PROMO_CODES[code?.toUpperCase()];
  if (!promo)               return null;
  if (subtotal < promo.min) return null;
  return {
    code:     code.toUpperCase(),
    rate:     promo.rate,
    discount: +(subtotal * promo.rate).toFixed(2),
  };
}

export function isEmpty(state) {
  return state.items.length === 0;
}
