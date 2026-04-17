// backend/routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// DEBUG: Check what we're getting from auth middleware
console.log('=== EMPLOYEE ROUTES DEBUG ===');
console.log('protect:', protect);
console.log('typeof protect:', typeof protect);
console.log('authorize:', authorize);
console.log('typeof authorize:', typeof authorize);
console.log('============================');

const {
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  activateEmployee,
  getEmployeeStats
} = require('../controllers/employeeController');

// Protect all routes
router.use(protect);  // This is line 16

// Stats route (must be before /:id route)
router.get('/stats', authorize('Owner'), getEmployeeStats);

// CRUD routes
router.route('/')
  .get(authorize('Owner'), getAllEmployees)
  .post(authorize('Owner'), createEmployee);

router.route('/:id')
  .get(getEmployee)
  .put(updateEmployee);

// Activate/Deactivate
router.put('/:id/deactivate', authorize('Owner'), deactivateEmployee);
router.put('/:id/activate', authorize('Owner'), activateEmployee);

module.exports = router;