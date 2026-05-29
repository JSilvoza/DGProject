/**
 * components/ProductCard.js — Product card template and quick-add binding.
 * Renders HTML for a product card and handles the quick-add interaction.
 */

import { getDisplayPrice, formatPrice, renderStars, getBadgeClass } from '../domain/pricing.js';
import { getById }    from '../domain/catalog.js';
import * as CartSvc   from '../infrastructure/CartService.js';
import { showToast }  from './Toast.js';

/* WeakSet prevents stacking duplicate listeners on re-rendered containers */
const _bound = new WeakSet();

export function renderProductCard(product) {
  const displayPrice = getDisplayPrice(product);
  const badgeClass   = getBadgeClass(product.badge);

  const sizeButtons = product.sizes
    .filter(s => s !== 'One Size')
    .slice(0, 5)
    .map(s => `<button class="product-card__size-btn" data-product-id="${product.id}" data-size="${s}">${s}</button>`)
    .join('');

  return `
    <article class="product-card" data-product-id="${product.id}">
      <a href="product.html?slug=${product.slug}" class="product-card__media-link" tabindex="-1">
        <div class="product-card__media">
          <img src="${product.images[0]}" alt="${product.name}" class="product-card__img" loading="lazy">
          ${product.images[1]
            ? `<img src="${product.images[1]}" alt="${product.name} alternate view" class="product-card__img-hover" loading="lazy">`
            : ''}
          ${product.badge
            ? `<div class="product-card__badge"><span class="badge ${badgeClass}">${product.badge}</span></div>`
            : ''}
          <button class="product-card__wishlist" aria-label="Add to wishlist" data-product-id="${product.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          ${sizeButtons
            ? `<div class="product-card__quick-add">${sizeButtons}</div>`
            : ''}
        </div>
      </a>
      <a href="product.html?slug=${product.slug}" class="product-card__info">
        <div class="product-card__category">${product.category}</div>
        <div class="product-card__name">${product.name}</div>
        <div class="product-card__pricing">
          <span class="product-card__price ${product.isSale ? 'product-card__price--sale' : ''}">
            ${formatPrice(displayPrice)}
          </span>
          ${product.isSale
            ? `<span class="product-card__price--original">${formatPrice(product.price)}</span>`
            : ''}
        </div>
        <div class="product-card__rating">
          <span class="rating-stars">${renderStars(product.rating)}</span>
          <span class="rating-count">(${product.reviewCount})</span>
        </div>
      </a>
    </article>
  `;
}

export function bindQuickAdd(container) {
  if (_bound.has(container)) return;
  _bound.add(container);

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.product-card__size-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const productId = parseInt(btn.dataset.productId, 10);
    const size      = btn.dataset.size;
    const product   = getById(productId);
    if (!product) return;

    CartSvc.addItem(
      product.id, product.slug, size,
      product.colors[0].name,
      getDisplayPrice(product),
      product.name, product.images[0]
    );

    showToast('Added to cart', `${product.name} — ${size}`, 'success');

    btn.textContent = '✓';
    btn.style.cssText = 'background:var(--clr-success);border-color:var(--clr-success);color:white';
    setTimeout(() => { btn.textContent = size; btn.removeAttribute('style'); }, 1500);
  });
}
