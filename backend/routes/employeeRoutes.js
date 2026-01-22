// backend/routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
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
router.use(protect);

// Stats route (must be before /:id route)
router.get('/stats', authorize('Owner'), getEmployeeStats);

// CRUD routes
router.route('/')
  .get(authorize('Owner'), getAllEmployees)
  .post(authorize('Owner'), createEmployee);

router.route('/:id')
  .get(getEmployee)
  .put(authorize('Owner'), updateEmployee);

// Activate/Deactivate
router.put('/:id/deactivate', authorize('Owner'), deactivateEmployee);
router.put('/:id/activate', authorize('Owner'), activateEmployee);

module.exports = router;