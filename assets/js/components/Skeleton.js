/**
 * components/Skeleton.js — Loading state placeholders.
 *
 * Renders shimmer skeletons that match the exact layout of the real content,
 * eliminating layout shift when content loads.
 *
 * The containing region should carry aria-busy="true" while loading;
 * skeletons themselves are aria-hidden so screen readers skip them.
 *
 * @example
 * // Show 8 product card skeletons while products load
 * showSkeletons(gridEl, 'product-card', 8);
 *
 * // Later, remove skeletons and insert real content
 * hideSkeletons(gridEl);
 * gridEl.innerHTML = products.map(renderProductCard).join('');
 */

/* ── Skeleton templates ──────────────────────────────────────────── */

const TEMPLATES = {
  /** Matches the exact layout of ProductCard.js output */
  'product-card': () => `
    <div class="skeleton-product-card" aria-hidden="true">
      <div class="skeleton skeleton-product-card__img"></div>
      <div class="skeleton-product-card__info">
        <div class="skeleton skeleton-line" style="width:40%;height:10px;margin-bottom:8px"></div>
        <div class="skeleton skeleton-line" style="width:75%"></div>
        <div class="skeleton skeleton-line" style="width:30%;margin-top:8px"></div>
        <div class="skeleton skeleton-line" style="width:20%;margin-top:6px"></div>
      </div>
    </div>`,

  /** Matches cart-item layout in cart.html */
  'cart-item': () => `
    <div class="skeleton-cart-item" aria-hidden="true">
      <div class="skeleton skeleton-cart-item__img"></div>
      <div class="skeleton-cart-item__info">
        <div class="skeleton skeleton-line" style="width:60%;margin-bottom:8px"></div>
        <div class="skeleton skeleton-line" style="width:35%;margin-bottom:8px"></div>
        <div class="skeleton skeleton-line" style="width:20%"></div>
      </div>
      <div class="skeleton skeleton-cart-item__qty"></div>
    </div>`,

  /** Generic text block placeholder */
  'text-block': ({ lines = 3 } = {}) => Array.from({ length: lines }, (_, i) => `
    <div class="skeleton skeleton-line" style="width:${i === lines - 1 ? '60' : '100'}%" aria-hidden="true"></div>
  `).join(''),

  /** Single heading + subheading */
  'heading': () => `
    <div aria-hidden="true">
      <div class="skeleton skeleton-line" style="width:50%;height:28px;margin-bottom:12px"></div>
      <div class="skeleton skeleton-line" style="width:70%;height:14px"></div>
    </div>`,
};

/* ── Public API ──────────────────────────────────────────────────── */

/**
 * Returns the HTML string for `count` skeletons of the given `type`.
 *
 * @param {'product-card'|'cart-item'|'text-block'|'heading'} type
 * @param {number} [count=1]
 * @param {Object} [options]   — passed through to the template
 * @returns {string}
 */
export function renderSkeleton(type, count = 1, options = {}) {
  const template = TEMPLATES[type];
  if (!template) throw new Error(`Unknown skeleton type: "${type}"`);
  return Array.from({ length: count }, () => template(options)).join('');
}

/**
 * Mounts `count` skeletons into `container` and marks it aria-busy.
 *
 * @param {HTMLElement} container
 * @param {'product-card'|'cart-item'|'text-block'|'heading'} type
 * @param {number} [count=4]
 * @param {Object} [options]
 */
export function showSkeletons(container, type, count = 4, options = {}) {
  if (!container) return;
  container.setAttribute('aria-busy', 'true');
  container.innerHTML = renderSkeleton(type, count, options);
}

/**
 * Removes all skeletons from `container` and clears aria-busy.
 * Call this after inserting real content.
 *
 * @param {HTMLElement} container
 */
export function hideSkeletons(container) {
  if (!container) return;
  container.removeAttribute('aria-busy');
  /* The caller is expected to immediately replace innerHTML with real content.
     We don't clear innerHTML here because that would cause a blank flash. */
}
