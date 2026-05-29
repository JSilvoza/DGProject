'use strict';

const router = require('express').Router();

router.use('/products', require('./products'));
router.use('/cart',     require('./cart'));
router.use('/orders',   require('./orders'));
router.use('/promo',    require('./promo'));

module.exports = router;
