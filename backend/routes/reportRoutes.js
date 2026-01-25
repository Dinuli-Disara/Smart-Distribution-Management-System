// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSalesReport,
  getProductSalesReport,
  getRouteSalesReport,
  getEmployeePerformanceReport,
  getInventoryValuationReport,
  getDashboardStats
} = require('../controllers/reportController');

// Protect all routes
router.use(protect);

// Dashboard stats
router.get('/dashboard', getDashboardStats);

// Sales reports
router.get('/sales', getSalesReport);
router.get('/product-sales', getProductSalesReport);
router.get('/route-sales', getRouteSalesReport);

// Employee performance report
router.get('/employee-performance', authorize('Owner'), getEmployeePerformanceReport);

// Inventory report
router.get('/inventory-valuation', getInventoryValuationReport);

module.exports = router;