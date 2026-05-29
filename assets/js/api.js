'use strict';

/* ================================================================
   DG.api — HTTP client for the DG Studio backend API
   Replaces localStorage cart and static DG.products data.

   Usage (drop-in alongside existing scripts):
     <script src="assets/js/api.js"></script>

   All methods return Promises. The existing DG.cart methods remain
   in cart.js for backwards-compat; this module is the server bridge.
   ================================================================ */

window.DG = window.DG || {};

DG.api = (() => {
  const BASE = (window.DG_API_URL || 'http://localhost:3000') + '/api/v1';

  /* ── Core fetch wrapper ─────────────────────────────────────── */

  async function request(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res  = await fetch(BASE + path, opts);
    const json = await res.json().catch(() => ({ success: false, error: 'Invalid response' }));

    if (!json.success) {
      const err = new Error(json.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return json.data;
  }

  const get    = (path)        => request('GET',    path);
  const post   = (path, body)  => request('POST',   path, body);
  const patch  = (path, body)  => request('PATCH',  path, body);
  const del    = (path)        => request('DELETE',  path);

  /* ── Cart ID persistence ────────────────────────────────────── */

  const CART_KEY = 'dg-cart-id';

  function getCartId()         { return localStorage.getItem(CART_KEY); }
  function setCartId(id)       { localStorage.setItem(CART_KEY, id); }
  function clearCartId()       { localStorage.removeItem(CART_KEY); }

  /* ── Products ───────────────────────────────────────────────── */

  /* Maps API cents to dollars and normalises fields
     so the existing DG.ui.renderProductCard() keeps working */
  function normaliseProduct(p) {
    if (!p) return null;
    return {
      ...p,
      price:      (p.price_cents    || 0) / 100,
      salePrice:  p.sale_price_cents ? p.sale_price_cents / 100 : null,
      isSale:     !!p.sale_price_cents,
      isNew:      p.is_new,
      isBestseller: p.is_bestseller,
      reviewCount: p.review_count,
      /* Build images array from cover_image (list) or images (detail) */
      images: p.images?.map(i => i.url || i) || (p.cover_image ? [p.cover_image] : []),
      /* Build colors from variants or pre-joined colors array */
      colors: p.colors || (p.variants
        ? [...new Map(p.variants.map(v => [v.colorName, { name: v.colorName, hex: v.colorHex }])).values()]
        : []),
      sizes:  p.sizes || (p.variants
        ? [...new Set(p.variants.map(v => v.size))]
        : []),
    };
  }

  async function getProducts(params = {}) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    const data = await get(`/products${qs ? '?' + qs : ''}`);
    return {
      products:   (data.products || data).map(normaliseProduct),
      pagination: data.pagination || null,
    };
  }

  async function getProduct(slug) {
    const data = await get(`/products/${slug}`);
    return normaliseProduct(data);
  }

  async function getRelated(slug) {
    const data = await get(`/products/${slug}/related`);
    return data.map(normaliseProduct);
  }

  async function searchProducts(q) {
    const data = await get(`/products?q=${encodeURIComponent(q)}`);
    return (data.products || data).map(normaliseProduct);
  }

  /* ── Cart ───────────────────────────────────────────────────── */

  /* Normalise a server cart to the shape DG.cart.getItems() returns */
  function normaliseCart(cart) {
    if (!cart) return { items: [], subtotal: 0, shipping: 0, total: 0, count: 0 };
    const items = (cart.items || []).map(i => ({
      id:        i.id,
      productId: i.product_id,
      variantId: i.variant_id,
      size:      i.size,
      color:     i.color_name,
      name:      i.name,
      image:     i.image,
      price:     (i.price_cents || 0) / 100,
      quantity:  i.quantity,
    }));
    return {
      id:       cart.id,
      items,
      count:    items.reduce((s, i) => s + i.quantity, 0),
      subtotal: (cart.subtotal_cents || 0) / 100,
      shipping: (cart.shipping_cents || 0) / 100,
      total:    (cart.total_cents    || 0) / 100,
    };
  }

  async function ensureCart() {
    let id = getCartId();
    if (!id) {
      const data = await post('/cart');
      id = data.id;
      setCartId(id);
    }
    return id;
  }

  async function getCart() {
    const id = getCartId();
    if (!id) return normaliseCart(null);
    try {
      const cart = await get(`/cart/${id}`);
      _emitCartUpdate(normaliseCart(cart));
      return normaliseCart(cart);
    } catch (err) {
      if (err.status === 404) { clearCartId(); return normaliseCart(null); }
      throw err;
    }
  }

  async function addToCart(variantId, quantity = 1) {
    const id   = await ensureCart();
    const cart = await post(`/cart/${id}/items`, { variantId, quantity });
    _emitCartUpdate(normaliseCart(cart));
    return normaliseCart(cart);
  }

  async function updateCartItem(itemId, quantity) {
    const id   = getCartId();
    if (!id) return normaliseCart(null);
    const cart = await patch(`/cart/${id}/items/${itemId}`, { quantity });
    _emitCartUpdate(normaliseCart(cart));
    return normaliseCart(cart);
  }

  async function removeFromCart(itemId) {
    const id   = getCartId();
    if (!id) return normaliseCart(null);
    const cart = await del(`/cart/${id}/items/${itemId}`);
    _emitCartUpdate(normaliseCart(cart));
    return normaliseCart(cart);
  }

  function _emitCartUpdate(cart) {
    window.dispatchEvent(new CustomEvent('dg:cart:updated', { detail: cart }));
  }

  /* ── Promo ──────────────────────────────────────────────────── */

  async function validatePromo(code, subtotal) {
    return post('/promo/validate', { code, subtotal });
  }

  /* ── Orders ─────────────────────────────────────────────────── */

  async function placeOrder({ email, address, shippingMethod, promoCode }) {
    const cartId = getCartId();
    if (!cartId) throw new Error('No active cart');

    const order = await post('/orders', { cartId, email, address, shippingMethod, promoCode });
    clearCartId();                         // cart is server-cleared; remove local ref
    _emitCartUpdate(normaliseCart(null));  // reset badge
    return order;
  }

  async function getOrder(orderId) {
    return get(`/orders/${orderId}`);
  }

  /* ── Patch existing DG.cart to use API ──────────────────────── */
  /* Call DG.api.patchCart() once after scripts load to wire the API
     into the existing cart.js event bus without rewriting pages. */

  function patchCart() {
    const original = window.DG.cart;

    window.DG.cart = {
      ...original,

      getCount() {
        const id = getCartId();
        if (!id) return 0;
        /* Synchronous read from last known state stored on the object */
        return window.DG.cart._cachedCount || 0;
      },

      addItem(productId, size, color, quantity = 1) {
        /* productId + size + color → need to find the variantId from API product data */
        /* This is a bridge: fetch the product's variants then add by variantId */
        return getProduct(String(productId))
          .then(product => {
            if (!product?.variants) throw new Error('Product variants unavailable');
            const variant = product.variants.find(
              v => v.size === size && v.colorName === color
            );
            if (!variant) throw new Error(`Variant not found: ${size}/${color}`);
            return addToCart(variant.id, quantity);
          })
          .then(cart => {
            window.DG.cart._cachedCount = cart.count;
            return cart;
          });
      },

      removeItem(itemId)            { return removeFromCart(itemId); },
      updateQuantity(itemId, qty)   { return updateCartItem(itemId, qty); },
      getSubtotal()                 { return window.DG.cart._cachedSubtotal || 0; },
      getShipping()                 { return window.DG.cart._cachedShipping || 0; },
      getTotal()                    { return window.DG.cart._cachedTotal    || 0; },
      isEmpty()                     { return (window.DG.cart._cachedCount || 0) === 0; },
      applyPromo(code)              { return validatePromo(code, this.getSubtotal()); },

      _cachedCount:    0,
      _cachedSubtotal: 0,
      _cachedShipping: 0,
      _cachedTotal:    0,
    };

    /* Sync cache from server on load and after every update */
    window.addEventListener('dg:cart:updated', (e) => {
      const cart = e.detail;
      window.DG.cart._cachedCount    = cart.count;
      window.DG.cart._cachedSubtotal = cart.subtotal;
      window.DG.cart._cachedShipping = cart.shipping;
      window.DG.cart._cachedTotal    = cart.total;
    });

    getCart(); // initial sync
  }

  return {
    /* Products */
    getProducts, getProduct, getRelated, searchProducts,
    /* Cart */
    getCart, addToCart, updateCartItem, removeFromCart,
    /* Promo */
    validatePromo,
    /* Orders */
    placeOrder, getOrder,
    /* Wiring */
    patchCart,
    /* Internals */
    getCartId, setCartId, clearCartId,
  };
})();
