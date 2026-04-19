// backend/routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  getCustomerOrders,
  getCustomerPayments,
  updateLoyaltyPoints,
  getCustomerStats
} = require('../controllers/customerController');

// Protect all routes
router.use(protect);

// Stats route (must be before /:id route)
router.get('/stats', authorize('Owner', 'Clerk'), getCustomerStats);

// CRUD routes
router.route('/')
  .get(getAllCustomers)
  .post(authorize('Owner', 'Clerk', 'Sales Representative'), createCustomer);

router.get('/:id', getCustomer);

// Update customer - Owner/Clerk/SalesRep can update any, customers can update their own
router.put('/:id', updateCustomer);

// Customer-specific routes
router.get('/:id/orders', getCustomerOrders);
router.get('/:id/payments', getCustomerPayments);
router.put('/:id/loyalty', authorize('Owner', 'Clerk'), updateLoyaltyPoints);

module.exports = router;