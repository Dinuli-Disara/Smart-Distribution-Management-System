// backend/routes/stockTransferRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllTransfers,
  getTransfer,
  createTransfer,
  getAvailableStockForTransfer
} = require('../controllers/stockTransferController');

// Protect all routes
router.use(protect);

// Get available stock for transfer
router.get('/available-stock', getAvailableStockForTransfer);

// CRUD routes
router.route('/')
  .get(getAllTransfers)
  .post(authorize('Owner', 'Clerk'), createTransfer);

router.get('/:id', getTransfer);

module.exports = router;