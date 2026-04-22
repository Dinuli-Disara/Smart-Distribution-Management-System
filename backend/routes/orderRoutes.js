// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createOrder,
  getAllOrders,
  getOrder
} = require('../controllers/orderController');

// Protect all routes
router.use(protect);

// Routes
router.route('/')
  .post(authorize('Sales Representative', 'Clerk', 'Owner'), createOrder)
  .get(getAllOrders);

router.get('/:id', getOrder);

module.exports = router;