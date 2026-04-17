// backend/routes/stockReceiveApprovalRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createReceiveRequest,
  getPendingReceiveRequests,
  getAllReceiveRequests,
  getReceiveRequest,
  approveReceiveRequest,
  rejectReceiveRequest
} = require('../controllers/stockReceiveApprovalController');

// Protect all routes
router.use(protect);

// Routes for creating requests (Clerk and Owner)
router.post('/request', authorize('Owner', 'Clerk'), createReceiveRequest);

// Routes for viewing requests
router.get('/pending', authorize('Owner'), getPendingReceiveRequests);
router.get('/', authorize('Owner'), getAllReceiveRequests);
router.get('/:id', getReceiveRequest);

// Routes for approving/rejecting (Owner only)
router.put('/:id/approve', authorize('Owner'), approveReceiveRequest);
router.put('/:id/reject', authorize('Owner'), rejectReceiveRequest);

module.exports = router;