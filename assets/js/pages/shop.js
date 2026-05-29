/**
 * pages/shop.js — Shop page controller.
 * Owns filter/sort UI state; delegates filtering to domain/catalog.js.
 */

import { PRODUCTS, applyFilters, applySort } from '../domain/catalog.js';
import { renderProductCard, bindQuickAdd }   from '../components/ProductCard.js';
import { initNav }          from '../components/Nav.js';
import { renderFooter }     from '../components/Footer.js';
import { initScrollReveal } from '../components/ScrollReveal.js';
import { showSkeletons, hideSkeletons } from '../components/Skeleton.js';
import { mountEmptyState, EmptyStates } from '../components/EmptyState.js';

/* ── UI state ────────────────────────────────────────────────────── */

const filters = {
  categories: new Set(),
  sizes:      new Set(),
  special:    new Set(),
  minPrice:   0,
  maxPrice:   Infinity,
};
let sortKey = 'featured';

/* ── Element refs ────────────────────────────────────────────────── */

const gridEl       = document.getElementById('productGrid');
const countEl      = document.getElementById('productCount');
const sortSelect   = document.getElementById('sortSelect');
const activeTagsEl = document.getElementById('activeTags');
const clearAllBtn  = document.getElementById('clearAllFilters');

/* ── Boot ────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  renderFooter();
  _readURLParams();
  _bindAllFilters();
  _bindSort();
  _bindFilterToggle();
  _bindClearFilters();
  _syncFilterUI();

  /* Show skeleton placeholders on first load — gives immediate visual feedback */
  if (gridEl) showSkeletons(gridEl, 'product-card', 8);

  /* rAF defers the actual render until after the skeleton has painted */
  requestAnimationFrame(render);
});

/* ── Render ──────────────────────────────────────────────────────── */

function render() {
  if (!gridEl) return;

  const filtered = applyFilters(PRODUCTS, filters);
  const sorted   = applySort(filtered, sortKey);

  if (countEl) countEl.textContent = `${sorted.length} product${sorted.length !== 1 ? 's' : ''}`;

  if (sorted.length === 0) {
    hideSkeletons(gridEl);
    mountEmptyState(gridEl, EmptyStates.noProducts(clearAllFilters));
    return;
  }

  hideSkeletons(gridEl);
  gridEl.innerHTML = sorted
    .map((p, i) => `<div class="animate-on-scroll" style="transition-delay:${Math.min(i, 8) * 40}ms">${renderProductCard(p)}</div>`)
    .join('');

  bindQuickAdd(gridEl);
  initScrollReveal();
  _renderActiveTags();
}

function refresh() {
  render();
  _renderActiveTags();
}

/* ── Active filter tags ──────────────────────────────────────────── */

function _renderActiveTags() {
  if (!activeTagsEl) return;

  const tags = [
    ...[...filters.categories].map(c => ({ label: c,           remove: () => { filters.categories.delete(c); refresh(); } })),
    ...[...filters.special].map(s    => ({ label: s,           remove: () => { filters.special.delete(s);    refresh(); } })),
    ...[...filters.sizes].map(s      => ({ label: `Size: ${s}`,remove: () => { filters.sizes.delete(s);      refresh(); } })),
  ];

  clearAllBtn && (clearAllBtn.style.display = tags.length ? '' : 'none');

  activeTagsEl.innerHTML = tags
    .map((t, i) => `<span class="active-filter-tag" data-tag="${i}">${t.label}<button aria-label="Remove">×</button></span>`)
    .join('');

  activeTagsEl.querySelectorAll('.active-filter-tag').forEach((el, i) => {
    el.querySelector('button').addEventListener('click', () => tags[i].remove());
  });
}

/* ── Filter binding helpers ──────────────────────────────────────── */

function _bindToggleFilter(selector, set, getVal) {
  document.querySelectorAll(selector).forEach(el => {
    const val = getVal(el);
    if (set.has(val)) el.classList.add('active');
    el.addEventListener('click', () => {
      el.classList.toggle('active');
      set.has(val) ? set.delete(val) : set.add(val);
      refresh();
    });
  });
}

function _bindAllFilters() {
  _bindToggleFilter('[data-filter-category]', filters.categories, el => el.dataset.filterCategory);
  _bindToggleFilter('[data-filter-size]',     filters.sizes,      el => el.dataset.filterSize);
  _bindToggleFilter('[data-filter-special]',  filters.special,    el => el.dataset.filterSpecial);

  const minEl = document.getElementById('priceMin');
  const maxEl = document.getElementById('priceMax');
  document.getElementById('applyPrice')?.addEventListener('click', () => {
    filters.minPrice = parseInt(minEl?.value, 10) || 0;
    filters.maxPrice = parseInt(maxEl?.value, 10) || Infinity;
    refresh();
  });

  document.querySelectorAll('.filter-group__title').forEach(title => {
    title.addEventListener('click', () =>
      title.closest('.filter-group')?.classList.toggle('collapsed')
    );
  });
}

function _bindSort() {
  if (!sortSelect) return;
  sortSelect.value = sortKey;
  sortSelect.addEventListener('change', () => { sortKey = sortSelect.value; render(); });
}

function _bindFilterToggle() {
  const btn     = document.getElementById('filterToggle');
  const sidebar = document.getElementById('filterSidebar');
  if (!btn || !sidebar) return;
  btn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    btn.textContent = sidebar.classList.contains('open') ? 'Hide Filters' : 'Filter';
  });
}

function _bindClearFilters() {
  const clearAll = () => {
    filters.categories.clear();
    filters.sizes.clear();
    filters.special.clear();
    filters.minPrice = 0;
    filters.maxPrice = Infinity;
    document.querySelectorAll('.filter-option, .size-filter-btn').forEach(el => el.classList.remove('active'));
    refresh();
  };

  clearAllBtn?.addEventListener('click', clearAll);
  document.addEventListener('click', e => {
    if (e.target.matches('[data-action="clear-filters"]')) clearAll();
  });
}

function _syncFilterUI() {
  filters.categories.forEach(c =>
    document.querySelector(`[data-filter-category="${c}"]`)?.classList.add('active')
  );
  filters.special.forEach(s =>
    document.querySelector(`[data-filter-special="${s}"]`)?.classList.add('active')
  );
}

function _readURLParams() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('category')) filters.categories.add(p.get('category'));
  if (p.get('filter'))   filters.special.add(p.get('filter'));
  if (p.get('size'))     filters.sizes.add(p.get('size'));
  if (p.get('sort'))   { sortKey = p.get('sort'); if (sortSelect) sortSelect.value = sortKey; }
}
