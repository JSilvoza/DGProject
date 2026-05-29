'use strict';

/* ================================================================
   DG Checkout Page
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (DG.cart.isEmpty()) {
    window.location.href = 'cart.html';
    return;
  }

  const steps = ['contact', 'shipping', 'payment', 'review'];
  let currentStep = 0;

  const formData = {
    email: '', newsletter: false,
    firstName: '', lastName: '', address1: '', address2: '',
    city: '', state: '', zip: '', country: 'US',
    shippingMethod: 'standard',
    cardNumber: '', cardExpiry: '', cardCVC: '', cardName: '',
    promoCode: null,
  };

  /* ── Render order summary sidebar ────────────────────────── */

  function renderSummary() {
    const summaryEl = document.getElementById('checkoutSummary');
    if (!summaryEl) return;

    const items     = DG.cart.getItems();
    const subtotal  = DG.cart.getSubtotal();
    const shipping  = formData.shippingMethod === 'express'   ? DG.cart.EXPRESS_SHIPPING
                    : formData.shippingMethod === 'overnight' ? DG.cart.OVERNIGHT_SHIPPING
                    : DG.cart.getShipping();
    const discount  = formData.promoCode ? formData.promoCode.discount : 0;
    const total     = subtotal + shipping - discount;

    summaryEl.innerHTML = `
      <div class="checkout-summary">
        <div class="checkout-summary__items">
          ${items.map(item => {
            const p = DG.getProductById(item.productId);
            return `
              <div class="checkout-summary__item">
                <div class="checkout-summary__img-wrap">
                  <img src="${item.image}" alt="${item.name}" class="checkout-summary__img">
                  <span class="checkout-summary__qty">${item.quantity}</span>
                </div>
                <div class="checkout-summary__info">
                  <div class="checkout-summary__name">${item.name}</div>
                  <div class="checkout-summary__meta">${item.size} / ${item.color}</div>
                </div>
                <div class="checkout-summary__price">${DG.formatPrice(item.price * item.quantity)}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="checkout-summary__divider"></div>

        ${formData.promoCode ? `
          <div class="promo-form" style="margin-bottom:var(--sp-4)">
            <div style="font-size:var(--text-xs);color:var(--clr-success)">
              ✓ Code "${formData.promoCode.code}" applied — save ${DG.formatPrice(discount)}
            </div>
          </div>` : `
          <div class="promo-form">
            <input id="promoInput" type="text" placeholder="Gift card or promo code">
            <button class="btn btn-outline btn--sm" id="applyPromoBtn">Apply</button>
          </div>`
        }

        <div class="checkout-summary__row">
          <span>Subtotal</span><span>${DG.formatPrice(subtotal)}</span>
        </div>
        ${discount ? `
          <div class="checkout-summary__row" style="color:var(--clr-success)">
            <span>Discount</span><span>−${DG.formatPrice(discount)}</span>
          </div>` : ''}
        <div class="checkout-summary__row">
          <span>Shipping</span><span>${shipping === 0 ? 'Free' : DG.formatPrice(shipping)}</span>
        </div>
        <div class="checkout-summary__total">
          <span>Total</span><span>${DG.formatPrice(total)}</span>
        </div>

        <p style="font-size:var(--text-xs);color:var(--clr-text-muted);margin-top:var(--sp-3)">
          Tax included where applicable. Final amount confirmed on next screen.
        </p>
      </div>
    `;

    document.getElementById('applyPromoBtn')?.addEventListener('click', () => {
      const code = document.getElementById('promoInput')?.value?.trim();
      if (!code) return;
      const promo = DG.cart.applyPromo(code);
      if (promo) {
        formData.promoCode = promo;
        renderSummary();
        DG.ui.toast('Promo applied!', `${promo.rate * 100}% off — saving ${DG.formatPrice(promo.discount)}`, 'success');
      } else {
        DG.ui.toast('Invalid code', 'That promo code isn\'t valid.', 'error');
      }
    });
  }

  /* ── Step renderers ──────────────────────────────────────── */

  function renderContactStep() {
    return `
      <div class="checkout-step">
        <h2 class="checkout-step__title">Contact</h2>
        <div class="form-group">
          <label class="form-label">Email address</label>
          <input type="email" class="form-input" id="emailInput" value="${formData.email}" placeholder="you@example.com">
        </div>
        <label class="checkout-check" style="display:flex;align-items:center;gap:var(--sp-3);margin-top:var(--sp-4);font-size:var(--text-sm);color:var(--clr-text-secondary);cursor:pointer">
          <input type="checkbox" id="newsletterCheck" ${formData.newsletter ? 'checked' : ''} style="width:16px;height:16px">
          Email me with news and offers from DG Studio
        </label>
      </div>
    `;
  }

  function renderShippingStep() {
    const methods = [
      { id: 'standard',  label: 'Standard Shipping',  eta: '5–7 business days', price: DG.cart.getSubtotal() >= DG.cart.SHIPPING_THRESHOLD ? 'Free' : DG.formatPrice(DG.cart.STANDARD_SHIPPING) },
      { id: 'express',   label: 'Express Shipping',   eta: '2–3 business days', price: DG.formatPrice(DG.cart.EXPRESS_SHIPPING) },
      { id: 'overnight', label: 'Overnight Shipping', eta: 'Next business day',  price: DG.formatPrice(DG.cart.OVERNIGHT_SHIPPING) },
    ];

    return `
      <div class="checkout-step">
        <h2 class="checkout-step__title">Shipping address</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);margin-bottom:var(--sp-4)">
          <div class="form-group">
            <label class="form-label">First name</label>
            <input type="text" class="form-input" id="firstNameInput" value="${formData.firstName}" placeholder="Jane">
          </div>
          <div class="form-group">
            <label class="form-label">Last name</label>
            <input type="text" class="form-input" id="lastNameInput" value="${formData.lastName}" placeholder="Doe">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:var(--sp-4)">
          <label class="form-label">Address</label>
          <input type="text" class="form-input" id="addr1Input" value="${formData.address1}" placeholder="123 Main Street">
        </div>
        <div class="form-group" style="margin-bottom:var(--sp-4)">
          <label class="form-label">Apartment, suite, etc. (optional)</label>
          <input type="text" class="form-input" id="addr2Input" value="${formData.address2}" placeholder="Apt 4B">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-4);margin-bottom:var(--sp-8)">
          <div class="form-group">
            <label class="form-label">City</label>
            <input type="text" class="form-input" id="cityInput" value="${formData.city}" placeholder="New York">
          </div>
          <div class="form-group">
            <label class="form-label">State</label>
            <input type="text" class="form-input" id="stateInput" value="${formData.state}" placeholder="NY">
          </div>
          <div class="form-group">
            <label class="form-label">ZIP code</label>
            <input type="text" class="form-input" id="zipInput" value="${formData.zip}" placeholder="10001">
          </div>
        </div>

        <h2 class="checkout-step__title" style="margin-top:var(--sp-4)">Shipping method</h2>
        <div class="shipping-methods">
          ${methods.map(m => `
            <label class="shipping-method ${formData.shippingMethod === m.id ? 'active' : ''}" data-method="${m.id}">
              <input type="radio" name="shippingMethod" value="${m.id}" ${formData.shippingMethod === m.id ? 'checked' : ''} style="accent-color:var(--clr-accent)">
              <div class="shipping-method__info">
                <span class="shipping-method__label">${m.label}</span>
                <span class="shipping-method__eta">${m.eta}</span>
              </div>
              <span class="shipping-method__price">${m.price}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderPaymentStep() {
    return `
      <div class="checkout-step">
        <h2 class="checkout-step__title">Payment</h2>
        <p style="font-size:var(--text-xs);color:var(--clr-text-secondary);margin-bottom:var(--sp-5);display:flex;align-items:center;gap:var(--sp-2)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
          All transactions are secure and encrypted.
        </p>
        <div class="form-group" style="margin-bottom:var(--sp-4)">
          <label class="form-label">Card number</label>
          <input type="text" class="form-input" id="cardNumberInput" value="${formData.cardNumber}" placeholder="1234 5678 9012 3456" maxlength="19">
        </div>
        <div class="form-group" style="margin-bottom:var(--sp-4)">
          <label class="form-label">Name on card</label>
          <input type="text" class="form-input" id="cardNameInput" value="${formData.cardName}" placeholder="Jane Doe">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);margin-bottom:var(--sp-8)">
          <div class="form-group">
            <label class="form-label">Expiry date</label>
            <input type="text" class="form-input" id="cardExpiryInput" value="${formData.cardExpiry}" placeholder="MM / YY" maxlength="7">
          </div>
          <div class="form-group">
            <label class="form-label">CVC</label>
            <input type="text" class="form-input" id="cardCVCInput" value="${formData.cardCVC}" placeholder="•••" maxlength="4">
          </div>
        </div>
        <p style="font-size:var(--text-xs);color:var(--clr-text-muted)">
          This is a demo store — no real payment will be processed.
        </p>
      </div>
    `;
  }

  function renderReviewStep() {
    const subtotal = DG.cart.getSubtotal();
    const shipping = DG.cart.getShipping();
    const discount = formData.promoCode?.discount || 0;
    const total    = subtotal + shipping - discount;

    return `
      <div class="checkout-step">
        <h2 class="checkout-step__title">Review your order</h2>
        <div style="background:var(--clr-surface);border:1px solid var(--clr-border);border-radius:var(--radius-md);padding:var(--sp-5);margin-bottom:var(--sp-6)">
          <div style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:var(--tracking-wider);color:var(--clr-text-secondary);margin-bottom:var(--sp-3)">Contact</div>
          <div style="font-size:var(--text-sm)">${formData.email}</div>
        </div>
        <div style="background:var(--clr-surface);border:1px solid var(--clr-border);border-radius:var(--radius-md);padding:var(--sp-5);margin-bottom:var(--sp-6)">
          <div style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:var(--tracking-wider);color:var(--clr-text-secondary);margin-bottom:var(--sp-3)">Ship to</div>
          <div style="font-size:var(--text-sm)">${formData.firstName} ${formData.lastName}<br>${formData.address1}${formData.address2 ? ', ' + formData.address2 : ''}<br>${formData.city}, ${formData.state} ${formData.zip}</div>
        </div>
        <div style="font-size:var(--text-sm);color:var(--clr-text-secondary);line-height:var(--leading-relaxed);margin-bottom:var(--sp-6)">
          By placing your order, you agree to DG Studio's <a href="#" style="color:var(--clr-accent);text-decoration:underline">Terms of Service</a> and <a href="#" style="color:var(--clr-accent);text-decoration:underline">Privacy Policy</a>.
        </div>
      </div>
    `;
  }

  /* ── Step navigation ─────────────────────────────────────── */

  function renderStep() {
    const contentEl = document.getElementById('checkoutContent');
    const progressEl = document.getElementById('checkoutProgress');

    const renderers = [renderContactStep, renderShippingStep, renderPaymentStep, renderReviewStep];
    const btnLabels = ['Continue to shipping', 'Continue to payment', 'Review order', 'Place order'];

    if (contentEl) {
      contentEl.innerHTML = renderers[currentStep]() + `
        <div style="display:flex;gap:var(--sp-3);margin-top:var(--sp-8)">
          ${currentStep > 0 ? `<button class="btn btn-ghost" id="prevStepBtn">← Back</button>` : ''}
          <button class="btn btn-primary btn--lg ${currentStep === 0 ? 'btn--full' : ''}" id="nextStepBtn" style="flex:1">
            ${btnLabels[currentStep]}
          </button>
        </div>
      `;

      bindStepInputs();

      document.getElementById('nextStepBtn')?.addEventListener('click', nextStep);
      document.getElementById('prevStepBtn')?.addEventListener('click', () => {
        currentStep--;
        renderStep();
      });
    }

    if (progressEl) {
      const labels = ['Contact', 'Shipping', 'Payment', 'Review'];
      progressEl.innerHTML = labels.map((label, i) => `
        <div class="checkout-progress__step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}">
          <span class="checkout-progress__num">${i < currentStep ? '✓' : i + 1}</span>
          <span class="checkout-progress__label">${label}</span>
        </div>
        ${i < labels.length - 1 ? '<div class="checkout-progress__line"></div>' : ''}
      `).join('');
    }

    renderSummary();
  }

  function bindStepInputs() {
    // Contact
    document.getElementById('emailInput')?.addEventListener('input', e => formData.email = e.target.value);
    document.getElementById('newsletterCheck')?.addEventListener('change', e => formData.newsletter = e.target.checked);
    // Shipping address
    document.getElementById('firstNameInput')?.addEventListener('input', e => formData.firstName = e.target.value);
    document.getElementById('lastNameInput')?.addEventListener('input', e => formData.lastName = e.target.value);
    document.getElementById('addr1Input')?.addEventListener('input', e => formData.address1 = e.target.value);
    document.getElementById('addr2Input')?.addEventListener('input', e => formData.address2 = e.target.value);
    document.getElementById('cityInput')?.addEventListener('input', e => formData.city = e.target.value);
    document.getElementById('stateInput')?.addEventListener('input', e => formData.state = e.target.value);
    document.getElementById('zipInput')?.addEventListener('input', e => formData.zip = e.target.value);
    // Shipping method
    document.querySelectorAll('[name="shippingMethod"]').forEach(radio => {
      radio.addEventListener('change', e => {
        formData.shippingMethod = e.target.value;
        document.querySelectorAll('.shipping-method').forEach(el => el.classList.remove('active'));
        radio.closest('.shipping-method')?.classList.add('active');
        renderSummary();
      });
    });
    // Payment
    const cardNum = document.getElementById('cardNumberInput');
    cardNum?.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g,'').substring(0,16);
      v = v.replace(/(.{4})/g,'$1 ').trim();
      e.target.value = v;
      formData.cardNumber = v;
    });
    const expiry = document.getElementById('cardExpiryInput');
    expiry?.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g,'').substring(0,4);
      if (v.length > 2) v = v.substring(0,2) + ' / ' + v.substring(2);
      e.target.value = v;
      formData.cardExpiry = v;
    });
    document.getElementById('cardCVCInput')?.addEventListener('input', e => formData.cardCVC = e.target.value);
    document.getElementById('cardNameInput')?.addEventListener('input', e => formData.cardName = e.target.value);
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    if (currentStep < steps.length - 1) {
      currentStep++;
      renderStep();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      placeOrder();
    }
  }

  function validateStep(step) {
    if (step === 0) {
      if (!formData.email || !formData.email.includes('@')) {
        DG.ui.toast('Required', 'Please enter a valid email address.', 'error');
        document.getElementById('emailInput')?.focus();
        return false;
      }
    }
    if (step === 1) {
      if (!formData.firstName || !formData.address1 || !formData.city || !formData.zip) {
        DG.ui.toast('Required', 'Please fill in all required address fields.', 'error');
        return false;
      }
    }
    return true;
  }

  function placeOrder() {
    const btn = document.getElementById('nextStepBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Processing…';
    }

    setTimeout(() => {
      DG.cart.clearCart();
      window.location.href = 'index.html?order=success';
    }, 1800);
  }

  /* ── Init ────────────────────────────────────────────────── */

  renderStep();
});
