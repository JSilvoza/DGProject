'use strict';

const router       = require('express').Router();
const orderService = require('../services/orderService');
const v            = require('../middleware/validate');

/* POST /api/v1/promo/validate
   Body: { code: string, subtotal: number (dollars) } */
router.post('/validate', async (req, res, next) => {
  try {
    v.require(['code', 'subtotal'], req.body);
    const subtotalCents = Math.round(Number(req.body.subtotal) * 100);
    const result = await orderService.validatePromo(req.body.code, subtotalCents);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
