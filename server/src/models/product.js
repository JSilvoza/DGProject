'use strict';

const { query } = require('../config/db');

/* ── SQL fragments shared across queries ─────────────────────────── */

const PRODUCT_COLS = `
  p.id, p.slug, p.name, p.category, p.subcategory,
  p.description, p.short_description,
  p.price_cents, p.sale_price_cents, p.badge,
  p.is_new, p.is_bestseller, p.rating, p.review_count
`;

/* Aggregates images, variants, details, care into the product row */
const WITH_AGGREGATES = `
  WITH product_data AS (
    SELECT ${PRODUCT_COLS},
      COALESCE(
        (SELECT json_agg(json_build_object('url', pi.url) ORDER BY pi.position)
         FROM product_images pi WHERE pi.product_id = p.id),
        '[]'
      ) AS images,
      COALESCE(
        (SELECT json_agg(json_build_object('id', pv.id, 'size', pv.size, 'colorName', pv.color_name, 'colorHex', pv.color_hex, 'stock', pv.stock, 'sku', pv.sku))
         FROM product_variants pv WHERE pv.product_id = p.id),
        '[]'
      ) AS variants,
      COALESCE(
        (SELECT json_agg(pd.detail ORDER BY pd.position)
         FROM product_details pd WHERE pd.product_id = p.id),
        '[]'
      ) AS details,
      COALESCE(
        (SELECT json_agg(pc.instruction ORDER BY pc.position)
         FROM product_care pc WHERE pc.product_id = p.id),
        '[]'
      ) AS care
    FROM products p
    WHERE p.active = TRUE
  )
`;

/* ── Queries ─────────────────────────────────────────────────────── */

const SORT_MAP = {
  featured:    'p.is_bestseller DESC, p.review_count DESC',
  newest:      'p.is_new DESC, p.created_at DESC',
  bestseller:  'p.is_bestseller DESC, p.review_count DESC',
  'price-asc': 'COALESCE(p.sale_price_cents, p.price_cents) ASC',
  'price-desc':'COALESCE(p.sale_price_cents, p.price_cents) DESC',
  rating:      'p.rating DESC',
};

async function getAll({ category, filter, minPrice, maxPrice, sort = 'featured', page = 1, limit = 20 } = {}) {
  const conditions = ['p.active = TRUE'];
  const params     = [];
  let   p          = 1;

  if (category) {
    conditions.push(`p.category = $${p++}`);
    params.push(category);
  }
  if (filter === 'new')        { conditions.push('p.is_new = TRUE'); }
  if (filter === 'sale')       { conditions.push('p.sale_price_cents IS NOT NULL'); }
  if (filter === 'bestseller') { conditions.push('p.is_bestseller = TRUE'); }

  if (minPrice != null) {
    conditions.push(`COALESCE(p.sale_price_cents, p.price_cents) >= $${p++}`);
    params.push(Math.round(minPrice * 100));
  }
  if (maxPrice != null) {
    conditions.push(`COALESCE(p.sale_price_cents, p.price_cents) <= $${p++}`);
    params.push(Math.round(maxPrice * 100));
  }

  const orderBy = SORT_MAP[sort] || SORT_MAP.featured;
  const offset  = (Math.max(1, page) - 1) * limit;

  params.push(limit, offset);

  const rows = await query(`
    SELECT ${PRODUCT_COLS},
      (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS cover_image,
      (SELECT json_agg(json_build_object('name', pv.color_name, 'hex', pv.color_hex) ORDER BY pv.id)
       FROM (SELECT DISTINCT ON (color_name) * FROM product_variants WHERE product_id = p.id) pv) AS colors,
      (SELECT json_agg(DISTINCT pv.size) FROM product_variants pv WHERE pv.product_id = p.id) AS sizes,
      COUNT(*) OVER() AS total_count
    FROM products p
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT $${p++} OFFSET $${p}
  `, params);

  const total = rows[0]?.total_count ?? 0;
  return {
    products: rows.map(({ total_count, ...r }) => r),
    pagination: { total: Number(total), page, limit, pages: Math.ceil(total / limit) },
  };
}

async function getBySlug(slug) {
  const rows = await query(`
    ${WITH_AGGREGATES}
    SELECT * FROM product_data WHERE slug = $1 LIMIT 1
  `, [slug]);
  return rows[0] || null;
}

async function getRelated(productId, limit = 4) {
  return query(`
    SELECT ${PRODUCT_COLS},
      (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS cover_image
    FROM products p
    JOIN product_related pr ON pr.related_id = p.id
    WHERE pr.product_id = $1 AND p.active = TRUE
    LIMIT $2
  `, [productId, limit]);
}

async function search(q, limit = 10) {
  return query(`
    SELECT ${PRODUCT_COLS},
      (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS cover_image,
      similarity(p.name, $1) AS score
    FROM products p
    WHERE p.active = TRUE AND p.name % $1
    ORDER BY score DESC
    LIMIT $2
  `, [q, limit]);
}

module.exports = { getAll, getBySlug, getRelated, search };
