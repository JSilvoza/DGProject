'use strict';

/* ================================================================
   DG Product Detail Page
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const slug = new URLSearchParams(window.location.search).get('slug');
  const product = slug ? DG.getProductBySlug(slug) : null;

  if (!product) {
    document.getElementById('pdpContent')?.innerHTML = `
      <div class="container" style="padding-block:var(--sp-24);text-align:center">
        <p style="font-size:var(--text-3xl);margin-bottom:var(--sp-4);">—</p>
        <p style="margin-bottom:var(--sp-6);color:var(--clr-text-secondary)">Product not found.</p>
        <a href="shop.html" class="btn btn-primary">Back to Shop</a>
      </div>
    `;
    return;
  }

  /* ── Render breadcrumb ───────────────────────────────────── */

  const breadcrumbEl = document.getElementById('pdpBreadcrumb');
  if (breadcrumbEl) {
    breadcrumbEl.innerHTML = `
      <a href="index.html">Home</a>
      <span class="pdp__breadcrumb-sep">/</span>
      <a href="shop.html">Shop</a>
      <span class="pdp__breadcrumb-sep">/</span>
      <a href="shop.html?category=${product.category}">${capitalize(product.category)}</a>
      <span class="pdp__breadcrumb-sep">/</span>
      <span style="color:var(--clr-text)">${product.name}</span>
    `;
  }

  /* ── Render gallery ──────────────────────────────────────── */

  const thumbsEl   = document.getElementById('pdpThumbs');
  const mainImgEl  = document.getElementById('pdpMainImg');
  let activeImgIdx = 0;

  function renderGallery() {
    if (!thumbsEl || !mainImgEl) return;

    mainImgEl.src = product.images[0];
    mainImgEl.alt = product.name;

    thumbsEl.innerHTML = product.images.map((src, i) => `
      <button class="pdp__thumb ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="View image ${i + 1}">
        <img src="${src}" alt="${product.name} view ${i + 1}" loading="lazy">
      </button>
    `).join('');

    thumbsEl.querySelectorAll('.pdp__thumb').forEach(btn => {
      btn.addEventListener('click', () => {
        activeImgIdx = parseInt(btn.dataset.index);
        switchImage(activeImgIdx);
      });
    });
  }

  function switchImage(idx) {
    if (!mainImgEl) return;
    mainImgEl.style.opacity = '0';
    setTimeout(() => {
      mainImgEl.src = product.images[idx];
      mainImgEl.style.opacity = '1';
    }, 150);
    thumbsEl.querySelectorAll('.pdp__thumb').forEach((btn, i) => {
      btn.classList.toggle('active', i === idx);
    });
  }

  renderGallery();

  /* ── Render product info ─────────────────────────────────── */

  const nameEl    = document.getElementById('pdpName');
  const priceEl   = document.getElementById('pdpPrice');
  const ratingEl  = document.getElementById('pdpRating');
  const badgesEl  = document.getElementById('pdpBadges');

  if (nameEl) nameEl.textContent = product.name;

  if (priceEl) {
    const displayPrice = DG.getDisplayPrice(product);
    priceEl.innerHTML = product.isSale
      ? `<span class="pdp__price pdp__price--sale">${DG.formatPrice(displayPrice)}</span>
         <span class="pdp__price--original">${DG.formatPrice(product.price)}</span>
         <span class="badge badge-sale" style="font-size:var(--text-xs)">−${DG.getSalePercent(product)}%</span>`
      : `<span class="pdp__price">${DG.formatPrice(displayPrice)}</span>`;
  }

  if (ratingEl) {
    ratingEl.innerHTML = `
      <span class="rating-stars">${DG.renderStars(product.rating)}</span>
      <span style="font-size:var(--text-sm);font-weight:var(--weight-medium)">${product.rating}</span>
      <a href="#reviews" class="pdp__review-link">${product.reviewCount} reviews</a>
    `;
  }

  if (badgesEl && product.badge) {
    badgesEl.innerHTML = `<span class="badge ${DG.getBadgeClass(product.badge)}">${product.badge}</span>`;
  }

  /* ── Color selector ──────────────────────────────────────── */

  let selectedColor = product.colors[0].name;
  const colorLabelEl  = document.getElementById('selectedColorName');
  const swatchesEl    = document.getElementById('colorSwatches');

  function renderColors() {
    if (!swatchesEl) return;
    swatchesEl.innerHTML = product.colors.map((c, i) => `
      <button
        class="color-swatch ${i === 0 ? 'active' : ''}"
        style="background:${c.hex}"
        data-color="${c.name}"
        title="${c.name}"
        aria-label="${c.name}"
      ></button>
    `).join('');

    swatchesEl.querySelectorAll('.color-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedColor = btn.dataset.color;
        swatchesEl.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (colorLabelEl) colorLabelEl.textContent = selectedColor;
      });
    });

    if (colorLabelEl) colorLabelEl.textContent = selectedColor;
  }

  renderColors();

  /* ── Size selector ───────────────────────────────────────── */

  let selectedSize = null;
  const sizeBtnsEl  = document.getElementById('sizeBtns');
  const sizeErrEl   = document.getElementById('sizeError');

  function renderSizes() {
    if (!sizeBtnsEl) return;
    sizeBtnsEl.innerHTML = product.sizes.map(size => `
      <button class="size-btn" data-size="${size}">${size}</button>
    `).join('');

    sizeBtnsEl.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedSize = btn.dataset.size;
        sizeBtnsEl.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (sizeErrEl) sizeErrEl.style.display = 'none';
      });
    });
  }

  renderSizes();

  /* ── Size guide modal ────────────────────────────────────── */

  document.getElementById('sizeGuideBtn')?.addEventListener('click', () => {
    DG.ui.openModal('sizeGuideModal');
  });
  document.getElementById('sizeGuideClose')?.addEventListener('click', () => {
    DG.ui.closeModal('sizeGuideModal');
  });

  /* ── Quantity ────────────────────────────────────────────── */

  let quantity = 1;
  const qtyValueEl = document.getElementById('qtyValue');

  document.getElementById('qtyMinus')?.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      if (qtyValueEl) qtyValueEl.textContent = quantity;
    }
  });

  document.getElementById('qtyPlus')?.addEventListener('click', () => {
    if (quantity < 10) {
      quantity++;
      if (qtyValueEl) qtyValueEl.textContent = quantity;
    }
  });

  /* ── Add to cart ─────────────────────────────────────────── */

  const atcBtn = document.getElementById('atcBtn');

  /* Single validation function — used by both ATC and Buy Now */
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

  function validateAndAdd() {
    if (!requireSize()) return;

    const size  = selectedSize || product.sizes[0];
    const color = selectedColor;

    DG.cart.addItem(product.id, size, color, quantity);
    DG.ui.toast('Added to cart', `${product.name} — ${size} / ${color}`, 'success');

    if (atcBtn) {
      const orig = atcBtn.innerHTML;
      atcBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Added`;
      atcBtn.disabled = true;
      setTimeout(() => { atcBtn.innerHTML = orig; atcBtn.disabled = false; }, 2000);
    }
  }

  atcBtn?.addEventListener('click', validateAndAdd);

  document.getElementById('buyNowBtn')?.addEventListener('click', () => {
    if (!requireSize()) return;
    DG.cart.addItem(product.id, selectedSize || product.sizes[0], selectedColor, quantity);
    window.location.href = 'checkout.html';
  });

  /* ── Accordion ───────────────────────────────────────────── */

  const detailsList = document.getElementById('detailsList');
  const careList    = document.getElementById('careList');

  if (detailsList) {
    detailsList.innerHTML = product.details.map(d => `<li>${d}</li>`).join('');
  }
  if (careList) {
    careList.innerHTML = product.care.map(c => `<li>${c}</li>`).join('');
  }

  DG.ui.initAccordions();

  /* ── Description ─────────────────────────────────────────── */

  const descEl = document.getElementById('pdpDescription');
  if (descEl) descEl.textContent = product.description;

  /* ── Related products ────────────────────────────────────── */

  const relatedGrid = document.getElementById('relatedGrid');
  if (relatedGrid) {
    const related = DG.getRelatedProducts(product);
    if (related.length) {
      relatedGrid.innerHTML = related
        .map(p => DG.ui.renderProductCard(p))
        .join('');
      DG.ui.bindQuickAdd(relatedGrid);
    } else {
      relatedGrid.closest('section')?.remove();
    }
  }

  /* ── Page title ──────────────────────────────────────────── */

  document.title = `${product.name} — DG Studio`;

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
});
