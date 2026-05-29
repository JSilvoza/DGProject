'use strict';

const productModel            = require('../models/product');
const { cacheGetOrSet, cacheDel } = require('../config/redis');

const TTL_LIST   = Number(process.env.TTL_PRODUCT_LIST   || 300);
const TTL_SINGLE = Number(process.env.TTL_PRODUCT_SINGLE || 300);

function listKey(params) {
  const sorted = Object.entries(params).sort().map(([k, v]) => `${k}=${v}`).join('&');
  return `dg:products:list:${sorted}`;
}

async function getProducts(params) {
  const key = listKey(params);
  return cacheGetOrSet(key, TTL_LIST, () => productModel.getAll(params));
}

async function getProduct(slug) {
  return cacheGetOrSet(`dg:product:${slug}`, TTL_SINGLE, () => productModel.getBySlug(slug));
}

async function getRelated(productId) {
  return cacheGetOrSet(`dg:related:${productId}`, TTL_SINGLE, () => productModel.getRelated(productId));
}

async function search(q) {
  /* Search results are not cached — they're too varied to be worth it */
  return productModel.search(q);
}

/* Called when admin updates a product (Phase 2) */
async function invalidate(slug, productId) {
  await cacheDel(`dg:product:${slug}`, `dg:related:${productId}`);
  /* List cache is TTL-based — let it expire naturally */
}

module.exports = { getProducts, getProduct, getRelated, search, invalidate };
