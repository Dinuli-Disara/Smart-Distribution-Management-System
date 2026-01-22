// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  login,
  logout,
  getMe,
  changePassword
} = require('../controllers/authController');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.put('/change-password', protect, changePassword);

module.exports = router;