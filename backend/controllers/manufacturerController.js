const { sequelize } = require('../config/database');

// @desc    Get all manufacturers
// @route   GET /api/manufacturers
// @access  Private
exports.getManufacturers = async (req, res) => {
  try {
    const [manufacturers] = await sequelize.query(`
      SELECT manufacturer_id, name, contact_person, phone, email, address
      FROM Manufacturer
      WHERE is_active = true OR is_active IS NULL
      ORDER BY name
    `);

    res.status(200).json({
      success: true,
      data: manufacturers
    });
  } catch (error) {
    console.error('Get manufacturers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch manufacturers'
    });
  }
};

// @desc    Get single manufacturer
// @route   GET /api/manufacturers/:id
// @access  Private
exports.getManufacturer = async (req, res) => {
  try {
    const [manufacturer] = await sequelize.query(`
      SELECT manufacturer_id, name, contact_person, phone, email, address
      FROM Manufacturer
      WHERE manufacturer_id = ?
    `, {
      replacements: [req.params.id]
    });

    if (manufacturer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Manufacturer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: manufacturer[0]
    });
  } catch (error) {
    console.error('Get manufacturer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch manufacturer'
    });
  }
};