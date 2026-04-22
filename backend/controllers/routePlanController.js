const routePlanService = require('../services/routePlanService');
const DeliveryArea = require('../models/DeliveryArea');
const DeliveryRoute = require('../models/DeliveryRoute');
const Van = require('../models/van');

// @desc    Debug endpoint to check data
// @route   GET /api/route-plans/debug
// @access  Private (Clerk, Owner)
exports.debug = async (req, res) => {
  try {
    const areas = await DeliveryArea.findAll({ where: { is_active: true } });
    const routes = await DeliveryRoute.findAll({ where: { is_active: true } });
    const vans = await Van.findAll({ where: { is_active: true } });
    
    res.json({
      success: true,
      data: {
        areas_count: areas.length,
        routes_count: routes.length,
        vans_count: vans.length,
        areas: areas.map(a => ({ id: a.area_id, name: a.area_name })),
        routes: routes.map(r => ({ id: r.route_id, name: r.route_name, area_id: r.area_id })),
        vans: vans.map(v => ({ id: v.van_id, number: v.vehicle_number }))
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a new route plan request (clerk selects all routes for a date)
// @route   POST /api/route-plans
// @access  Private (Clerk only)
exports.createRoutePlan = async (req, res) => {
  try {
    const { planned_date, assignments, notes } = req.body;
    
    // Validate required fields
    if (!planned_date || !assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Planned date and assignments are required'
      });
    }
    
    // Validate we have exactly 3 assignments (one for each area)
    if (assignments.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Please select routes for all 3 areas'
      });
    }
    
    // Validate each assignment has required fields
    for (const assignment of assignments) {
      if (!assignment.area_id || !assignment.route_id || !assignment.van_id) {
        return res.status(400).json({
          success: false,
          message: 'Each assignment must have area_id, route_id, and van_id'
        });
      }
    }
    
    const routePlan = await routePlanService.createRoutePlan(
      { planned_date, assignments, notes },
      req.user.id
    );
    
    res.status(201).json({
      success: true,
      message: 'Route plan request submitted for approval',
      data: routePlan
    });
  } catch (error) {
    console.error('Create route plan error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all pending route plans (for owner)
// @route   GET /api/route-plans/pending
// @access  Private (Owner only)
exports.getPendingApprovals = async (req, res) => {
  try {
    const pendingPlans = await routePlanService.getPendingApprovals();
    
    res.status(200).json({
      success: true,
      data: pendingPlans
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals'
    });
  }
};

// @desc    Approve a route plan
// @route   PUT /api/route-plans/:id/approve
// @access  Private (Owner only)
exports.approveRoutePlan = async (req, res) => {
  try {
    const { comments } = req.body;
    const routePlan = await routePlanService.approveRoutePlan(
      req.params.id,
      req.user.id,
      comments
    );
    
    res.status(200).json({
      success: true,
      message: 'Route plan approved successfully',
      data: routePlan
    });
  } catch (error) {
    console.error('Approve route plan error:', error);
    res.status(error.message === 'Route plan not found' ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject a route plan
// @route   PUT /api/route-plans/:id/reject
// @access  Private (Owner only)
exports.rejectRoutePlan = async (req, res) => {
  try {
    const { reason, comments } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const routePlan = await routePlanService.rejectRoutePlan(
      req.params.id,
      req.user.id,
      reason,
      comments
    );
    
    res.status(200).json({
      success: true,
      message: 'Route plan rejected',
      data: routePlan
    });
  } catch (error) {
    console.error('Reject route plan error:', error);
    res.status(error.message === 'Route plan not found' ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get approved route plans for a specific date
// @route   GET /api/route-plans/approved/:date
// @access  Private (Owner, Clerk)
exports.getApprovedPlansByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const plan = await routePlanService.getApprovedPlansByDate(date);
    
    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Get approved plans by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approved plans'
    });
  }
};

// @desc    Get approved plans for a date range
// @route   GET /api/route-plans/approved/range/:startDate/:endDate
// @access  Private (Owner, Clerk)
exports.getApprovedPlansByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const plans = await routePlanService.getApprovedPlansByDateRange(startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get approved plans by range error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approved plans'
    });
  }
};

// @desc    Get all route plans (with filtering by role)
// @route   GET /api/route-plans
// @access  Private (Owner, Clerk)
exports.getAllRoutePlans = async (req, res) => {
  try {
    const plans = await routePlanService.getAllRoutePlans(req.user.id, req.user.role);
    
    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get all route plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route plans'
    });
  }
};

// @desc    Get areas with routes and vans for selection
// @route   GET /api/route-plans/setup-data
// @access  Private (Clerk only)
exports.getSetupData = async (req, res) => {
  try {
    const data = await routePlanService.getAreasWithRoutesAndVans();
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get setup data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setup data: ' + error.message
    });
  }
};

// @desc    Check if a date is available for planning
// @route   GET /api/route-plans/check-date/:date
// @access  Private (Clerk only)
exports.checkDateAvailability = async (req, res) => {
  try {
    const { date } = req.params;
    console.log('Checking availability for date:', date);
    
    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD'
      });
    }
    
    const availability = await routePlanService.checkDateAvailability(date);
    
    console.log('Availability result:', availability);
    
    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Check date availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check date availability: ' + error.message
    });
  }
};