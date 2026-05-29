'use strict';

const cartModel                       = require('../models/cart');
const { query }                       = require('../config/db');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');

const TTL_CART      = Number(process.env.TTL_CART || 3600);
const SHIPPING_STD  = 995;   // $9.95 in cents
const SHIPPING_EXP  = 1995;  // $19.95
const SHIPPING_OVNT = 3995;  // $39.95
const FREE_THRESHOLD = 15000; // $150.00

function cartKey(id) { return `dg:cart:${id}`; }

/* ── Read ─────────────────────────────────────────────────────────── */

async function getCart(cartId) {
  const cached = await cacheGet(cartKey(cartId));
  if (cached) return cached;

  const cart = await cartModel.getById(cartId);
  if (!cart) return null;

  const enriched = _enrich(cart);
  await cacheSet(cartKey(cartId), enriched, TTL_CART);
  return enriched;
}

/* ── Write ────────────────────────────────────────────────────────── */

async function createCart() {
  const cart = await cartModel.create();
  return cart.id;
}

async function addItem(cartId, { variantId, quantity = 1 }) {
  /* Validate variant exists and has enough stock */
  const variants = await query(
    'SELECT id, product_id, stock, price_cents FROM product_variants WHERE id=$1',
    [variantId]
  );
  const variant = variants[0];
  if (!variant) throw Object.assign(new Error('Variant not found'), { status: 404 });
  if (variant.stock < quantity) throw Object.assign(new Error('Insufficient stock'), { status: 409 });

  /* Use current product price (not sale — getDisplayPrice handled client-side) */
  const products = await query(
    'SELECT COALESCE(sale_price_cents, price_cents) AS price FROM products WHERE id=$1',
    [variant.product_id]
  );
  const priceCents = products[0]?.price ?? variant.price_cents;

  await cartModel.addItem(cartId, variant.product_id, variantId, quantity, priceCents);
  await cartModel.touchExpiry(cartId);
  await cacheDel(cartKey(cartId));
  return getCart(cartId);
}

async function updateItem(cartId, itemId, quantity) {
  const rows = await cartModel.updateItem(cartId, itemId, quantity);
  if (!rows.length) throw Object.assign(new Error('Item not found'), { status: 404 });
  await cacheDel(cartKey(cartId));
  return getCart(cartId);
}

async function removeItem(cartId, itemId) {
  await cartModel.removeItem(cartId, itemId);
  await cacheDel(cartKey(cartId));
  return getCart(cartId);
}

async function clearCart(cartId) {
  await cartModel.clear(cartId);
  await cacheDel(cartKey(cartId));
}

/* ── Totals ───────────────────────────────────────────────────────── */

function _enrich(cart) {
  const subtotal = cart.items.reduce((s, i) => s + i.price_cents * i.quantity, 0);
  const shipping = _shippingCents('standard', subtotal);
  const total    = subtotal + shipping;
  return { ...cart, subtotal_cents: subtotal, shipping_cents: shipping, total_cents: total };
}

function _shippingCents(method, subtotalCents) {
  if (subtotalCents >= FREE_THRESHOLD) return 0;
  if (method === 'express')   return SHIPPING_EXP;
  if (method === 'overnight') return SHIPPING_OVNT;
  return SHIPPING_STD;
}

module.exports = {
  createCart, getCart, addItem, updateItem, removeItem, clearCart,
  _shippingCents, FREE_THRESHOLD,
};
