/**
 * components/Footer.js — Footer template.
 * No dependencies. Pure HTML generation.
 */

export function renderFooter(containerId = 'footer') {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="container">
      <div class="footer__grid">
        <div>
          <div class="footer__brand-logo">DG</div>
          <p class="footer__brand-tagline">A contemporary clothing studio built on the principle that quality and restraint are not opposites.</p>
          <div class="footer__social">
            ${['Instagram', 'Twitter', 'TikTok'].map(s => `
              <a href="#" class="footer__social-link" aria-label="${s}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
              </a>`).join('')}
          </div>
        </div>
        <div>
          <div class="footer__col-title">Shop</div>
          <div class="footer__links">
            <a href="shop.html?category=tops"       class="footer__link">Tops</a>
            <a href="shop.html?category=bottoms"    class="footer__link">Bottoms</a>
            <a href="shop.html?category=outerwear"  class="footer__link">Outerwear</a>
            <a href="shop.html?category=accessories"class="footer__link">Accessories</a>
            <a href="shop.html?filter=new"          class="footer__link">New Arrivals</a>
            <a href="shop.html?filter=sale"         class="footer__link">Sale</a>
          </div>
        </div>
        <div>
          <div class="footer__col-title">Help</div>
          <div class="footer__links">
            <a href="#" class="footer__link">Shipping &amp; Returns</a>
            <a href="#" class="footer__link">Size Guide</a>
            <a href="#" class="footer__link">Care Instructions</a>
            <a href="#" class="footer__link">FAQ</a>
            <a href="#" class="footer__link">Contact Us</a>
          </div>
        </div>
        <div>
          <div class="footer__col-title">Company</div>
          <div class="footer__links">
            <a href="about.html" class="footer__link">About DG</a>
            <a href="#"          class="footer__link">Sustainability</a>
            <a href="#"          class="footer__link">Wholesale</a>
            <a href="#"          class="footer__link">Press</a>
            <a href="#"          class="footer__link">Careers</a>
          </div>
        </div>
      </div>
      <div class="footer__bottom">
        <span class="footer__copy">© 2026 DG Studio. All rights reserved.</span>
        <div class="footer__legal">
          <a href="#" class="footer__legal-link">Privacy Policy</a>
          <a href="#" class="footer__legal-link">Terms of Service</a>
          <a href="#" class="footer__legal-link">Cookie Policy</a>
        </div>
      </div>
    </div>
  `;
}
