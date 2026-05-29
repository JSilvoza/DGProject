'use strict';

const router         = require('express').Router();
const productService = require('../services/productService');
const { intParam }   = require('../middleware/validate');

/* GET /api/v1/products
   Query: category, filter, sort, minPrice, maxPrice, page, limit, q */
router.get('/', async (req, res, next) => {
  try {
    const { category, filter, sort, minPrice, maxPrice, q } = req.query;
    const page  = intParam(req.query.page,  1,  1, 1000);
    const limit = intParam(req.query.limit, 20, 1, 100);

    if (q) {
      const results = await productService.search(q);
      return res.json({ success: true, data: results });
    }

    const data = await productService.getProducts({
      category, filter, sort,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page, limit,
    });

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

/* GET /api/v1/products/:slug */
router.get('/:slug', async (req, res, next) => {
  try {
    const product = await productService.getProduct(req.params.slug);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

/* GET /api/v1/products/:slug/related */
router.get('/:slug/related', async (req, res, next) => {
  try {
    const product = await productService.getProduct(req.params.slug);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const related = await productService.getRelated(product.id);
    res.json({ success: true, data: related });
  } catch (err) { next(err); }
});

module.exports = router;
