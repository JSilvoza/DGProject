/**
 * components/Accordion.js — Accordion expand/collapse behaviour.
 * No dependencies. Works on any .accordion container.
 */

export function initAccordions(container = document) {
  container.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item    = trigger.closest('.accordion-item');
      const wasOpen = item.classList.contains('open');
      trigger.closest('.accordion')
        ?.querySelectorAll('.accordion-item')
        .forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}
