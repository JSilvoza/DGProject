'use strict';

const router       = require('express').Router();
const orderService = require('../services/orderService');
const v            = require('../middleware/validate');

/* POST /api/v1/orders — place order
   Body: {
     cartId, email,
     address: { firstName, lastName, address1, address2?, city, state, zip, country? },
     shippingMethod?: 'standard' | 'express' | 'overnight',
     promoCode?: string
   } */
router.post('/', async (req, res, next) => {
  try {
    const { cartId, email, address, shippingMethod, promoCode } = req.body;

    v.assertUUID(cartId, 'cartId');
    if (!v.isEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }
    v.require(['firstName', 'lastName', 'address1', 'city', 'state', 'zip'], address || {});

    const order = await orderService.createOrder(cartId, {
      email, address, shippingMethod, promoCode,
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
});

/* GET /api/v1/orders/:id — retrieve order (for confirmation page) */
router.get('/:id', async (req, res, next) => {
  try {
    v.assertUUID(req.params.id, 'order id');
    const order = await orderService.getOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

module.exports = router;
