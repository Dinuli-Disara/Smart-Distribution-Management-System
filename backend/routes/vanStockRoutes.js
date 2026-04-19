// backend/routes/vanStockRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getVanStock, updateVanStock } = require('../controllers/vanStockController');

// Protect all routes
router.use(protect);

// Get van stock for logged-in sales rep
router.get('/', authorize('Sales Representative', 'Owner', 'Clerk'), getVanStock);

// Update van stock after sale
router.put('/:productId', authorize('Sales Representative'), updateVanStock);

module.exports = router;