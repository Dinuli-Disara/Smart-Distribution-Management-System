const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const routePlanController = require('../controllers/routePlanController');

// Protect all routes
router.use(protect);

// Debug route (add this temporarily)
router.get('/debug', authorize('Clerk', 'Owner'), routePlanController.debug);

// Routes accessible by Clerk
router.post('/', authorize('Clerk'), routePlanController.createRoutePlan);
router.get('/my-plans', authorize('Clerk'), routePlanController.getAllRoutePlans);
router.get('/setup-data', authorize('Clerk'), routePlanController.getSetupData);
router.get('/check-date/:date', authorize('Clerk'), routePlanController.checkDateAvailability);
router.get('/approved/:date', authorize('Clerk', 'Owner'), routePlanController.getApprovedPlansByDate);
router.get('/approved/range/:startDate/:endDate', authorize('Clerk', 'Owner'), routePlanController.getApprovedPlansByDateRange);

// Routes accessible only by Owner
router.get('/pending', authorize('Owner'), routePlanController.getPendingApprovals);
router.put('/:id/approve', authorize('Owner'), routePlanController.approveRoutePlan);
router.put('/:id/reject', authorize('Owner'), routePlanController.rejectRoutePlan);

// General routes (accessible by both with proper authorization)
router.get('/', authorize('Clerk', 'Owner'), routePlanController.getAllRoutePlans);

module.exports = router;