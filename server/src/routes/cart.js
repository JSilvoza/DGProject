'use strict';

const router      = require('express').Router();
const cartService = require('../services/cartService');
const v           = require('../middleware/validate');

/* POST /api/v1/cart — create a new cart */
router.post('/', async (req, res, next) => {
  try {
    const cartId = await cartService.createCart();
    res.status(201).json({ success: true, data: { id: cartId } });
  } catch (err) { next(err); }
});

/* GET /api/v1/cart/:id */
router.get('/:id', async (req, res, next) => {
  try {
    v.assertUUID(req.params.id, 'cart id');
    const cart = await cartService.getCart(req.params.id);
    if (!cart) return res.status(404).json({ success: false, error: 'Cart not found' });
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
});

/* POST /api/v1/cart/:id/items — add item
   Body: { variantId: number, quantity?: number } */
router.post('/:id/items', async (req, res, next) => {
  try {
    v.assertUUID(req.params.id, 'cart id');
    v.require(['variantId'], req.body);

    const quantity = Math.max(1, Math.min(10, parseInt(req.body.quantity, 10) || 1));
    const cart = await cartService.addItem(req.params.id, {
      variantId: parseInt(req.body.variantId, 10),
      quantity,
    });
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
});

/* PATCH /api/v1/cart/:id/items/:itemId — update quantity
   Body: { quantity: number } */
router.patch('/:id/items/:itemId', async (req, res, next) => {
  try {
    v.assertUUID(req.params.id,     'cart id');
    v.assertUUID(req.params.itemId, 'item id');
    v.require(['quantity'], req.body);

    const quantity = parseInt(req.body.quantity, 10);
    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ success: false, error: 'quantity must be a non-negative integer' });
    }

    const cart = await cartService.updateItem(req.params.id, req.params.itemId, quantity);
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
});

/* DELETE /api/v1/cart/:id/items/:itemId — remove item */
router.delete('/:id/items/:itemId', async (req, res, next) => {
  try {
    v.assertUUID(req.params.id,     'cart id');
    v.assertUUID(req.params.itemId, 'item id');
    const cart = await cartService.removeItem(req.params.id, req.params.itemId);
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
});

module.exports = router;
