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
    const { 
      name, 
      contact, 
      email, 
      address, 
      route_id,
      username,
      password,
      shop_name 
    } = req.body;

    console.log('Received customer data:', req.body); // Debug log

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }

    if (!contact) {
      return res.status(400).json({
        success: false,
        message: 'Contact number is required'
      });
    }

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Prepare customer data
    const customerData = {
      name,
      contact,
      email: email || null,
      address: address || null,
      route_id: route_id || 1,
      username,
      password,
      shop_name: shop_name || name
    };

    const customer = await customerService.createCustomer(customerData);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Create customer error details:', error); // Better error logging
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create customer'
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (Customer can update own profile, Owner/Clerk/SalesRep can update any)
exports.updateCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    
    // Check authorization
    const isOwnerOrStaff = ['Owner', 'Clerk', 'Sales Representative'].includes(req.user.role);
    const isOwnProfile = req.user.type === 'customer' && req.user.id == customerId;
    
    if (!isOwnerOrStaff && !isOwnProfile) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this profile'
      });
    }
    
    // Customers can only update limited fields
    let updateData = { ...req.body };
    if (req.user.type === 'customer') {
      // Customers can only update these fields
      const allowedFields = ['name', 'email', 'contact', 'address', 'shop_name'];
      updateData = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });
    }
    
    const customer = await customerService.updateCustomer(customerId, updateData);

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

// @desc    Get customer dashboard data (orders, pre-orders, payments)
// @route   GET /api/customer/dashboard
// @access  Private (Customer only)
exports.getCustomerDashboard = async (req, res) => {
  try {
    const customerId = req.user.id;

    // Get orders
    const orders = await customerService.getCustomerOrders(customerId);
    
    // Get pre-orders
    const preOrders = await customerService.getCustomerPreOrders(customerId);
    
    // Get payments
    const payments = await customerService.getCustomerPayments(customerId);
    
    // Get loyalty stats
    const loyaltyStats = await customerService.getCustomerLoyaltyStats(customerId);

    res.status(200).json({
      success: true,
      data: {
        orders: orders || [],
        pre_orders: preOrders || [],
        payments: payments || [],
        loyalty: loyaltyStats
      }
    });
  } catch (error) {
    console.error('Get customer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer dashboard data'
    });
  }
};

// @desc    Get customer pre-orders
// @route   GET /api/customer/pre-orders
// @access  Private (Customer only)
exports.getCustomerPreOrders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const preOrders = await customerService.getCustomerPreOrders(customerId);

    res.status(200).json({
      success: true,
      data: preOrders
    });
  } catch (error) {
    console.error('Get customer pre-orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pre-orders'
    });
  }
};

// @desc    Get customer loyalty statistics
// @route   GET /api/customer/loyalty
// @access  Private (Customer only)
exports.getCustomerLoyalty = async (req, res) => {
  try {
    const customerId = req.user.id;
    const loyaltyStats = await customerService.getCustomerLoyaltyStats(customerId);

    res.status(200).json({
      success: true,
      data: loyaltyStats
    });
  } catch (error) {
    console.error('Get customer loyalty error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loyalty statistics'
    });
  }
};