// backend/controllers/customerAuthController.js
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const crypto = require('crypto');
const { Op } = require('sequelize');

const generateToken = (id) => {
  return jwt.sign(
    { id, type: 'customer' }, // Add type to distinguish from employee
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

exports.customerLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    const customer = await Customer.findOne({
      where: { username, is_active: true }
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordCorrect = await customer.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(customer.customer_id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        customer_id: customer.customer_id,
        name: customer.name,
        email: customer.email,
        username: customer.username,
        shop_name: customer.shop_name,
        address: customer.address,
        city: customer.city,
        loyalty_points: customer.loyalty_points,
        credit_limit: customer.credit_limit,
        role: 'customer', // Always return 'customer' role
        token
      }
    });

  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });

  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add customer-specific forgot password, etc.