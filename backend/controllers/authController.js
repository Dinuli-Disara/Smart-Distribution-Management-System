// backend/controllers/authController.js
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Check if user exists
    const employee = await Employee.findOne({
      where: { username, is_active: true }
    });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordCorrect = await employee.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(employee.employee_id, employee.role);

    // Send response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        employee_id: employee.employee_id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        username: employee.username,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.user.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user
    const employee = await Employee.findByPk(req.user.id);

    // Check current password
    const isPasswordCorrect = await employee.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    employee.password = newPassword;
    employee.updated_by = req.user.id;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Forgot password - Send reset token
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    // Find employee by email
    const employee = await Employee.findOne({
      where: {
        email: email.toLowerCase().trim(),
        is_active: true
      }
    });

    console.log('\n========== FORGOT PASSWORD REQUEST ==========');
    console.log('Requested email:', email);
    console.log('Employee found:', !!employee);
    console.log('=============================================\n');

    // For security, don't reveal if user exists
    // Always return success response
    if (!employee) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a reset link will be sent'
      });
    }

    // Generate reset token
    const resetToken = employee.createPasswordResetToken();
    await employee.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // ========== ADD THESE CONSOLE LOGS ==========
    console.log('\n========== PASSWORD RESET TOKEN ==========');
    console.log('For employee:', employee.name);
    console.log('Email:', employee.email);
    console.log('Reset Token:', resetToken);
    console.log('Reset URL:', resetUrl);
    console.log('Frontend URL:', process.env.FRONTEND_URL);
    console.log('===========================================\n');
    // ============================================

    // Create email message
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #1E3EA6; margin-bottom: 10px;">Dreamron DMS</h2>
          <p style="color: #666; font-size: 14px;">Password Reset Request</p>
        </div>
        
        <p>Hello <strong>${employee.name}</strong>,</p>
        
        <p>You requested a password reset for your Dreamron DMS account.</p>
        
        <p>Click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(to right, #1E3EA6, #D20073); 
                    color: white; 
                    padding: 12px 30px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: bold;
                    display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>Or copy and paste this link in your browser:</p>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
          ${resetUrl}
        </p>
        
        <p><strong>Important:</strong> This link will expire in 10 minutes.</p>
        
        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
        
        <div style="text-align: center; color: #999; font-size: 12px;">
          <p>This is an automated message from Dreamron DMS.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    `;

    try {
      // Configure email transporter
      let transporter;

      if (process.env.NODE_ENV === 'production') {
        // Production email configuration (using SMTP)
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      } else {
        // Development - log email to console
        console.log('\n========== PASSWORD RESET EMAIL ==========');
        console.log('To:', employee.email);
        console.log('Subject: Password Reset Request - Dreamron DMS');
        console.log('Reset URL:', resetUrl);
        console.log('Reset Token:', resetToken);
        console.log('==========================================\n');

        // For development, you can use Ethereal email (fake SMTP)
        // or just return success without actually sending
        return res.status(200).json({
          success: true,
          message: 'Reset link generated successfully',
          // Only include in development for testing
          ...(process.env.NODE_ENV === 'development' && {
            resetUrl: resetUrl,
            resetToken: resetToken
          })
        });
      }

      // Send email
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Dreamron DMS" <noreply@dreamron.com>',
        to: employee.email,
        subject: 'Password Reset Request - Dreamron DMS',
        html: message
      });

      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email'
      });

    } catch (emailError) {
      console.error('Email sending error:', emailError);

      // Clear reset token if email fails
      employee.clearPasswordResetToken();
      await employee.save();

      res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again.'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify reset token
// @route   GET /api/auth/verify-reset-token/:token
// @access  Public
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find employee with valid reset token
    const employee = await Employee.findOne({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires: { [Op.gt]: Date.now() },
        is_active: true
      }
    });

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is invalid or has expired'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        email: employee.email,
        name: employee.name
      }
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // 🔐 Hash the token from request
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 🔍 Find employee with matching token
    const employee = await Employee.findOne({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires: { [Op.gt]: Date.now() },
        is_active: true
      }
    });

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is invalid or has expired'
      });
    }

    // 🔄 Update password
    employee.password = newPassword;
    employee.updated_by = employee.employee_id;

    // 🧹 Clear reset fields
    employee.clearPasswordResetToken();

    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};