// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllProducts,
  getProduct,
  getLowStockProducts,
  getExpiringProducts,
  getExpiredProducts,
  createProduct,
  updateProduct
} = require('../controllers/productController');

// Protect all routes
router.use(protect);

// Special routes (must be before /:id)
router.get('/low-stock', getLowStockProducts);
router.get('/expiring', getExpiringProducts);
router.get('/expired', getExpiredProducts);

// CRUD routes
router.route('/')
  .get(getAllProducts)
  .post(authorize('Owner'), createProduct);

router.route('/:id')
  .get(getProduct)
  .put(authorize('Owner'), updateProduct);

module.exports = router;