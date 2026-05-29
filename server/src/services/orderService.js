'use strict';

const orderModel             = require('../models/order');
const cartService            = require('./cartService');
const { query }              = require('../config/db');

const PROMO_CODES = {
  WELCOME10: { rate: 0.10, minCents: 0 },
  DG20:      { rate: 0.20, minCents: 10000 },
  VOID15:    { rate: 0.15, minCents: 5000  },
};

/* ── Promo validation ─────────────────────────────────────────────── */

async function validatePromo(code, subtotalCents) {
  const rows = await query(`
    SELECT code, discount_rate, max_uses, uses_count, min_order_cents, expires_at
    FROM promo_codes
    WHERE code = $1 AND active = TRUE
  `, [code.toUpperCase()]);

  const promo = rows[0];
  if (!promo)                                       throw Object.assign(new Error('Invalid promo code'),         { status: 422 });
  if (promo.expires_at && promo.expires_at < new Date()) throw Object.assign(new Error('Promo code has expired'),    { status: 422 });
  if (promo.max_uses && promo.uses_count >= promo.max_uses) throw Object.assign(new Error('Promo code is exhausted'), { status: 422 });
  if (subtotalCents < promo.min_order_cents)        throw Object.assign(new Error(`Minimum order ${promo.min_order_cents / 100} required`), { status: 422 });

  const discount = Math.round(subtotalCents * promo.discount_rate);
  return { code: promo.code, rate: Number(promo.discount_rate), discountCents: discount };
}

/* ── Order creation ───────────────────────────────────────────────── */

async function createOrder(cartId, { email, address, shippingMethod = 'standard', promoCode }) {
  const cart = await cartService.getCart(cartId);
  if (!cart)          throw Object.assign(new Error('Cart not found'), { status: 404 });
  if (!cart.items.length) throw Object.assign(new Error('Cart is empty'),   { status: 422 });

  const subtotalCents = cart.subtotal_cents;

  /* Validate + compute promo */
  let discountCents = 0;
  let validatedCode = null;
  if (promoCode) {
    const promo = await validatePromo(promoCode, subtotalCents);
    discountCents = promo.discountCents;
    validatedCode = promo.code;
  }

  const shippingCents = cartService._shippingCents(shippingMethod, subtotalCents);
  const totalCents    = subtotalCents + shippingCents - discountCents;

  /* Map cart items to order item shape */
  const items = cart.items.map(i => ({
    productId:  i.product_id,
    variantId:  i.variant_id,
    quantity:   i.quantity,
    priceCents: i.price_cents,
    name:       i.name,
    slug:       i.slug,
    size:       i.size,
    colorName:  i.color_name,
  }));

  /* Create order in DB (transaction handles stock decrement) */
  const order = await orderModel.create({
    email, userId: null, items,
    subtotalCents, shippingCents, discountCents, totalCents,
    shippingMethod, promoCode: validatedCode, address,
  });

  /* Clear the cart after successful order */
  await cartService.clearCart(cartId);

  return orderModel.getById(order.id);
}

async function getOrder(orderId) {
  return orderModel.getById(orderId);
}

module.exports = { createOrder, getOrder, validatePromo };
