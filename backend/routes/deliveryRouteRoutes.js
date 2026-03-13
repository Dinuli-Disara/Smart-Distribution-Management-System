const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAvailableRoutes,
  getAllRoutes
} = require('../controllers/deliveryRouteController');

// Protect all routes - protect is a middleware function
router.use(protect);

// Routes - only accessible by Owner
router.get('/available', authorize('Owner'), getAvailableRoutes);
router.get('/', authorize('Owner'), getAllRoutes);

module.exports = router;