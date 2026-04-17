const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getManufacturers,
  getManufacturer
} = require('../controllers/manufacturerController');

// Protect all routes
router.use(protect);

router.get('/', getManufacturers);
router.get('/:id', getManufacturer);

module.exports = router;