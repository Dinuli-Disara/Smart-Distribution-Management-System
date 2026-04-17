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

// Protect all routes
router.use(protect);
router.use(authorize('Owner')); // Only Owner can access area management

// Routes
router.get('/unassigned', getAvailableAreas);
router.get('/', getAllAreas);
router.get('/:id', getAreaById);
router.post('/', createArea);
router.put('/:id', updateArea);
router.delete('/:id', deleteArea);

module.exports = router;