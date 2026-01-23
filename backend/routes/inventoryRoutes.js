// backend/routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getInventoryByLocation,
  getStoreInventory,
  getVanInventory,
  getInventorySummary,
  receiveStock
} = require('../controllers/inventoryController');

// Protect all routes
router.use(protect);

// Summary route (for dashboard)
router.get('/summary', getInventorySummary);

// Store and van inventory
router.get('/store', getStoreInventory);
router.get('/vans', getVanInventory);
router.get('/location/:locationId', getInventoryByLocation);

// Receive stock (Clerk and Owner only)
router.post('/receive', authorize('Owner', 'Clerk'), receiveStock);

module.exports = router;