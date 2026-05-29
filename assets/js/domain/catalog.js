/**
 * domain/catalog.js — Pure product query and filter functions.
 * Lookup maps are built once at module evaluation time.
 */

import { PRODUCTS } from '../data/products.js';
import { getDisplayPrice } from './pricing.js';

/* ── O(1) lookup indexes ────────────────────────────────────────── */

const _byId   = new Map(PRODUCTS.map(p => [p.id,   p]));
const _bySlug = new Map(PRODUCTS.map(p => [p.slug, p]));

export function getById(id)     { return _byId.get(id)   ?? null; }
export function getBySlug(slug) { return _bySlug.get(slug) ?? null; }

export function getRelated(product, limit = 4) {
  return (product.relatedIds ?? [])
    .map(id => getById(id))
    .filter(Boolean)
    .slice(0, limit);
}

/* ── Filtering ──────────────────────────────────────────────────── */

export function applyFilters(products, filters) {
  const {
    categories = new Set(),
    sizes      = new Set(),
    special    = new Set(),
    minPrice   = 0,
    maxPrice   = Infinity,
  } = filters;

  const priceActive = minPrice > 0 || maxPrice < Infinity;

  return products.filter(p => {
    if (categories.size && !categories.has(p.category))          return false;
    if (sizes.size      && !p.sizes.some(s => sizes.has(s)))     return false;
    if (special.has('new')        && !p.isNew)                   return false;
    if (special.has('sale')       && !p.isSale)                  return false;
    if (special.has('bestseller') && !p.isBestseller)            return false;
    if (priceActive) {
      const price = getDisplayPrice(p);
      if (price < minPrice || price > maxPrice)                  return false;
    }
    return true;
  });
}

/* ── Sorting ────────────────────────────────────────────────────── */

export function applySort(products, sortKey) {
  const arr = [...products];

  if (sortKey === 'price-asc' || sortKey === 'price-desc') {
    const dir = sortKey === 'price-asc' ? 1 : -1;
    return arr
      .map(p => ({ p, price: getDisplayPrice(p) }))
      .sort((a, b) => (a.price - b.price) * dir)
      .map(x => x.p);
  }

  const comparators = {
    newest:     (a, b) => (b.isNew       ? 1 : 0) - (a.isNew       ? 1 : 0),
    bestseller: (a, b) => (b.isBestseller? 1 : 0) - (a.isBestseller? 1 : 0),
    rating:     (a, b) => b.rating - a.rating,
  };

  return comparators[sortKey] ? arr.sort(comparators[sortKey]) : arr;
}

/* ── Category metadata ──────────────────────────────────────────── */

const CATEGORY_META = {
  tops:        { label: 'Tops',        bg: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)' },
  bottoms:     { label: 'Bottoms',     bg: 'linear-gradient(135deg, #1c2b1a 0%, #2a3d28 100%)' },
  outerwear:   { label: 'Outerwear',   bg: 'linear-gradient(135deg, #2b1a1a 0%, #3d2828 100%)' },
  accessories: { label: 'Accessories', bg: 'linear-gradient(135deg, #1a2028 0%, #28303e 100%)' },
};

export const CATEGORIES = Object.entries(CATEGORY_META).map(([slug, meta]) => ({
  slug,
  label: meta.label,
  bg:    meta.bg,
  count: PRODUCTS.filter(p => p.category === slug).length,
}));

export { PRODUCTS };
