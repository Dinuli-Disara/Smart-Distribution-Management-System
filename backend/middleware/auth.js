// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const Customer = require('../models/Customer'); // Add this

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if it's a customer token
      if (decoded.type === 'customer') {
        const customer = await Customer.findOne({
          where: {
            customer_id: decoded.id,
            is_active: true
          }
        });

        if (!customer) {
          return res.status(401).json({
            success: false,
            message: 'Customer no longer exists or is inactive'
          });
        }

        req.user = {
          id: customer.customer_id,
          role: 'customer', // Fixed role
          type: 'customer',
          name: customer.name,
          email: customer.email
        };
      } else {
        // It's an employee token
        const employee = await Employee.findOne({
          where: {
            employee_id: decoded.id,
            is_active: true
          }
        });

        if (!employee) {
          return res.status(401).json({
            success: false,
            message: 'User no longer exists or is inactive'
          });
        }

        req.user = {
          id: employee.employee_id,
          role: employee.role,
          type: 'employee',
          name: employee.name,
          email: employee.email
        };
      }

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired. Please login again.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Role-based access control
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};