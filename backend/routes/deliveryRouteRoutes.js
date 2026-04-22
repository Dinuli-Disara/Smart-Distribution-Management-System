// backend/routes/deliveryRouteRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAvailableRoutes,
  getAllRoutes
} = require('../controllers/deliveryRouteController');

// Protect all routes - protect is a middleware function
router.use(protect);
router.get('/available',authorize('Owner', 'Clerk'), getAvailableRoutes);
router.get('/', getAllRoutes);

module.exports = router;