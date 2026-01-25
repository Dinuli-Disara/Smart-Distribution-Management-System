// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  recordCustomerPayment,
  getCustomerPayments,
  recordManufacturerPayment,
  getPendingCheques,
  updateChequeStatus,
  getPaymentAging
} = require('../controllers/paymentController');

// Protect all routes
router.use(protect);

// Customer payments
router.post('/customer', authorize('Owner', 'Clerk'), recordCustomerPayment);
router.get('/customer/:customerId', getCustomerPayments);

// Manufacturer payments
router.post('/manufacturer', authorize('Owner', 'Clerk'), recordManufacturerPayment);

// Cheque management
router.get('/cheques/pending', getPendingCheques);
router.put('/cheques/:id/status', authorize('Owner', 'Clerk'), updateChequeStatus);

// Payment aging report
router.get('/aging', getPaymentAging);

module.exports = router;