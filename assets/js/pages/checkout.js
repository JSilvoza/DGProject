/**
 * pages/checkout.js — Multi-step checkout controller.
 * Validates form data and places order by clearing the cart.
 */

import * as CartSvc    from '../infrastructure/CartService.js';
import { formatPrice }  from '../domain/pricing.js';
import { initNav }      from '../components/Nav.js';
import { showToast }    from '../components/Toast.js';

/* ── State ───────────────────────────────────────────────────────── */

const STEPS = ['contact', 'shipping', 'payment', 'review'];

let step = 0;

const form = {
  email: '', newsletter: false,
  firstName: '', lastName: '', address1: '', address2: '',
  city: '', state: '', zip: '', country: 'US',
  shippingMethod: 'standard',
  cardNumber: '', cardExpiry: '', cardCVC: '', cardName: '',
  promoCode: null,
};

/* ── Boot ────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  if (CartSvc.isEmpty()) { window.location.href = 'cart.html'; return; }
  initNav();
  renderStep();
});

/* ── Step rendering ──────────────────────────────────────────────── */

function renderStep() {
  _renderProgress();
  _renderContent();
  renderSummary();
}

function _renderProgress() {
  const el = document.getElementById('checkoutProgress');
  if (!el) return;
  const labels = ['Contact', 'Shipping', 'Payment', 'Review'];
  el.innerHTML = labels.map((label, i) => `
    <div class="checkout-progress__step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}">
      <span class="checkout-progress__num">${i < step ? '✓' : i + 1}</span>
      <span class="checkout-progress__label">${label}</span>
    </div>
    ${i < labels.length - 1 ? '<div class="checkout-progress__line"></div>' : ''}
  `).join('');
}

function _renderContent() {
  const el = document.getElementById('checkoutContent');
  if (!el) return;

  const renderers  = [_contactStep, _shippingStep, _paymentStep, _reviewStep];
  const btnLabels  = ['Continue to shipping', 'Continue to payment', 'Review order', 'Place order'];

  el.innerHTML = renderers[step]() + `
    <div style="display:flex;gap:var(--sp-3);margin-top:var(--sp-8)">
      ${step > 0 ? `<button class="btn btn-ghost" id="prevStepBtn">← Back</button>` : ''}
      <button class="btn btn-primary btn--lg ${step === 0 ? 'btn--full' : ''}" id="nextStepBtn" style="flex:1">
        ${btnLabels[step]}
      </button>
    </div>`;

  _bindFormInputs();
  document.getElementById('nextStepBtn')?.addEventListener('click', _nextStep);
  document.getElementById('prevStepBtn')?.addEventListener('click', () => { step--; renderStep(); });
}

/* ── Step templates ──────────────────────────────────────────────── */

function _contactStep() {
  return `
    <div class="checkout-step">
      <h2 class="checkout-step__title">Contact</h2>
      <div class="form-group">
        <label class="form-label">Email address</label>
        <input type="email" class="form-input" id="emailInput" value="${form.email}" placeholder="you@example.com">
      </div>
      <label style="display:flex;align-items:center;gap:var(--sp-3);margin-top:var(--sp-4);font-size:var(--text-sm);color:var(--clr-text-secondary);cursor:pointer">
        <input type="checkbox" id="newsletterCheck" ${form.newsletter ? 'checked' : ''} style="width:16px;height:16px">
        Email me with news and offers from DG Studio
      </label>
    </div>`;
}

function _shippingStep() {
  const stdPrice = CartSvc.getSubtotal() >= CartSvc.SHIPPING_THRESHOLD
    ? 'Free'
    : formatPrice(CartSvc.STANDARD_SHIPPING);

  const methods = [
    { id: 'standard',  label: 'Standard Shipping',  eta: '5–7 business days', price: stdPrice },
    { id: 'express',   label: 'Express Shipping',   eta: '2–3 business days', price: formatPrice(CartSvc.EXPRESS_SHIPPING) },
    { id: 'overnight', label: 'Overnight Shipping', eta: 'Next business day',  price: formatPrice(CartSvc.OVERNIGHT_SHIPPING) },
  ];

  return `
    <div class="checkout-step">
      <h2 class="checkout-step__title">Shipping address</h2>
      <div class="form-row-2">
        <div class="form-group"><label class="form-label">First name</label><input type="text" class="form-input" id="firstNameInput" value="${form.firstName}" placeholder="Jane"></div>
        <div class="form-group"><label class="form-label">Last name</label><input type="text" class="form-input" id="lastNameInput" value="${form.lastName}" placeholder="Doe"></div>
      </div>
      <div class="form-group" style="margin-bottom:var(--sp-4)"><label class="form-label">Address</label><input type="text" class="form-input" id="addr1Input" value="${form.address1}" placeholder="123 Main Street"></div>
      <div class="form-group" style="margin-bottom:var(--sp-4)"><label class="form-label">Apartment, suite, etc. (optional)</label><input type="text" class="form-input" id="addr2Input" value="${form.address2}" placeholder="Apt 4B"></div>
      <div class="form-row-3">
        <div class="form-group"><label class="form-label">City</label><input type="text" class="form-input" id="cityInput" value="${form.city}" placeholder="New York"></div>
        <div class="form-group"><label class="form-label">State</label><input type="text" class="form-input" id="stateInput" value="${form.state}" placeholder="NY"></div>
        <div class="form-group"><label class="form-label">ZIP code</label><input type="text" class="form-input" id="zipInput" value="${form.zip}" placeholder="10001"></div>
      </div>
      <h2 class="checkout-step__title" style="margin-top:var(--sp-4)">Shipping method</h2>
      <div class="shipping-methods">
        ${methods.map(m => `
          <label class="shipping-method ${form.shippingMethod === m.id ? 'active' : ''}" data-method="${m.id}">
            <input type="radio" name="shippingMethod" value="${m.id}" ${form.shippingMethod === m.id ? 'checked' : ''} style="accent-color:var(--clr-accent)">
            <div class="shipping-method__info">
              <span class="shipping-method__label">${m.label}</span>
              <span class="shipping-method__eta">${m.eta}</span>
            </div>
            <span class="shipping-method__price">${m.price}</span>
          </label>`).join('')}
      </div>
    </div>`;
}

function _paymentStep() {
  return `
    <div class="checkout-step">
      <h2 class="checkout-step__title">Payment</h2>
      <div class="form-group" style="margin-bottom:var(--sp-4)"><label class="form-label">Card number</label><input type="text" class="form-input" id="cardNumberInput" value="${form.cardNumber}" placeholder="1234 5678 9012 3456" maxlength="19"></div>
      <div class="form-group" style="margin-bottom:var(--sp-4)"><label class="form-label">Name on card</label><input type="text" class="form-input" id="cardNameInput" value="${form.cardName}" placeholder="Jane Doe"></div>
      <div class="form-row-2">
        <div class="form-group"><label class="form-label">Expiry date</label><input type="text" class="form-input" id="cardExpiryInput" value="${form.cardExpiry}" placeholder="MM / YY" maxlength="7"></div>
        <div class="form-group"><label class="form-label">CVC</label><input type="text" class="form-input" id="cardCVCInput" value="${form.cardCVC}" placeholder="•••" maxlength="4"></div>
      </div>
      <p style="font-size:var(--text-xs);color:var(--clr-text-muted)">Demo store — no real payment will be processed.</p>
    </div>`;
}

function _reviewStep() {
  return `
    <div class="checkout-step">
      <h2 class="checkout-step__title">Review your order</h2>
      <div style="background:var(--clr-surface);border:1px solid var(--clr-border);border-radius:var(--radius-md);padding:var(--sp-5);margin-bottom:var(--sp-6)">
        <div style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:var(--tracking-wider);color:var(--clr-text-secondary);margin-bottom:var(--sp-3)">Contact</div>
        <div style="font-size:var(--text-sm)">${form.email}</div>
      </div>
      <div style="background:var(--clr-surface);border:1px solid var(--clr-border);border-radius:var(--radius-md);padding:var(--sp-5);margin-bottom:var(--sp-6)">
        <div style="font-size:var(--text-xs);text-transform:uppercase;letter-spacing:var(--tracking-wider);color:var(--clr-text-secondary);margin-bottom:var(--sp-3)">Ship to</div>
        <div style="font-size:var(--text-sm)">${form.firstName} ${form.lastName}<br>${form.address1}${form.address2 ? ', ' + form.address2 : ''}<br>${form.city}, ${form.state} ${form.zip}</div>
      </div>
      <p style="font-size:var(--text-sm);color:var(--clr-text-secondary)">By placing your order you agree to DG Studio's <a href="#" style="color:var(--clr-accent);text-decoration:underline">Terms of Service</a>.</p>
    </div>`;
}

/* ── Summary sidebar ─────────────────────────────────────────────── */

function renderSummary() {
  const el = document.getElementById('checkoutSummary');
  if (!el) return;

  const items    = CartSvc.getItems();
  const sub      = CartSvc.getSubtotal();
  const shipping = CartSvc.getShipping(form.shippingMethod);
  const discount = form.promoCode?.discount ?? 0;
  const total    = sub + shipping - discount;

  el.innerHTML = `
    <div class="checkout-summary">
      <div class="checkout-summary__items">
        ${items.map(item => `
          <div class="checkout-summary__item">
            <div class="checkout-summary__img-wrap">
              <img src="${item.image}" alt="${item.name}" class="checkout-summary__img">
              <span class="checkout-summary__qty">${item.quantity}</span>
            </div>
            <div class="checkout-summary__info">
              <div class="checkout-summary__name">${item.name}</div>
              <div class="checkout-summary__meta">${item.size} / ${item.color}</div>
            </div>
            <div class="checkout-summary__price">${formatPrice(item.price * item.quantity)}</div>
          </div>`).join('')}
      </div>
      <div class="checkout-summary__divider"></div>
      ${form.promoCode
        ? `<div style="font-size:var(--text-xs);color:var(--clr-success);margin-bottom:var(--sp-4)">✓ "${form.promoCode.code}" applied — save ${formatPrice(discount)}</div>`
        : `<div class="promo-form"><input id="promoInput" type="text" placeholder="Gift card or promo code"><button class="btn btn-outline btn--sm" id="applyPromoBtn">Apply</button></div>`}
      <div class="checkout-summary__row"><span>Subtotal</span><span>${formatPrice(sub)}</span></div>
      ${discount ? `<div class="checkout-summary__row" style="color:var(--clr-success)"><span>Discount</span><span>−${formatPrice(discount)}</span></div>` : ''}
      <div class="checkout-summary__row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
      <div class="checkout-summary__total"><span>Total</span><span>${formatPrice(total)}</span></div>
    </div>`;

  document.getElementById('applyPromoBtn')?.addEventListener('click', () => {
    const code  = document.getElementById('promoInput')?.value?.trim();
    if (!code) return;
    const promo = CartSvc.validatePromo(code);
    if (promo) {
      form.promoCode = promo;
      renderSummary();
      showToast('Promo applied!', `${promo.rate * 100}% off — saving ${formatPrice(promo.discount)}`, 'success');
    } else {
      showToast('Invalid code', "That promo code isn't valid.", 'error');
    }
  });
}

/* ── Form input binding ──────────────────────────────────────────── */

function _bindFormInputs() {
  const bind = (id, key, transform = v => v) => {
    document.getElementById(id)?.addEventListener('input', e => { form[key] = transform(e.target.value); });
  };

  bind('emailInput',      'email');
  bind('firstNameInput',  'firstName');
  bind('lastNameInput',   'lastName');
  bind('addr1Input',      'address1');
  bind('addr2Input',      'address2');
  bind('cityInput',       'city');
  bind('stateInput',      'state');
  bind('zipInput',        'zip');
  bind('cardNameInput',   'cardName');
  bind('cardCVCInput',    'cardCVC');

  document.getElementById('newsletterCheck')?.addEventListener('change', e => { form.newsletter = e.target.checked; });

  /* Card number formatter */
  document.getElementById('cardNumberInput')?.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    e.target.value = v;
    form.cardNumber = v;
  });

  /* Expiry formatter */
  document.getElementById('cardExpiryInput')?.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) v = `${v.slice(0, 2)} / ${v.slice(2)}`;
    e.target.value = v;
    form.cardExpiry = v;
  });

  /* Shipping method */
  document.querySelectorAll('[name="shippingMethod"]').forEach(radio => {
    radio.addEventListener('change', e => {
      form.shippingMethod = e.target.value;
      document.querySelectorAll('.shipping-method').forEach(el => el.classList.remove('active'));
      radio.closest('.shipping-method')?.classList.add('active');
      renderSummary();
    });
  });
}

/* ── Step navigation ─────────────────────────────────────────────── */

function _nextStep() {
  if (!_validate()) return;
  if (step < STEPS.length - 1) {
    step++;
    renderStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    _placeOrder();
  }
}

function _validate() {
  if (step === 0 && (!form.email || !form.email.includes('@'))) {
    showToast('Required', 'Please enter a valid email address.', 'error');
    document.getElementById('emailInput')?.focus();
    return false;
  }
  if (step === 1 && (!form.firstName || !form.address1 || !form.city || !form.zip)) {
    showToast('Required', 'Please fill in all required address fields.', 'error');
    return false;
  }
  return true;
}

function _placeOrder() {
  const btn = document.getElementById('nextStepBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; }
  setTimeout(() => {
    CartSvc.clearCart();
    window.location.href = 'index.html?order=success';
  }, 1800);
}
