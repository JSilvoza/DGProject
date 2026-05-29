'use strict';

window.DG = window.DG || {};

/* ================================================================
   DG.ui — Shared UI utilities: nav, toast, modals, product cards
   ================================================================ */

DG.ui = (() => {

  /* ── Navigation ───────────────────────────────────────────── */

  function initNav() {
    const header    = document.getElementById('header');
    const menuBtn   = document.getElementById('menuBtn');
    const navOverlay = document.getElementById('navOverlay');
    const cartCount = document.getElementById('cartCount');

    if (!header) return;

    // Highlight active nav link
    const links = header.querySelectorAll('.header__nav-link');
    links.forEach(link => {
      if (link.href === window.location.href ||
          (link.href !== window.location.origin + '/' && window.location.href.includes(link.getAttribute('href')))) {
        link.classList.add('active');
      }
    });

    // Mobile menu toggle
    if (menuBtn && navOverlay) {
      menuBtn.addEventListener('click', () => {
        const open = menuBtn.classList.toggle('open');
        navOverlay.classList.toggle('open', open);
        document.body.style.overflow = open ? 'hidden' : '';
      });

      navOverlay.addEventListener('click', (e) => {
        if (e.target === navOverlay) closeMobileMenu();
      });
    }

    // Scroll shadow
    const onScroll = () => {
      header.style.borderBottomColor =
        window.scrollY > 10 ? 'rgba(255,255,255,0.06)' : '';
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Cart count badge
    function syncCartCount() {
      const count = DG.cart.getCount();
      if (!cartCount) return;
      cartCount.textContent = count;
      cartCount.classList.toggle('visible', count > 0);
    }

    syncCartCount();
    window.addEventListener('dg:cart:updated', syncCartCount);
  }

  function closeMobileMenu() {
    document.getElementById('menuBtn')?.classList.remove('open');
    document.getElementById('navOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── Toast notifications ──────────────────────────────────── */

  let toastContainer = null;

  function ensureToastContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  const TOAST_ICONS = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  function toast(title, message = '', type = 'info', duration = 3500) {
    const container = ensureToastContainer();

    const titleEl   = document.createElement('div');
    titleEl.className = 'toast__title';
    titleEl.textContent = title;

    const contentEl = document.createElement('div');
    contentEl.className = 'toast__content';
    contentEl.appendChild(titleEl);

    if (message) {
      const msgEl = document.createElement('div');
      msgEl.className = 'toast__message';
      msgEl.textContent = message;
      contentEl.appendChild(msgEl);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast__close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

    const iconEl = document.createElement('span');
    iconEl.className = 'toast__icon';
    iconEl.innerHTML = TOAST_ICONS[type] || TOAST_ICONS.info;

    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.append(iconEl, contentEl, closeBtn);
    container.appendChild(el);

    const dismiss = () => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(24px)';
      el.style.transition = 'opacity 200ms, transform 200ms';
      setTimeout(() => el.remove(), 220);
    };

    let timer = setTimeout(dismiss, duration);
    closeBtn.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
    el.addEventListener('mouseenter', () => clearTimeout(timer));
    el.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, duration); });

    return el;
  }

  /* ── Product card rendering ───────────────────────────────── */

  function renderProductCard(product, opts = {}) {
    const displayPrice = DG.getDisplayPrice(product);
    const badge        = product.badge;
    const badgeClass   = DG.getBadgeClass(badge);

    const sizeButtons = product.sizes
      .filter(s => s !== 'One Size')
      .slice(0, 5)
      .map(size => `<button class="product-card__size-btn" data-product-id="${product.id}" data-size="${size}">${size}</button>`)
      .join('');

    const stars = DG.renderStars(product.rating);

    return `
      <article class="product-card" data-product-id="${product.id}">
        <a href="product.html?slug=${product.slug}" class="product-card__media-link" tabindex="-1">
          <div class="product-card__media">
            <img
              src="${product.images[0]}"
              alt="${product.name}"
              class="product-card__img"
              loading="lazy"
            >
            ${product.images[1] ? `<img src="${product.images[1]}" alt="${product.name} alternate view" class="product-card__img-hover" loading="lazy">` : ''}

            ${badge ? `<div class="product-card__badge"><span class="badge ${badgeClass}">${badge}</span></div>` : ''}

            <button class="product-card__wishlist" aria-label="Add to wishlist" data-product-id="${product.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>

            ${sizeButtons ? `
              <div class="product-card__quick-add">
                ${sizeButtons}
              </div>` : ''}
          </div>
        </a>

        <a href="product.html?slug=${product.slug}" class="product-card__info">
          <div class="product-card__category">${product.category}</div>
          <div class="product-card__name">${product.name}</div>
          <div class="product-card__pricing">
            <span class="product-card__price ${product.isSale ? 'product-card__price--sale' : ''}">
              ${DG.formatPrice(displayPrice)}
            </span>
            ${product.isSale ? `<span class="product-card__price--original">${DG.formatPrice(product.price)}</span>` : ''}
          </div>
          <div class="product-card__rating">
            <span class="rating-stars">${stars}</span>
            <span class="rating-count">(${product.reviewCount})</span>
          </div>
        </a>
      </article>
    `;
  }

  /* ── Quick-add handler (for cards) ───────────────────────── */

  /* WeakSet prevents stacking multiple listeners on the same container
     across re-renders (e.g. each shop filter change re-calls bindQuickAdd). */
  const _boundContainers = new WeakSet();

  function bindQuickAdd(container) {
    if (_boundContainers.has(container)) return;
    _boundContainers.add(container);

    container.addEventListener('click', (e) => {
      const sizeBtn = e.target.closest('.product-card__size-btn');
      if (!sizeBtn) return;
      e.preventDefault();
      e.stopPropagation();

      const productId = parseInt(sizeBtn.dataset.productId, 10);
      const size      = sizeBtn.dataset.size;
      const product   = DG.getProductById(productId);
      if (!product) return;

      DG.cart.addItem(productId, size, product.colors[0].name);
      toast('Added to cart', `${product.name} — ${size}`, 'success');

      sizeBtn.textContent = '✓';
      sizeBtn.style.cssText = 'background:var(--clr-success);border-color:var(--clr-success);color:white';
      setTimeout(() => {
        sizeBtn.textContent = size;
        sizeBtn.removeAttribute('style');
      }, 1500);
    });
  }

  /* ── Accordion ────────────────────────────────────────────── */

  function initAccordions(container = document) {
    container.querySelectorAll('.accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.accordion-item');
        const isOpen = item.classList.contains('open');
        // close all in same accordion
        trigger.closest('.accordion')?.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  /* ── Modal ────────────────────────────────────────────────── */

  function openModal(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlayId);
    }, { once: true });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal(overlayId);
    }, { once: true });
  }

  function closeModal(overlayId) {
    document.getElementById(overlayId)?.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── Footer renderer ──────────────────────────────────────── */

  function renderFooter(containerId = 'footer') {
    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = `
      <div class="container">
        <div class="footer__grid">
          <div>
            <div class="footer__brand-logo">DG</div>
            <p class="footer__brand-tagline">A contemporary clothing studio built on the principle that quality and restraint are not opposites.</p>
            <div class="footer__social">
              ${['Instagram','Twitter','TikTok'].map(s => `
                <a href="#" class="footer__social-link" aria-label="${s}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                </a>`).join('')}
            </div>
          </div>
          <div>
            <div class="footer__col-title">Shop</div>
            <div class="footer__links">
              <a href="shop.html?category=tops" class="footer__link">Tops</a>
              <a href="shop.html?category=bottoms" class="footer__link">Bottoms</a>
              <a href="shop.html?category=outerwear" class="footer__link">Outerwear</a>
              <a href="shop.html?category=accessories" class="footer__link">Accessories</a>
              <a href="shop.html?filter=new" class="footer__link">New Arrivals</a>
              <a href="shop.html?filter=sale" class="footer__link">Sale</a>
            </div>
          </div>
          <div>
            <div class="footer__col-title">Help</div>
            <div class="footer__links">
              <a href="#" class="footer__link">Shipping & Returns</a>
              <a href="#" class="footer__link">Size Guide</a>
              <a href="#" class="footer__link">Care Instructions</a>
              <a href="#" class="footer__link">FAQ</a>
              <a href="#" class="footer__link">Contact Us</a>
            </div>
          </div>
          <div>
            <div class="footer__col-title">Company</div>
            <div class="footer__links">
              <a href="about.html" class="footer__link">About DG</a>
              <a href="#" class="footer__link">Sustainability</a>
              <a href="#" class="footer__link">Wholesale</a>
              <a href="#" class="footer__link">Press</a>
              <a href="#" class="footer__link">Careers</a>
            </div>
          </div>
        </div>
        <div class="footer__bottom">
          <span class="footer__copy">© 2026 DG Studio. All rights reserved.</span>
          <div class="footer__legal">
            <a href="#" class="footer__legal-link">Privacy Policy</a>
            <a href="#" class="footer__legal-link">Terms of Service</a>
            <a href="#" class="footer__legal-link">Cookie Policy</a>
          </div>
        </div>
      </div>
    `;
  }

  /* ── Lazy load images ─────────────────────────────────────── */

  function initLazyImages() {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
  }

  /* ── Animate on scroll ────────────────────────────────────── */

  function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(el);
    });
  }

  return {
    initNav, closeMobileMenu,
    toast,
    renderProductCard, bindQuickAdd,
    initAccordions,
    openModal, closeModal,
    renderFooter,
    initLazyImages, initScrollAnimations,
  };
})();
