/**
 * components/EmptyState.js — Consistent empty state UI.
 *
 * Props:
 * @typedef {Object} EmptyStateAction
 * @property {string}        label
 * @property {string}        [href]     — if provided, renders as <a>
 * @property {() => void}   [onClick]  — if no href, renders as <button>
 *
 * @typedef {Object} EmptyStateProps
 * @property {string}           icon        — inline SVG string
 * @property {string}           title
 * @property {string}           [description]
 * @property {EmptyStateAction} [action]
 *
 * @example
 * // Render HTML string
 * gridEl.innerHTML = renderEmptyState(EmptyStates.noProducts());
 *
 * // Mount into an element
 * mountEmptyState(cartItemsEl, EmptyStates.cart(() => window.location = 'shop.html'));
 */

/* ── Shared SVG icons ────────────────────────────────────────────── */

const ICONS = {
  bag: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,

  search: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,

  filter: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,

  heart: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,

  box: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
};

/* ── Core render ─────────────────────────────────────────────────── */

/**
 * Returns an HTML string for the empty state.
 * Safe to assign to `element.innerHTML`.
 *
 * @param {EmptyStateProps} props
 * @returns {string}
 */
export function renderEmptyState({ icon, title, description, action }) {
  const actionEl = action
    ? action.href
      ? `<a href="${_esc(action.href)}" class="btn btn-primary btn--lg">${_esc(action.label)}</a>`
      : `<button class="btn btn-primary btn--lg" data-empty-action="true">${_esc(action.label)}</button>`
    : '';

  return `
    <div class="empty-state" role="status">
      <div class="empty-state__icon" aria-hidden="true">${icon ?? ICONS.box}</div>
      <h2 class="empty-state__title">${_esc(title)}</h2>
      ${description ? `<p class="empty-state__description">${_esc(description)}</p>` : ''}
      ${actionEl}
    </div>`;
}

/**
 * Mounts an empty state into `container`, binding onClick if provided.
 *
 * @param {HTMLElement}    container
 * @param {EmptyStateProps} props
 */
export function mountEmptyState(container, props) {
  if (!container) return;
  container.innerHTML = renderEmptyState(props);

  if (props.action?.onClick) {
    container
      .querySelector('[data-empty-action]')
      ?.addEventListener('click', props.action.onClick);
  }
}

/* ── Pre-built variants ──────────────────────────────────────────── */

/**
 * Ready-made empty states for common scenarios.
 * Each returns an EmptyStateProps object.
 */
export const EmptyStates = {
  /**
   * Empty shopping cart
   * @param {() => void} [onShop] — click handler for the CTA
   */
  cart: (onShop) => ({
    icon:        ICONS.bag,
    title:       'Your cart is empty',
    description: "You haven't added anything yet. Start exploring.",
    action:      { label: 'Shop now', href: onShop ? undefined : 'shop.html', onClick: onShop },
  }),

  /**
   * Search returned no matches
   * @param {string} query
   */
  noResults: (query) => ({
    icon:        ICONS.search,
    title:       `No results for "${query}"`,
    description: 'Try a different spelling or browse all products.',
    action:      { label: 'Browse all products', href: 'shop.html' },
  }),

  /**
   * Shop grid is empty after applying filters
   * @param {() => void} [onClear] — click handler to clear filters
   */
  noProducts: (onClear) => ({
    icon:        ICONS.filter,
    title:       'No products match your filters',
    description: 'Try removing some filters to see more results.',
    action:      { label: 'Clear all filters', onClick: onClear, href: onClear ? undefined : 'shop.html' },
  }),

  /** Wishlist is empty */
  wishlist: () => ({
    icon:        ICONS.heart,
    title:       'Your wishlist is empty',
    description: 'Save items you love to find them easily later.',
    action:      { label: 'Start shopping', href: 'shop.html' },
  }),

  /** Generic fallback */
  generic: (title = 'Nothing here yet', description = '') => ({
    icon:  ICONS.box,
    title,
    description,
  }),
};

function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
