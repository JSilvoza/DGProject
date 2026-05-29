'use strict';

/* ================================================================
   DG Shop Page — filter, sort, render
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const gridEl       = document.getElementById('productGrid');
  const countEl      = document.getElementById('productCount');
  const sortSelect   = document.getElementById('sortSelect');
  const activeTagsEl = document.getElementById('activeTags');
  const filterToggle = document.getElementById('filterToggle');
  const filterSidebar = document.getElementById('filterSidebar');
  const clearAllBtn  = document.getElementById('clearAllFilters');

  /* ── State ───────────────────────────────────────────────── */
  const filters = {
    category: new Set(),
    size:     new Set(),
    color:    new Set(),
    minPrice: 0,
    maxPrice: Infinity,
    special:  new Set(), // 'new', 'sale', 'bestseller'
  };
  let sortKey = 'featured';

  /* ── Read URL params on load ─────────────────────────────── */

  function readURLParams() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('category')) {
      filters.category.add(params.get('category'));
    }
    if (params.get('filter')) {
      filters.special.add(params.get('filter'));
    }
    if (params.get('size')) {
      filters.size.add(params.get('size'));
    }
    if (params.get('sort')) {
      sortKey = params.get('sort');
      if (sortSelect) sortSelect.value = sortKey;
    }
  }

  /* ── Filter & sort logic ──────────────────────────────────── */

  function applyFilters(products) {
    return products.filter(p => {
      if (filters.category.size && !filters.category.has(p.category)) return false;
      if (filters.size.size && !filters.size.has('any') &&
          !p.sizes.some(s => filters.size.has(s))) return false;
      if (filters.special.has('new') && !p.isNew) return false;
      if (filters.special.has('sale') && !p.isSale) return false;
      if (filters.special.has('bestseller') && !p.isBestseller) return false;
      const price = DG.getDisplayPrice(p);
      if (price < filters.minPrice || price > filters.maxPrice) return false;
      return true;
    });
  }

  function applySort(products) {
    const arr = [...products];
    switch (sortKey) {
      case 'price-asc':  return arr.sort((a, b) => DG.getDisplayPrice(a) - DG.getDisplayPrice(b));
      case 'price-desc': return arr.sort((a, b) => DG.getDisplayPrice(b) - DG.getDisplayPrice(a));
      case 'newest':     return arr.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      case 'bestseller': return arr.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
      case 'rating':     return arr.sort((a, b) => b.rating - a.rating);
      default:           return arr; // featured order
    }
  }

  /* ── Render products ─────────────────────────────────────── */

  function render() {
    if (!gridEl) return;

    const filtered = applyFilters(DG.products);
    const sorted   = applySort(filtered);

    if (countEl) countEl.textContent = `${sorted.length} product${sorted.length !== 1 ? 's' : ''}`;

    if (sorted.length === 0) {
      gridEl.innerHTML = `
        <div class="no-results">
          <p style="font-size:var(--text-2xl); margin-bottom:var(--sp-4);">—</p>
          <p style="margin-bottom:var(--sp-3);">No products match your filters.</p>
          <button class="btn btn-outline btn--sm" data-action="clear-filters">Clear all filters</button>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = sorted
      .map((p, i) => `<div class="animate-on-scroll" style="transition-delay:${Math.min(i, 8) * 40}ms">${DG.ui.renderProductCard(p)}</div>`)
      .join('');

    DG.ui.bindQuickAdd(gridEl);
    DG.ui.initScrollAnimations();
  }

  /* ── Active filter tags ───────────────────────────────────── */

  function renderActiveTags() {
    if (!activeTagsEl) return;

    const tags = [];

    filters.category.forEach(c =>
      tags.push({ label: c, remove: () => { filters.category.delete(c); refresh(); } })
    );
    filters.special.forEach(s =>
      tags.push({ label: s, remove: () => { filters.special.delete(s); refresh(); } })
    );
    filters.size.forEach(s =>
      tags.push({ label: `Size: ${s}`, remove: () => { filters.size.delete(s); refresh(); } })
    );

    if (clearAllBtn) {
      clearAllBtn.style.display = tags.length ? '' : 'none';
    }

    activeTagsEl.innerHTML = tags.map((t, i) => `
      <span class="active-filter-tag" data-tag-index="${i}">
        ${t.label}
        <button aria-label="Remove filter">×</button>
      </span>
    `).join('');

    activeTagsEl.querySelectorAll('.active-filter-tag').forEach((el, i) => {
      el.querySelector('button').addEventListener('click', () => tags[i].remove());
    });
  }

  function clearAllFilters() {
    filters.category.clear();
    filters.size.clear();
    filters.color.clear();
    filters.special.clear();
    filters.minPrice = 0;
    filters.maxPrice = Infinity;
    document.querySelectorAll('.filter-option').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.size-filter-btn').forEach(el => el.classList.remove('active'));
    refresh();
  }

  /* Expose for the no-results button rendered via innerHTML (data-action delegation) */
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-action="clear-filters"]')) clearAllFilters();
  });

  /* ── Filter UI binding ───────────────────────────────────── */

  function bindCategoryFilters() {
    document.querySelectorAll('[data-filter-category]').forEach(btn => {
      const cat = btn.dataset.filterCategory;
      if (filters.category.has(cat)) btn.classList.add('active');

      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        if (filters.category.has(cat)) {
          filters.category.delete(cat);
        } else {
          filters.category.add(cat);
        }
        refresh();
      });
    });
  }

  function bindSizeFilters() {
    document.querySelectorAll('[data-filter-size]').forEach(btn => {
      const size = btn.dataset.filterSize;
      if (filters.size.has(size)) btn.classList.add('active');

      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        if (filters.size.has(size)) {
          filters.size.delete(size);
        } else {
          filters.size.add(size);
        }
        refresh();
      });
    });
  }

  function bindSpecialFilters() {
    document.querySelectorAll('[data-filter-special]').forEach(el => {
      const val = el.dataset.filterSpecial;
      if (filters.special.has(val)) el.classList.add('active');

      el.addEventListener('click', () => {
        el.classList.toggle('active');
        if (filters.special.has(val)) {
          filters.special.delete(val);
        } else {
          filters.special.add(val);
        }
        refresh();
      });
    });
  }

  function bindPriceFilters() {
    const minInput = document.getElementById('priceMin');
    const maxInput = document.getElementById('priceMax');
    const applyBtn = document.getElementById('applyPrice');

    if (!applyBtn) return;
    applyBtn.addEventListener('click', () => {
      filters.minPrice = parseInt(minInput?.value) || 0;
      filters.maxPrice = parseInt(maxInput?.value) || Infinity;
      refresh();
    });
  }

  function bindFilterAccordions() {
    document.querySelectorAll('.filter-group__title').forEach(title => {
      title.addEventListener('click', () => {
        title.closest('.filter-group')?.classList.toggle('collapsed');
      });
    });
  }

  /* ── Sort ────────────────────────────────────────────────── */

  function bindSort() {
    if (!sortSelect) return;
    sortSelect.value = sortKey;
    sortSelect.addEventListener('change', () => {
      sortKey = sortSelect.value;
      render();
    });
  }

  /* ── Filter sidebar toggle (mobile) ─────────────────────── */

  function bindFilterToggle() {
    if (!filterToggle || !filterSidebar) return;
    filterToggle.addEventListener('click', () => {
      filterSidebar.classList.toggle('open');
      filterToggle.textContent = filterSidebar.classList.contains('open')
        ? 'Hide Filters' : 'Filter';
    });
  }

  /* ── Clear all ───────────────────────────────────────────── */

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllFilters);
  }

  /* ── Sync filter UI to state ─────────────────────────────── */

  function syncFilterUI() {
    filters.category.forEach(c => {
      document.querySelector(`[data-filter-category="${c}"]`)?.classList.add('active');
    });
    filters.special.forEach(s => {
      document.querySelector(`[data-filter-special="${s}"]`)?.classList.add('active');
    });
  }

  function refresh() {
    render();         // render() does not call renderActiveTags internally
    renderActiveTags();
  }

  /* ── Init ────────────────────────────────────────────────── */

  readURLParams();
  bindCategoryFilters();
  bindSizeFilters();
  bindSpecialFilters();
  bindPriceFilters();
  bindFilterAccordions();
  bindSort();
  bindFilterToggle();
  syncFilterUI();
  render();
});
