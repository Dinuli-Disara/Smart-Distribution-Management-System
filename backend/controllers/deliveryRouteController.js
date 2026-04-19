// backend/controllers/deliveryRouteController.js
const deliveryRouteService = require('../services/deliveryRouteService');

// @desc    Get all delivery routes
// @route   GET /api/delivery-routes
// @access  Private (All authenticated users)
exports.getAllRoutes = async (req, res) => {
  console.log('=== getAllRoutes called ===');
  console.log('User:', req.user ? req.user.id : 'No user');
  
  try {
    const routes = await deliveryRouteService.getAllRoutes();
    console.log('Routes found:', routes.length);
    console.log('First route:', routes[0] ? routes[0].route_name : 'No routes');
    
    res.status(200).json({
      success: true,
      data: routes
    });
  } catch (error) {
    console.error('Get all routes error details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes: ' + error.message
    });
  }
};

// @desc    Get available routes (unassigned)
// @route   GET /api/delivery-routes/available
// @access  Private (Owner and Clerk only)
exports.getAvailableRoutes = async (req, res) => {
  console.log('=== getAvailableRoutes called ===');
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