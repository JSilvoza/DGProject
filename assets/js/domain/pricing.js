/**
 * domain/pricing.js — Pure price and display helpers.
 * No imports, no side effects. Takes values, returns values.
 */

export function formatPrice(amount) {
  return '$' + Number(amount).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function getDisplayPrice(product) {
  return product.salePrice || product.price;
}

export function getSalePercent(product) {
  return product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;
}

export function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '');
}

export function getBadgeClass(badge) {
  if (badge === 'New')        return 'badge-new';
  if (badge === 'Sale')       return 'badge-sale';
  if (badge === 'Bestseller') return 'badge-bestseller';
  return '';
}
