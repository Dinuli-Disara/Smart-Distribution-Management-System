// backend/routes/customerAuthRoutes.js
const express = require('express');
const router = express.Router();
const { customerLogin, getCustomerProfile } = require('../controllers/customerAuthController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/login', customerLogin);

// Protected routes
router.get('/me', protect, getCustomerProfile);

module.exports = router;