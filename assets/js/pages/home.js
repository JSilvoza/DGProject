/**
 * pages/home.js — Home page controller.
 * Imports from every layer it needs; contains zero business logic itself.
 */

import { PRODUCTS, CATEGORIES } from '../domain/catalog.js';
import { renderProductCard, bindQuickAdd } from '../components/ProductCard.js';
import { initNav }         from '../components/Nav.js';
import { renderFooter }    from '../components/Footer.js';
import { initScrollReveal } from '../components/ScrollReveal.js';
import { showToast }       from '../components/Toast.js';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  renderFooter();
  initScrollReveal();

  _renderNewArrivals();
  _renderCategories();
  _renderBestsellers();
  _initNewsletter();
  _showOrderSuccess();
});

function _renderNewArrivals() {
  const grid = document.getElementById('newArrivalsGrid');
  if (!grid) return;
  const products = PRODUCTS.filter(p => p.isNew).slice(0, 4);
  grid.innerHTML = products.map(p => renderProductCard(p)).join('');
  bindQuickAdd(grid);
}

function _renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map(cat => `
    <a href="shop.html?category=${cat.slug}" class="category-card">
      <div class="category-card__bg" style="background:${cat.bg}"></div>
      <div class="category-card__overlay"></div>
      <div class="category-card__content">
        <div class="category-card__name">${cat.label}</div>
        <div class="category-card__count">${cat.count} styles</div>
      </div>
    </a>
  `).join('');
}

function _renderBestsellers() {
  const grid = document.getElementById('bestsellersGrid');
  if (!grid) return;
  const products = PRODUCTS.filter(p => p.isBestseller).slice(0, 4);
  grid.innerHTML = products.map(p => renderProductCard(p)).join('');
  bindQuickAdd(grid);
}

function _initNewsletter() {
  document.getElementById('newsletterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail')?.value ?? '';
    if (email.includes('@')) {
      showToast("You're in!", 'Welcome to the DG edit.', 'success');
      document.getElementById('newsletterEmail').value = '';
    } else {
      showToast('Invalid email', 'Please enter a valid email address.', 'error');
    }
  });
}

function _showOrderSuccess() {
  if (new URLSearchParams(window.location.search).get('order') !== 'success') return;

  const el = document.createElement('div');
  el.className = 'checkout-success';
  el.innerHTML = `
    <div class="checkout-success__icon">✓</div>
    <h1 class="checkout-success__title">Order placed!</h1>
    <p class="checkout-success__sub">Thank you for your purchase. You'll receive a confirmation email shortly.</p>
    <a href="shop.html" class="btn btn-primary btn--lg">Continue shopping</a>
  `;
  document.body.appendChild(el);

  el.addEventListener('click', () => { el.remove(); history.replaceState(null, '', '/'); });
  setTimeout(() => el.remove(), 5000);
}
