/**
 * components/ScrollReveal.js — IntersectionObserver scroll animations.
 * Single persistent observer reused across re-renders (e.g. shop filters).
 * Toggles CSS classes; never sets inline styles.
 */

let _observer = null;

export function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  if (!_observer) {
    _observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          _observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
  }

  document.querySelectorAll('.animate-on-scroll:not(.animated)')
    .forEach(el => _observer.observe(el));
}
