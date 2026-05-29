/**
 * components/Drawer.js — Accessible side-panel drawer.
 *
 * Props:
 * @typedef {Object} DrawerProps
 * @property {string}        id        — unique id used for ARIA + DOM
 * @property {string}        title     — visible heading + aria-labelledby target
 * @property {'left'|'right'} [side]   — which edge to slide from (default: 'right')
 * @property {string}        [width]   — CSS width (default: '420px')
 * @property {string}        [content] — initial HTML content for the body
 * @property {() => void}    [onOpen]
 * @property {() => void}    [onClose]
 *
 * Instance API:
 * @typedef {Object} DrawerInstance
 * @property {(content?: string) => void} open    — show drawer, optionally set content
 * @property {() => void}                 close   — hide drawer
 * @property {(html: string) => void}     setContent — replace body content
 * @property {(s: string) => void}        setTitle   — update heading text
 * @property {() => void}                 destroy    — remove from DOM
 *
 * @example
 * const filterDrawer = createDrawer({
 *   id: 'filterDrawer',
 *   title: 'Filter products',
 *   side: 'left',
 *   onClose: () => console.log('closed'),
 * });
 * filterDrawer.open('<p>Filter content here</p>');
 */

import { trapFocus, saveFocus } from '../utils/focusTrap.js';

/* Registry prevents creating duplicate drawers with the same id */
const _registry = new Map();

/**
 * @param {DrawerProps} props
 * @returns {DrawerInstance}
 */
export function createDrawer(props) {
  const { id, title, side = 'right', width = '420px', content = '', onOpen, onClose } = props;

  /* Return existing instance if already created */
  if (_registry.has(id)) return _registry.get(id);

  /* ── DOM construction ──────────────────────────────────────────── */

  const backdrop = document.createElement('div');
  backdrop.className = 'drawer-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');

  const el = document.createElement('div');
  el.id        = id;
  el.className = `drawer drawer--${side}`;
  el.style.setProperty('--drawer-width', width);
  el.setAttribute('role',             'dialog');
  el.setAttribute('aria-modal',       'true');
  el.setAttribute('aria-labelledby',  `${id}-title`);
  el.hidden = true;

  el.innerHTML = `
    <div class="drawer__header">
      <h2 class="drawer__title" id="${id}-title">${_esc(title)}</h2>
      <button class="drawer__close btn btn--icon btn-ghost" aria-label="Close panel">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="drawer__body" id="${id}-body">${content}</div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(el);

  /* ── State ─────────────────────────────────────────────────────── */

  let _releaseTrap  = null;
  let _restoreFocus = null;

  /* ── Close handlers ────────────────────────────────────────────── */

  function close() {
    el.hidden     = true;
    backdrop.classList.remove('drawer-backdrop--visible');
    document.body.style.overflow = '';
    _releaseTrap?.();
    _restoreFocus?.();
    _releaseTrap = _restoreFocus = null;
    onClose?.();
  }

  el.querySelector('.drawer__close').addEventListener('click', close);
  backdrop.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (!el.hidden && e.key === 'Escape') { e.stopPropagation(); close(); }
  });

  /* ── Open ──────────────────────────────────────────────────────── */

  function open(newContent) {
    if (newContent !== undefined) setContent(newContent);
    _restoreFocus = saveFocus();
    el.hidden = false;
    backdrop.classList.add('drawer-backdrop--visible');
    document.body.style.overflow = 'hidden';

    /* Focus the first focusable element, or the close button as fallback */
    requestAnimationFrame(() => {
      const firstFocusable = el.querySelector(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      (firstFocusable ?? el.querySelector('.drawer__close'))?.focus();
      _releaseTrap = trapFocus(el);
    });

    onOpen?.();
  }

  /* ── Content & title setters ───────────────────────────────────── */

  function setContent(html) {
    el.querySelector(`#${id}-body`).innerHTML = html;
  }

  function setTitle(text) {
    el.querySelector(`#${id}-title`).textContent = text;
  }

  /* ── Destroy ────────────────────────────────────────────────────── */

  function destroy() {
    close();
    el.remove();
    backdrop.remove();
    _registry.delete(id);
  }

  const instance = { open, close, setContent, setTitle, destroy };
  _registry.set(id, instance);
  return instance;
}

/** Get an already-created drawer by id (returns null if not found) */
export function getDrawer(id) {
  return _registry.get(id) ?? null;
}

function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
