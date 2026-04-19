// backend/routes/deliveryAreaRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllAreas,
  getAvailableAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea
} = require('../controllers/deliveryAreaController');

// Protect all routes (authentication required for all)
router.use(protect);

// Routes that only Owner can access
router.get('/unassigned', authorize('Owner'), getAvailableAreas);
router.get('/', authorize('Owner'), getAllAreas);
router.post('/', authorize('Owner'), createArea);
router.put('/:id', authorize('Owner'), updateArea);
router.delete('/:id', authorize('Owner'), deleteArea);

// GET /:id - Allow Owners AND Sales Representatives to view areas
// Sales reps need to view their own area
router.get('/:id', async (req, res, next) => {
  // If user is Owner, allow access
  if (req.user.role === 'Owner') {
    return getAreaById(req, res);
  }
  
  // If user is Sales Representative, check if they're trying to view their own area
  if (req.user.role === 'Sales Representative') {
    try {
      const Employee = require('../models/Employee');
      const employee = await Employee.findByPk(req.user.id);
      
      // Check if the requested area ID matches the employee's area ID
      if (employee && employee.area_id == req.params.id) {
        return getAreaById(req, res);
      } else {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own assigned area'
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking authorization'
      });
    }
  }
  
  // Any other role gets denied
  return res.status(403).json({
    success: false,
    message: 'Not authorized to view area details'
  });
});

module.exports = router;