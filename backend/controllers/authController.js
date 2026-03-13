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

// Add this function to generate mobile deep links
const generateResetLinks = (token) => {
  const webUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
  // Mobile deep link - using your app's custom scheme
  const mobileDeepLink = `manjuladms://reset-password/${token}`;
  
  // Alternative: Universal link (iOS) / App Link (Android)
  const universalLink = `${process.env.MOBILE_APP_URL}/reset-password/${token}`;
  
  return {
    webUrl,
    mobileDeepLink,
    universalLink
  };
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
    if (!employee) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a reset link will be sent'
      });
    }

    // Generate reset token
    const resetToken = employee.createPasswordResetToken();
    await employee.save();

    // Generate all types of reset links
    const links = generateResetLinks(resetToken);

    console.log('\n========== PASSWORD RESET TOKEN ==========');
    console.log('For employee:', employee.name);
    console.log('Email:', employee.email);
    console.log('Reset Token:', resetToken);
    console.log('Web URL:', links.webUrl);
    console.log('Mobile Deep Link:', links.mobileDeepLink);
    console.log('===========================================\n');

    // Create email message with mobile app support
    const message = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(to right, #1E3EA6, #D20073); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .button { 
            display: inline-block; 
            padding: 14px 28px; 
            background: linear-gradient(to right, #1E3EA6, #D20073); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold; 
            font-size: 16px;
            margin: 10px 5px;
          }
          .card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #1E3EA6; }
          .link-box { background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 15px 0; font-family: monospace; font-size: 12px; word-break: break-all; }
          .instructions { background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Dreamron DMS</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">Password Reset Request</p>
          </div>
          
          <div class="content">
            <h2>Hello ${employee.name},</h2>
            <p>You requested a password reset for your Dreamron DMS account.</p>
            
            <div class="card">
              <h3 style="margin-top: 0;">📱 Open in Mobile App</h3>
              <p>Click this button to open directly in the mobile app:</p>
              <div style="text-align: center;">
                <a href="${links.mobileDeepLink}" class="button">
                  Open in Mobile App
                </a>
              </div>
              <p style="font-size: 12px; color: #666; margin-top: 10px;">
                If the app doesn't open automatically, copy and paste this link:
              </p>
              <div class="link-box">${links.mobileDeepLink}</div>
            </div>
            
            <div class="card">
              <h3 style="margin-top: 0;">🌐 Open in Web Browser</h3>
              <p>Click this button to open in your web browser:</p>
              <div style="text-align: center;">
                <a href="${links.webUrl}" class="button" style="background: #4CAF50;">
                  Open in Browser
                </a>
              </div>
              <p style="font-size: 12px; color: #666; margin-top: 10px;">
                Or copy and paste this link:
              </p>
              <div class="link-box">${links.webUrl}</div>
            </div>
            
            <div class="instructions">
              <h4 style="margin-top: 0; color: #1E40AF;">📝 Instructions:</h4>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Mobile Users:</strong> Click "Open in Mobile App" button</li>
                <li><strong>Desktop Users:</strong> Click "Open in Browser" button</li>
                <li><strong>If buttons don't work:</strong> Copy the appropriate link above</li>
                <li><strong>Link expires:</strong> In 10 minutes</li>
              </ol>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Note:</strong> If you didn't request this password reset, please ignore this email.
              Your account security is important to us.
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from Dreamron DMS.</p>
            <p>Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Dreamron DMS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // 🔧 Environment-based email handling
      if (process.env.NODE_ENV === 'production') {
        // Production email configuration
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || '"Dreamron DMS" <noreply@dreamron.com>',
          to: employee.email,
          subject: 'Password Reset Request - Dreamron DMS',
          html: message
        });

        console.log(`✅ Password reset email sent to: ${employee.email}`);

      } else {
        // Development mode - log links instead of sending email
        console.log('\n========== DEVELOPMENT MODE ==========');
        console.log('📧 Email would be sent to:', employee.email);
        console.log('📱 Mobile Deep Link:', links.mobileDeepLink);
        console.log('🌐 Web URL:', links.webUrl);
        console.log('🔑 Reset Token:', resetToken);
        console.log('=====================================\n');
      }

      res.status(200).json({
        success: true,
        message: process.env.NODE_ENV === 'production' 
          ? 'Password reset link sent to your email'
          : 'Reset link generated for development',
        // Return the links in development for testing
        ...(process.env.NODE_ENV !== 'production' && {
          debug: {
            mobileDeepLink: links.mobileDeepLink,
            webUrl: links.webUrl,
            token: resetToken
          }
        })
      });

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);

      // Clear reset token if email fails
      employee.clearPasswordResetToken();
      await employee.save();

      res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again.'
      });
    }

  } catch (error) {
    console.error('❌ Forgot password error:', error);
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