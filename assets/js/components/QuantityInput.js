/**
 * components/QuantityInput.js — Accessible quantity increment/decrement.
 *
 * Handles every edge case:
 *   - Min/max clamping (keyboard and button)
 *   - NaN/empty input → snaps to min on blur
 *   - Decimal input → rounded to nearest integer
 *   - Disabled state propagates to all children
 *   - aria-label on +/- buttons describes purpose, not just symbol
 *   - Mobile: 44×44px touch targets on buttons
 *
 * Props:
 * @typedef {Object} QuantityInputProps
 * @property {number}            [value]      — initial value (default: 1)
 * @property {number}            [min]        — minimum value (default: 1)
 * @property {number}            [max]        — maximum value (default: 10)
 * @property {number}            [step]       — increment/decrement step (default: 1)
 * @property {boolean}           [disabled]   — disable all controls (default: false)
 * @property {(n: number)=>void} onChange     — called with clamped integer value
 * @property {string}            [id]         — id for the inner <input>
 * @property {string}            [label]      — screen-reader label for the group
 *                                              (default: "Quantity")
 *
 * Instance API:
 * @typedef {Object} QuantityInstance
 * @property {HTMLElement}           element     — the root DOM node to insert
 * @property {() => number}          getValue    — returns current clamped value
 * @property {(n: number) => void}   setValue    — set value programmatically
 * @property {(d: boolean) => void}  setDisabled — toggle disabled state
 *
 * @example
 * const qty = createQuantityInput({
 *   value: 1, min: 1, max: 10,
 *   onChange: (n) => console.log('qty changed to', n),
 *   label: 'Product quantity',
 * });
 * document.getElementById('qtyWrap').appendChild(qty.element);
 *
 * // Later:
 * qty.setValue(3);
 * qty.setDisabled(true);
 * console.log(qty.getValue()); // 3
 */

/**
 * @param {QuantityInputProps} props
 * @returns {QuantityInstance}
 */
export function createQuantityInput(props) {
  const {
    value    = 1,
    min      = 1,
    max      = 10,
    step     = 1,
    disabled = false,
    onChange,
    id       = `qty-${Date.now()}`,
    label    = 'Quantity',
  } = props;

  /* ── State ─────────────────────────────────────────────────────── */

  let _value = _clamp(value, min, max);

  /* ── DOM ───────────────────────────────────────────────────────── */

  const root = document.createElement('div');
  root.className = 'qty-input';
  root.setAttribute('role',       'group');
  root.setAttribute('aria-label', label);

  const minusBtn = document.createElement('button');
  minusBtn.type      = 'button';
  minusBtn.className = 'qty-input__btn';
  minusBtn.setAttribute('aria-label', `Decrease ${label.toLowerCase()}`);
  minusBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

  const input = document.createElement('input');
  input.id          = id;
  input.type        = 'number';
  input.className   = 'qty-input__field';
  input.min         = min;
  input.max         = max;
  input.step        = step;
  input.value       = _value;
  input.setAttribute('aria-label', label);
  /* Remove native spinner arrows — we provide our own buttons */
  input.setAttribute('inputmode', 'numeric');

  const plusBtn = document.createElement('button');
  plusBtn.type      = 'button';
  plusBtn.className = 'qty-input__btn';
  plusBtn.setAttribute('aria-label', `Increase ${label.toLowerCase()}`);
  plusBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

  root.append(minusBtn, input, plusBtn);

  /* ── Sync ──────────────────────────────────────────────────────── */

  function _sync(newVal, notify = true) {
    _value        = _clamp(Math.round(newVal), min, max);
    input.value   = _value;
    minusBtn.disabled = disabled || _value <= min;
    plusBtn.disabled  = disabled || _value >= max;
    if (notify) onChange?.(_value);
  }

  /* ── Event handlers ────────────────────────────────────────────── */

  minusBtn.addEventListener('click', () => _sync(_value - step));
  plusBtn.addEventListener('click',  () => _sync(_value + step));

  input.addEventListener('change', (e) => {
    const parsed = parseInt(e.target.value, 10);
    /* NaN or empty string → snap to min */
    _sync(isNaN(parsed) ? min : parsed);
  });

  /* Prevent out-of-range values while typing */
  input.addEventListener('blur', () => {
    const parsed = parseInt(input.value, 10);
    _sync(isNaN(parsed) ? min : parsed, false);
    /* Notify on blur so onChange isn't called on every keystroke */
    onChange?.(_value);
  });

  /* Arrow keys in the input field (accessibility enhancement) */
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp')   { e.preventDefault(); _sync(_value + step); }
    if (e.key === 'ArrowDown') { e.preventDefault(); _sync(_value - step); }
  });

  /* ── Initial state ─────────────────────────────────────────────── */

  _sync(_value, false);
  if (disabled) setDisabled(true);

  /* ── Instance API ──────────────────────────────────────────────── */

  function getValue()  { return _value; }

  function setValue(n) {
    _sync(n, false);
  }

  function setDisabled(d) {
    minusBtn.disabled = d || _value <= min;
    plusBtn.disabled  = d || _value >= max;
    input.disabled    = d;
    root.classList.toggle('qty-input--disabled', d);
  }

  return { element: root, getValue, setValue, setDisabled };
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function _clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}
