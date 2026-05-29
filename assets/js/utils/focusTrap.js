/**
 * utils/focusTrap.js — Accessible focus containment.
 *
 * Used by: Drawer, Search modal, and any future dialog-type component.
 * Implements the ARIA Authoring Practices focus trap pattern.
 *
 * @example
 * const release = trapFocus(drawerElement);
 * // …later:
 * release(); // restores normal tab behaviour
 */

const FOCUSABLE_SELECTORS = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Trap keyboard focus inside `container`.
 *
 * @param {HTMLElement} container
 * @returns {() => void} release — call to remove the trap
 */
export function trapFocus(container) {
  /* Re-query on every Tab press so dynamically added elements are included */
  const focusable = () => [...container.querySelectorAll(FOCUSABLE_SELECTORS)];

  function onKeydown(e) {
    if (e.key !== 'Tab') return;
    const items = focusable();
    if (!items.length) { e.preventDefault(); return; }

    const first = items[0];
    const last  = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  container.addEventListener('keydown', onKeydown);
  return () => container.removeEventListener('keydown', onKeydown);
}

/**
 * Save the currently focused element and return a function that
 * restores focus to it — used by modals/drawers to return focus on close.
 *
 * @returns {() => void} restore
 */
export function saveFocus() {
  const saved = document.activeElement;
  return () => saved?.focus?.();
}
