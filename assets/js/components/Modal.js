/**
 * components/Modal.js — Generic modal open/close.
 * No dependencies. Works on any element with the .modal-overlay class.
 */

export function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(id);
  }, { once: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal(id);
  }, { once: true });
}

export function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.body.style.overflow = '';
}
