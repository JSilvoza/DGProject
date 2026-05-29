/**
 * components/Toast.js — Self-contained notification UI.
 * No domain imports. Accepts plain strings.
 */

const ICONS = {
  success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

let _container = null;

function getContainer() {
  if (!_container) {
    _container = document.createElement('div');
    _container.className = 'toast-container';
    document.body.appendChild(_container);
  }
  return _container;
}

export function showToast(title, message = '', type = 'info', duration = 3500) {
  const container = getContainer();

  const titleEl = document.createElement('div');
  titleEl.className   = 'toast__title';
  titleEl.textContent = title;

  const content = document.createElement('div');
  content.className = 'toast__content';
  content.appendChild(titleEl);

  if (message) {
    const msgEl = document.createElement('div');
    msgEl.className   = 'toast__message';
    msgEl.textContent = message;
    content.appendChild(msgEl);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast__close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  const icon = document.createElement('span');
  icon.className = 'toast__icon';
  icon.innerHTML = ICONS[type] ?? ICONS.info;

  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.append(icon, content, closeBtn);
  container.appendChild(el);

  const dismiss = () => {
    el.style.cssText = 'opacity:0;transform:translateX(24px);transition:opacity 200ms,transform 200ms';
    setTimeout(() => el.remove(), 220);
  };

  let timer = setTimeout(dismiss, duration);
  closeBtn.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, duration); });
}
