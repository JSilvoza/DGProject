/**
 * pages/about.js — About page controller.
 */

import { initNav }          from '../components/Nav.js';
import { renderFooter }     from '../components/Footer.js';
import { initScrollReveal } from '../components/ScrollReveal.js';
import { showToast }        from '../components/Toast.js';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  renderFooter();
  initScrollReveal();

  document.getElementById('newsletterForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail')?.value ?? '';
    if (email.includes('@')) {
      showToast("You're in!", 'Welcome to the DG edit.', 'success');
      document.getElementById('newsletterEmail').value = '';
    } else {
      showToast('Invalid email', 'Please enter a valid email address.', 'error');
    }
  });
});
