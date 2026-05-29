/**
 * infrastructure/events.js — Typed DOM event bus.
 * Thin wrapper so consumers don't couple to window directly.
 */

export function emit(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function on(name, handler, opts) {
  window.addEventListener(name, handler, opts);
}

export function off(name, handler) {
  window.removeEventListener(name, handler);
}
