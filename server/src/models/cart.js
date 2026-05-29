'use strict';

const { query, transaction } = require('../config/db');

const CART_ITEM_COLS = `
  ci.id, ci.cart_id, ci.quantity, ci.price_cents, ci.added_at,
  p.id AS product_id, p.slug, p.name, p.category,
  pv.id AS variant_id, pv.size, pv.color_name, pv.color_hex, pv.stock,
  (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image
`;

async function create(sessionId = null, userId = null) {
  const rows = await query(`
    INSERT INTO carts (session_id, user_id)
    VALUES ($1, $2)
    RETURNING id, created_at
  `, [sessionId, userId]);
  return rows[0];
}

async function getById(cartId) {
  const carts = await query(
    'SELECT id, user_id, session_id, expires_at FROM carts WHERE id = $1',
    [cartId]
  );
  if (!carts[0]) return null;

  const items = await query(`
    SELECT ${CART_ITEM_COLS}
    FROM cart_items ci
    JOIN products p  ON p.id  = ci.product_id
    JOIN product_variants pv ON pv.id = ci.variant_id
    WHERE ci.cart_id = $1
    ORDER BY ci.added_at
  `, [cartId]);

  return { ...carts[0], items };
}

async function addItem(cartId, productId, variantId, quantity, priceCents) {
  return query(`
    INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, price_cents)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (cart_id, variant_id) DO UPDATE
      SET quantity   = LEAST(cart_items.quantity + EXCLUDED.quantity, 10),
          price_cents = EXCLUDED.price_cents
    RETURNING id, quantity, price_cents
  `, [cartId, productId, variantId, quantity, priceCents]);
}

async function updateItem(cartId, itemId, quantity) {
  if (quantity < 1) {
    return query(
      'DELETE FROM cart_items WHERE id=$1 AND cart_id=$2 RETURNING id',
      [itemId, cartId]
    );
  }
  return query(`
    UPDATE cart_items
    SET quantity = LEAST($1, 10)
    WHERE id = $2 AND cart_id = $3
    RETURNING id, quantity
  `, [quantity, itemId, cartId]);
}

async function removeItem(cartId, itemId) {
  return query(
    'DELETE FROM cart_items WHERE id=$1 AND cart_id=$2 RETURNING id',
    [itemId, cartId]
  );
}

async function clear(cartId) {
  await query('DELETE FROM cart_items WHERE cart_id=$1', [cartId]);
  await query('UPDATE carts SET updated_at=NOW() WHERE id=$1', [cartId]);
}

async function touchExpiry(cartId) {
  await query(
    "UPDATE carts SET expires_at = NOW() + INTERVAL '30 days', updated_at = NOW() WHERE id=$1",
    [cartId]
  );
}

module.exports = { create, getById, addItem, updateItem, removeItem, clear, touchExpiry };
