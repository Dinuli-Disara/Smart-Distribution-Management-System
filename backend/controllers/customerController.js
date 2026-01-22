// backend/controllers/customerController.js
const customerService = require('../services/customerService');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getAllCustomers = async (req, res) => {
  try {
    const { route_id, loyalty_level_id, search } = req.query;
    
    const filters = {};
    if (route_id) filters.route_id = route_id;
    if (loyalty_level_id) filters.loyalty_level_id = loyalty_level_id;
    if (search) filters.search = search;

    const customers = await customerService.getAllCustomers(filters);

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomer = async (req, res) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(error.message === 'Customer not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private (Sales Rep, Clerk, Owner)
exports.createCustomer = async (req, res) => {
  try {
    const { name, contact, email, address, route_id } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }

    const customer = await customerService.createCustomer(req.body);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(error.message === 'Customer not found' ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get customer order history
// @route   GET /api/customers/:id/orders
// @access  Private
exports.getCustomerOrders = async (req, res) => {
  try {
    const orders = await customerService.getCustomerOrders(req.params.id);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer orders'
    });
  }
};

// @desc    Get customer payment history
// @route   GET /api/customers/:id/payments
// @access  Private
exports.getCustomerPayments = async (req, res) => {
  try {
    const payments = await customerService.getCustomerPayments(req.params.id);

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Get customer payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer payments'
    });
  }
};

// @desc    Update customer loyalty points
// @route   PUT /api/customers/:id/loyalty
// @access  Private
exports.updateLoyaltyPoints = async (req, res) => {
  try {
    const { points } = req.body;

    if (!points || isNaN(points)) {
      return res.status(400).json({
        success: false,
        message: 'Valid points value is required'
      });
    }

    const customer = await customerService.updateLoyaltyPoints(req.params.id, parseInt(points));

    res.status(200).json({
      success: true,
      message: 'Loyalty points updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update loyalty points error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get customer statistics
// @route   GET /api/customers/stats
// @access  Private (Owner)
exports.getCustomerStats = async (req, res) => {
  try {
    const stats = await customerService.getCustomerStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer statistics'
    });
  }
};