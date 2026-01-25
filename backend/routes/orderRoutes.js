// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  generateInvoice
} = require('../controllers/orderController');

// Protect all routes
router.use(protect);

// CRUD routes
router.route('/')
  .get(getAllOrders)
  .post(authorize('Owner', 'Clerk', 'Sales Representative'), createOrder);

router.get('/:id', getOrder);
router.put('/:id/status', updateOrderStatus);
router.post('/:id/invoice', generateInvoice);

module.exports = router;