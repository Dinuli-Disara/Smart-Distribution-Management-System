//backend/controllers/deliveryRouteController.js
const deliveryRouteService = require('../services/deliveryRouteService');

// @desc    Get all delivery routes
// @route   GET /api/delivery-routes
// @access  Private (Owner only)
exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await deliveryRouteService.getAllRoutes();
    
    res.status(200).json({
      success: true,
      data: routes
    });
  } catch (error) {
    console.error('Get all routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes'
    });
  }
};

// @desc    Get available routes (unassigned)
// @route   GET /api/delivery-routes/available
// @access  Private (Owner only)
exports.getAvailableRoutes = async (req, res) => {
  try {
    const routes = await deliveryRouteService.getAvailableRoutes();
    
    res.status(200).json({
      success: true,
      data: routes
    });
  } catch (error) {
    console.error('Get available routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available routes'
    });
  }
};