// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Protect routes - Check if user is authenticated
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists and is active
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

      // Add user info to request
      req.user = {
        id: employee.employee_id,
        role: employee.role,
        name: employee.name,
        email: employee.email
      };

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