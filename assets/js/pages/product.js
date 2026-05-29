/**
 * pages/product.js — Product Detail Page controller.
 */

import { getBySlug, getRelated }   from '../domain/catalog.js';
import { getDisplayPrice, formatPrice, renderStars, getSalePercent, getBadgeClass } from '../domain/pricing.js';
import * as CartSvc                from '../infrastructure/CartService.js';
import { initNav }                 from '../components/Nav.js';
import { renderFooter }            from '../components/Footer.js';
import { renderProductCard, bindQuickAdd } from '../components/ProductCard.js';
import { showToast }               from '../components/Toast.js';
import { openModal, closeModal }   from '../components/Modal.js';
import { initAccordions }          from '../components/Accordion.js';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  renderFooter();

  const slug    = new URLSearchParams(window.location.search).get('slug');
  const product = slug ? getBySlug(slug) : null;

  if (!product) {
    document.getElementById('pdpContent')?.innerHTML = `
      <div class="container" style="padding-block:var(--sp-24);text-align:center">
        <p style="font-size:var(--text-3xl);margin-bottom:var(--sp-4);">—</p>
        <p style="margin-bottom:var(--sp-6);color:var(--clr-text-secondary)">Product not found.</p>
        <a href="shop.html" class="btn btn-primary">Back to Shop</a>
      </div>`;
    return;
  }

  document.title = `${product.name} — DG Studio`;

  _renderBreadcrumb(product);
  _renderGallery(product);
  _renderInfo(product);
  _initColorSelector(product);
  _initSizeSelector(product);
  _initQuantityControls(product);
  _initAccordionContent(product);
  _renderRelated(product);

  document.getElementById('sizeGuideBtn')?.addEventListener('click',  () => openModal('sizeGuideModal'));
  document.getElementById('sizeGuideClose')?.addEventListener('click', () => closeModal('sizeGuideModal'));
  initAccordions();
});

/* ── Breadcrumb ──────────────────────────────────────────────────── */

function _renderBreadcrumb(product) {
  const el = document.getElementById('pdpBreadcrumb');
  if (!el) return;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  el.innerHTML = `
    <a href="index.html">Home</a><span class="pdp__breadcrumb-sep">/</span>
    <a href="shop.html">Shop</a><span class="pdp__breadcrumb-sep">/</span>
    <a href="shop.html?category=${product.category}">${cap(product.category)}</a>
    <span class="pdp__breadcrumb-sep">/</span>
    <span style="color:var(--clr-text)">${product.name}</span>`;
}

/* ── Gallery ─────────────────────────────────────────────────────── */

function _renderGallery(product) {
  const thumbsEl  = document.getElementById('pdpThumbs');
  const mainImgEl = document.getElementById('pdpMainImg');
  if (!thumbsEl || !mainImgEl) return;

  mainImgEl.src = product.images[0];
  mainImgEl.alt = product.name;

  thumbsEl.innerHTML = product.images.map((src, i) => `
    <button class="pdp__thumb ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="View image ${i + 1}">
      <img src="${src}" alt="${product.name} view ${i + 1}" loading="lazy">
    </button>`).join('');

  thumbsEl.querySelectorAll('.pdp__thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      mainImgEl.style.opacity = '0';
      setTimeout(() => { mainImgEl.src = product.images[idx]; mainImgEl.style.opacity = '1'; }, 150);
      thumbsEl.querySelectorAll('.pdp__thumb').forEach((b, i) => b.classList.toggle('active', i === idx));
    });
  });
}

/* ── Info (name, price, rating, badge) ───────────────────────────── */

function _renderInfo(product) {
  const nameEl   = document.getElementById('pdpName');
  const priceEl  = document.getElementById('pdpPrice');
  const ratingEl = document.getElementById('pdpRating');
  const badgesEl = document.getElementById('pdpBadges');

  if (nameEl)   nameEl.textContent = product.name;

  if (priceEl) {
    const dp = getDisplayPrice(product);
    priceEl.innerHTML = product.isSale
      ? `<span class="pdp__price pdp__price--sale">${formatPrice(dp)}</span>
         <span class="pdp__price--original">${formatPrice(product.price)}</span>
         <span class="badge badge-sale" style="font-size:var(--text-xs)">−${getSalePercent(product)}%</span>`
      : `<span class="pdp__price">${formatPrice(dp)}</span>`;
  }

  if (ratingEl) {
    ratingEl.innerHTML = `
      <span class="rating-stars">${renderStars(product.rating)}</span>
      <span style="font-size:var(--text-sm);font-weight:var(--weight-medium)">${product.rating}</span>
      <a href="#reviews" class="pdp__review-link">${product.reviewCount} reviews</a>`;
  }

  if (badgesEl && product.badge) {
    badgesEl.innerHTML = `<span class="badge ${getBadgeClass(product.badge)}">${product.badge}</span>`;
  }
}

/* ── Color selector ──────────────────────────────────────────────── */

function _initColorSelector(product) {
  const swatchesEl  = document.getElementById('colorSwatches');
  const labelEl     = document.getElementById('selectedColorName');
  if (!swatchesEl) return;

  let selected = product.colors[0].name;

  swatchesEl.innerHTML = product.colors.map((c, i) => `
    <button class="color-swatch ${i === 0 ? 'active' : ''}"
      style="background:${c.hex}" data-color="${c.name}"
      title="${c.name}" aria-label="${c.name}"></button>`).join('');

  if (labelEl) labelEl.textContent = selected;

  swatchesEl.querySelectorAll('.color-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      selected = btn.dataset.color;
      swatchesEl.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (labelEl) labelEl.textContent = selected;
    });
  });

  return () => selected;
}

/* ── Size selector + ATC ─────────────────────────────────────────── */

function _initSizeSelector(product) {
  const sizeBtnsEl = document.getElementById('sizeBtns');
  const sizeErrEl  = document.getElementById('sizeError');
  const atcBtn     = document.getElementById('atcBtn');
  const buyNowBtn  = document.getElementById('buyNowBtn');
  const qtyValueEl = document.getElementById('qtyValue');
  let selectedSize = null;
  let quantity     = 1;

  /* Size buttons */
  if (sizeBtnsEl) {
    sizeBtnsEl.innerHTML = product.sizes
      .map(s => `<button class="size-btn" data-size="${s}">${s}</button>`).join('');

    sizeBtnsEl.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedSize = btn.dataset.size;
        sizeBtnsEl.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (sizeErrEl) sizeErrEl.style.display = 'none';
      });
    });
  }

  /* Quantity */
  document.getElementById('qtyMinus')?.addEventListener('click', () => {
    if (quantity > 1) { quantity--; if (qtyValueEl) qtyValueEl.textContent = quantity; }
  });
  document.getElementById('qtyPlus')?.addEventListener('click', () => {
    if (quantity < 10) { quantity++; if (qtyValueEl) qtyValueEl.textContent = quantity; }
  });

  /* Validation */
  function requireSize() {
    if (product.sizes.length > 1 && !selectedSize) {
      if (sizeErrEl) {
        sizeErrEl.style.display = 'block';
        sizeBtnsEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    return true;
  }

  /* Add to cart */
  function doAddToCart() {
    if (!requireSize()) return;
    const size  = selectedSize ?? product.sizes[0];
    const color = document.getElementById('colorSwatches')
      ?.querySelector('.color-swatch.active')?.dataset.color ?? product.colors[0].name;

    CartSvc.addItem(
      product.id, product.slug, size, color,
      getDisplayPrice(product), product.name, product.images[0],
      quantity
    );
    showToast('Added to cart', `${product.name} — ${size} / ${color}`, 'success');

    if (atcBtn) {
      const orig = atcBtn.innerHTML;
      atcBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Added`;
      atcBtn.disabled = true;
      setTimeout(() => { atcBtn.innerHTML = orig; atcBtn.disabled = false; }, 2000);
    }
  }

  atcBtn?.addEventListener('click', doAddToCart);

  buyNowBtn?.addEventListener('click', () => {
    if (!requireSize()) return;
    const size  = selectedSize ?? product.sizes[0];
    const color = document.getElementById('colorSwatches')
      ?.querySelector('.color-swatch.active')?.dataset.color ?? product.colors[0].name;
    CartSvc.addItem(product.id, product.slug, size, color,
      getDisplayPrice(product), product.name, product.images[0], quantity);
    window.location.href = 'checkout.html';
  });
}

/* ── Accordion content ───────────────────────────────────────────── */

function _initAccordionContent(product) {
  const descEl    = document.getElementById('pdpDescription');
  const detailsEl = document.getElementById('detailsList');
  const careEl    = document.getElementById('careList');

  if (descEl)    descEl.textContent    = product.description;
  if (detailsEl) detailsEl.innerHTML   = product.details.map(d => `<li>${d}</li>`).join('');
  if (careEl)    careEl.innerHTML      = product.care.map(c => `<li>${c}</li>`).join('');
}

/* ── Related products ────────────────────────────────────────────── */

function _renderRelated(product) {
  const grid = document.getElementById('relatedGrid');
  if (!grid) return;
  const related = getRelated(product);
  if (!related.length) { grid.closest('section')?.remove(); return; }
  grid.innerHTML = related.map(p => renderProductCard(p)).join('');
  bindQuickAdd(grid);
}
