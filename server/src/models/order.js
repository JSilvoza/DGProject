'use strict';

const { transaction, query } = require('../config/db');

async function create({ email, userId, items, subtotalCents, shippingCents,
                        discountCents, totalCents, shippingMethod, promoCode,
                        address }) {
  return transaction(async (client) => {
    /* 1. Create order */
    const [order] = (await client.query(`
      INSERT INTO orders
        (email, user_id, subtotal_cents, shipping_cents, discount_cents,
         total_cents, shipping_method, promo_code, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'confirmed')
      RETURNING id, status, created_at
    `, [email, userId ?? null, subtotalCents, shippingCents, discountCents,
        totalCents, shippingMethod, promoCode ?? null])).rows;

    /* 2. Insert order items (snapshot of product data) */
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items
          (order_id, product_id, variant_id, quantity, price_cents,
           product_name, product_slug, size, color_name)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, [order.id, item.productId, item.variantId, item.quantity,
          item.priceCents, item.name, item.slug, item.size, item.colorName]);
    }

    /* 3. Shipping address */
    await client.query(`
      INSERT INTO shipping_addresses
        (order_id, first_name, last_name, address1, address2, city, state, zip, country)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [order.id, address.firstName, address.lastName, address.address1,
        address.address2 ?? null, address.city, address.state, address.zip,
        address.country ?? 'US']);

    /* 4. Decrement stock inside the same transaction */
    for (const item of items) {
      const result = await client.query(`
        UPDATE product_variants
        SET stock = stock - $1
        WHERE id = $2 AND stock >= $1
        RETURNING id, stock
      `, [item.quantity, item.variantId]);

      if (!result.rows.length) {
        throw Object.assign(new Error(`Insufficient stock for variant ${item.variantId}`), { status: 409 });
      }
    }

    /* 5. Increment promo usage if applicable */
    if (promoCode) {
      await client.query(
        'UPDATE promo_codes SET uses_count = uses_count + 1 WHERE code = $1',
        [promoCode]
      );
    }

    return order;
  });
}

async function getById(orderId) {
  const orders = await query(`
    SELECT o.id, o.email, o.status, o.subtotal_cents, o.shipping_cents,
           o.discount_cents, o.total_cents, o.shipping_method, o.promo_code,
           o.created_at,
           row_to_json(sa.*) AS address
    FROM orders o
    LEFT JOIN shipping_addresses sa ON sa.order_id = o.id
    WHERE o.id = $1
  `, [orderId]);

  if (!orders[0]) return null;

  const items = await query(`
    SELECT id, quantity, price_cents, product_name, product_slug, size, color_name
    FROM order_items
    WHERE order_id = $1
    ORDER BY id
  `, [orderId]);

  return { ...orders[0], items };
}

module.exports = { create, getById };
