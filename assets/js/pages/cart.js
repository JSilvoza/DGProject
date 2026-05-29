/**
 * pages/cart.js — Cart page controller.
 * No product catalog needed — cart items carry their own display data.
 */

import * as CartSvc   from '../infrastructure/CartService.js';
import { formatPrice } from '../domain/pricing.js';
import { initNav }    from '../components/Nav.js';
import { renderFooter } from '../components/Footer.js';
import { showToast }  from '../components/Toast.js';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  renderFooter();
  renderCart();
});

/* ── Promo state ─────────────────────────────────────────────────── */

let appliedPromo = null;

/* ── Render ──────────────────────────────────────────────────────── */

function renderCart() {
  const items      = CartSvc.getItems();
  const layoutEl   = document.getElementById('cartLayout');
  const emptyEl    = document.getElementById('cartEmpty');
  const titleEl    = document.getElementById('cartTitle');

  if (!items.length) {
    layoutEl?.style && (layoutEl.style.display = 'none');
    emptyEl?.style  && (emptyEl.style.display  = 'block');
    if (titleEl) titleEl.textContent = 'Your Cart';
    return;
  }

  if (layoutEl) layoutEl.style.display = '';
  if (emptyEl)  emptyEl.style.display  = 'none';
  if (titleEl)  titleEl.textContent    = `Your Cart (${CartSvc.getCount()})`;

  _renderItems(items);
  _renderSummary();
}

function _renderItems(items) {
  const el = document.getElementById('cartItems');
  if (!el) return;

  el.innerHTML = items.map(item => `
    <div class="cart-item" data-item-id="${item.id}">
      <a href="product.html?slug=${item.slug ?? ''}" class="cart-item__img-wrap">
        <img src="${item.image}" alt="${item.name}" class="cart-item__img" loading="lazy">
      </a>
      <div class="cart-item__info">
        <a href="product.html?slug=${item.slug ?? ''}" class="cart-item__name">${item.name}</a>
        <div class="cart-item__meta">
          <span>${item.size}</span><span>·</span><span>${item.color}</span>
        </div>
        <div class="cart-item__price">${formatPrice(item.price)}</div>
      </div>
      <div class="cart-item__actions">
        <div class="qty-control">
          <button class="qty-btn" data-action="decrease" data-item-id="${item.id}" aria-label="Decrease quantity">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" data-action="increase" data-item-id="${item.id}" aria-label="Increase quantity">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
        <button class="cart-item__remove" data-item-id="${item.id}">Remove</button>
      </div>
    </div>`).join('');

  /* Quantity controls */
  el.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = btn.dataset.itemId;
      const item = CartSvc.getItems().find(i => i.id === id);
      if (!item) return;
      const delta = btn.dataset.action === 'increase' ? 1 : -1;
      CartSvc.updateQuantity(id, item.quantity + delta);
      renderCart();
    });
  });

  /* Remove buttons */
  el.querySelectorAll('.cart-item__remove').forEach(btn => {
    btn.addEventListener('click', () => {
      CartSvc.removeItem(btn.dataset.itemId);
      showToast('Removed', 'Item removed from cart.', 'info');
      renderCart();
    });
  });
}

function _renderSummary() {
  const sub      = CartSvc.getSubtotal();
  const shipping = CartSvc.getShipping();
  const discount = appliedPromo?.discount ?? 0;
  const total    = sub + shipping - discount;

  document.getElementById('summarySubtotal').textContent = formatPrice(sub);
  document.getElementById('summaryShipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
  document.getElementById('summaryTotal').textContent    = formatPrice(total);

  const discountRow = document.getElementById('discountRow');
  const discountEl  = document.getElementById('summaryDiscount');
  if (discountRow) discountRow.style.display = discount > 0 ? '' : 'none';
  if (discountEl && discount > 0) discountEl.textContent = `−${formatPrice(discount)}`;

  _bindPromo();
}

function _bindPromo() {
  document.getElementById('applyPromoBtn')?.addEventListener('click', () => {
    const code  = document.getElementById('promoInput')?.value?.trim();
    if (!code) return;
    const promo = CartSvc.validatePromo(code);
    const msgEl = document.getElementById('promoMessage');

    if (promo) {
      appliedPromo = promo;
      if (msgEl) { msgEl.style.display = ''; msgEl.textContent = `✓ "${promo.code}" applied — saving ${formatPrice(promo.discount)}`; }
      document.getElementById('promoInput').value = '';
      _renderSummary();
      showToast('Promo applied!', `${promo.rate * 100}% off`, 'success');
    } else {
      showToast('Invalid code', "That promo code isn't valid.", 'error');
    }
  }, { once: true }); // re-bound on each _renderSummary call
}
