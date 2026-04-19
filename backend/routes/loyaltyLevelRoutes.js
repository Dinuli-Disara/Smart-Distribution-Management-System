// backend/routes/loyaltyLevelRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getLoyaltyLevels,
    getLoyaltyLevelById,
    getCustomerLoyaltyStats,
    getLoyaltyTransactions,
    redeemPoints
} = require('../controllers/loyaltyLevelController');

// Protect all routes
router.use(protect);

// Routes
router.get('/', getLoyaltyLevels);
router.get('/:id', getLoyaltyLevelById);
router.get('/customer/:customerId/stats', getCustomerLoyaltyStats);
router.get('/customer/:customerId/transactions', getLoyaltyTransactions);
router.post('/customer/:customerId/redeem', redeemPoints);

module.exports = router;