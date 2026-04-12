// backend/routes/productApprovalRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createApprovalRequest,
  getPendingRequests,
  getAllRequests,
  approveRequest,
  rejectRequest,
  getRequest
} = require('../controllers/productApprovalController');

// Protect all routes
router.use(protect);

// Routes for creating requests (Clerk and Owner)
router.post('/request', authorize('Owner', 'Clerk'), createApprovalRequest);

// Routes for viewing requests
router.get('/pending', authorize('Owner'), getPendingRequests);
router.get('/', authorize('Owner'), getAllRequests);
router.get('/:id', getRequest); // Special - checks ownership

// Routes for approving/rejecting (Owner only)
router.put('/:id/approve', authorize('Owner'), approveRequest);
router.put('/:id/reject', authorize('Owner'), rejectRequest);

module.exports = router;