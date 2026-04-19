// backend/routes/preOrderRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getPreOrders,
    getCustomerPreOrders,
    getPreOrder,
    createPreOrder,
    updatePreOrderStatus
} = require('../controllers/preOrderController');

// Debug: Check if controllers are loaded correctly
console.log('=== PRE-ORDER CONTROLLER DEBUG ===');
console.log('getPreOrders:', typeof getPreOrders);
console.log('getCustomerPreOrders:', typeof getCustomerPreOrders);
console.log('getPreOrder:', typeof getPreOrder);
console.log('createPreOrder:', typeof createPreOrder);
console.log('updatePreOrderStatus:', typeof updatePreOrderStatus);
console.log('===================================');

// Protect all routes
router.use(protect);

// Routes
router.get('/', getPreOrders);
router.get('/customer/:customerId', getCustomerPreOrders);
router.get('/:id', getPreOrder);
router.post('/', createPreOrder);
router.put('/:id/status', updatePreOrderStatus);

module.exports = router;