// backend/routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCustomerDashboard,
  getCustomerPreOrders,
  getCustomerLoyalty,
  getCustomerOrders,
  getCustomerPayments,
  updateCustomer
} = require('../controllers/customerController');

// Protect all routes - only authenticated customers
router.use(protect);

// Customer dashboard and data routes
router.get('/dashboard', getCustomerDashboard);
router.get('/pre-orders', getCustomerPreOrders);
router.get('/loyalty', getCustomerLoyalty);
router.get('/orders', getCustomerOrders);
router.get('/payments', getCustomerPayments);

// Customer profile update
router.put('/profile', updateCustomer);

module.exports = router;