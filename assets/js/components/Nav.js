/**
 * components/Nav.js — Header, mobile menu, cart badge.
 * Depends on CartService for badge count and the event bus for updates.
 */

import { getCount } from '../infrastructure/CartService.js';
import { on }       from '../infrastructure/events.js';

let _scrollRaf = false;

export function initNav() {
  const header     = document.getElementById('header');
  const menuBtn    = document.getElementById('menuBtn');
  const navOverlay = document.getElementById('navOverlay');
  if (!header) return;

  _highlightActiveLink(header);
  _initMobileMenu(menuBtn, navOverlay);
  _initScrollShadow(header);
  _initCartBadge();
}

function _highlightActiveLink(header) {
  const href = window.location.href;
  header.querySelectorAll('.header__nav-link').forEach(link => {
    const target = link.getAttribute('href');
    if (link.href === href || (target !== '/' && href.includes(target))) {
      link.classList.add('active');
    }
  });
}

function _initMobileMenu(btn, overlay) {
  if (!btn || !overlay) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    overlay.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) _closeMobileMenu(btn, overlay);
  });
}

function _closeMobileMenu(btn, overlay) {
  btn?.classList.remove('open');
  overlay?.classList.remove('open');
  document.body.style.overflow = '';
}

function _initScrollShadow(header) {
  window.addEventListener('scroll', () => {
    if (_scrollRaf) return;
    _scrollRaf = true;
    requestAnimationFrame(() => {
      header.style.borderBottomColor = window.scrollY > 10
        ? 'rgba(255,255,255,0.06)'
        : '';
      _scrollRaf = false;
    });
  }, { passive: true });
}

function _initCartBadge() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;

  const sync = () => {
    const count = getCount();
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  };

  sync();
  on('dg:cart:updated', sync);
}
