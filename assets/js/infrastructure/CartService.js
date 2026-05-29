/**
 * infrastructure/CartService.js — Application service.
 * Wires the pure domain functions to storage and the event bus.
 * This is the only layer that coordinates domain + infrastructure.
 * Pages and components import from here, not from domain/cart.js directly.
 */

import { loadCart, saveCart }       from './storage.js';
import { emit }                     from './events.js';
import * as Cart                    from '../domain/cart.js';

/* ── Internal helper ─────────────────────────────────────────────
   Applies a pure domain transition, persists the result, and
   broadcasts the change so all listeners (badge, cart page) update. */

function mutate(transform) {
  const next = transform(loadCart());
  saveCart(next);
  emit('dg:cart:updated', { ...next, count: Cart.getCount(next) });
  return next;
}

/* ── Write operations ────────────────────────────────────────────
   Each accepts the minimum data needed; slug is stored so the cart
   page can link to the PDP without loading the product catalog. */

export function addItem(productId, slug, size, color, price, name, image, quantity = 1) {
  return mutate(s => Cart.addItem(s, { productId, slug, size, color, price, name, image, quantity }));
}

export function removeItem(itemId) {
  return mutate(s => Cart.removeItem(s, itemId));
}

export function updateQuantity(itemId, quantity) {
  return mutate(s => Cart.updateQuantity(s, itemId, quantity));
}

export function clearCart() {
  return mutate(() => Cart.createState());
}

/* ── Read operations (no mutation, no event) ─────────────────── */

export function getState()    { return loadCart(); }
export function getItems()    { return loadCart().items; }
export function getCount()    { return Cart.getCount(loadCart()); }
export function getSubtotal() { return Cart.getSubtotal(loadCart()); }
export function isEmpty()     { return Cart.isEmpty(loadCart()); }

export function getShipping(method = 'standard') {
  return Cart.getShipping(getSubtotal(), method);
}

export function getTotal(method = 'standard', discount = 0) {
  return Cart.getTotal(loadCart(), method, discount);
}

export function validatePromo(code) {
  return Cart.validatePromo(code, getSubtotal());
}

/* Re-export constants so callers only import from one place */
export const {
  SHIPPING_THRESHOLD,
  STANDARD_SHIPPING,
  EXPRESS_SHIPPING,
  OVERNIGHT_SHIPPING,
} = Cart;
