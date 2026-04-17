// backend/routes/stockTransferRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllTransfers,
  getTransfer,
  createTransfer,
  getAvailableStock,
  getPendingTransfers,
  approveTransfer,
  rejectTransfer
} = require('../controllers/stockTransferController');

// Protect all routes
router.use(protect);

// Get available stock for transfer (must be before /:id)
router.get('/available-stock', getAvailableStock);

// Get pending transfers (Owner only)
router.get('/pending', authorize('Owner'), getPendingTransfers);

// CRUD routes
router.route('/')
  .get(getAllTransfers)
  .post(authorize('Owner', 'Clerk'), createTransfer);

// Approve/Reject transfers (Owner only)
router.put('/:id/approve', authorize('Owner'), approveTransfer);
router.put('/:id/reject', authorize('Owner'), rejectTransfer);

// Get single transfer (must be after other specific routes)
router.get('/:id', getTransfer);

module.exports = router;