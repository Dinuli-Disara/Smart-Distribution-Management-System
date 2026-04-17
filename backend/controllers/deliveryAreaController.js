const deliveryAreaService = require('../services/deliveryAreaService');

// @desc    Get all delivery areas
// @route   GET /api/delivery-areas
// @access  Private (Owner only)
exports.getAllAreas = async (req, res) => {
  try {
    const areas = await deliveryAreaService.getAllAreas();
    
    res.status(200).json({
      success: true,
      data: areas
    });
  } catch (error) {
    console.error('Get all areas error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch areas'
    });
  }
};

// @desc    Get available areas (unassigned)
// @route   GET /api/delivery-areas/unassigned
// @access  Private (Owner only)
exports.getAvailableAreas = async (req, res) => {
  try {
    const areas = await deliveryAreaService.getAvailableAreas();
    
    res.status(200).json({
      success: true,
      data: areas
    });
  } catch (error) {
    console.error('Get available areas error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available areas'
    });
  }
};

// @desc    Get single area
// @route   GET /api/delivery-areas/:id
// @access  Private (Owner only)
exports.getAreaById = async (req, res) => {
  try {
    const area = await deliveryAreaService.getAreaById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: area
    });
  } catch (error) {
    console.error('Get area error:', error);
    res.status(error.message === 'Area not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new area
// @route   POST /api/delivery-areas
// @access  Private (Owner only)
exports.createArea = async (req, res) => {
  try {
    const { area_name, description } = req.body;
    
    if (!area_name) {
      return res.status(400).json({
        success: false,
        message: 'Area name is required'
      });
    }
    
    const area = await deliveryAreaService.createArea(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Area created successfully',
      data: area
    });
  } catch (error) {
    console.error('Create area error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update area
// @route   PUT /api/delivery-areas/:id
// @access  Private (Owner only)
exports.updateArea = async (req, res) => {
  try {
    const area = await deliveryAreaService.updateArea(req.params.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Area updated successfully',
      data: area
    });
  } catch (error) {
    console.error('Update area error:', error);
    res.status(error.message === 'Area not found' ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete area (soft delete)
// @route   DELETE /api/delivery-areas/:id
// @access  Private (Owner only)
exports.deleteArea = async (req, res) => {
  try {
    await deliveryAreaService.deleteArea(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Area deleted successfully'
    });
  } catch (error) {
    console.error('Delete area error:', error);
    res.status(error.message === 'Area not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};