// backend/controllers/productApprovalController.js
const { sequelize } = require('../config/database');

// @desc    Create product approval request (Clerk)
// @route   POST /api/product-approvals/request
// @access  Private (Clerk, Owner)
exports.createApprovalRequest = async (req, res) => {
  try {
    const {
      product_name,
      product_code,
      product_description,
      unit_price,
      low_stock_threshold,
      manufacturer_id
    } = req.body;

    // Validation
    if (!product_name || !unit_price || !manufacturer_id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide product name, price, and manufacturer'
      });
    }

    // Check if product code already exists (optional - warn but still allow request)
    let productCodeExists = false;
    if (product_code) {
      const [existing] = await sequelize.query(`
        SELECT product_id FROM Product WHERE product_code = ?
      `, {
        replacements: [product_code]
      });
      productCodeExists = existing.length > 0;
    }

    // Create approval request
    const [result] = await sequelize.query(`
      INSERT INTO Product_Approval_Requests 
      (product_name, product_code, product_description, unit_price, low_stock_threshold, manufacturer_id, requested_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `, {
      replacements: [
        product_name,
        product_code || null,
        product_description || null,
        unit_price,
        low_stock_threshold || 10,
        manufacturer_id,
        req.user.id
      ]
    });

    // Get created request
    const [request] = await sequelize.query(`
      SELECT 
        r.*,
        e.name as requested_by_name,
        m.name as manufacturer_name
      FROM Product_Approval_Requests r
      LEFT JOIN Employee e ON r.requested_by = e.employee_id
      LEFT JOIN Manufacturer m ON r.manufacturer_id = m.manufacturer_id
      WHERE r.request_id = ?
    `, {
      replacements: [result]
    });

    res.status(201).json({
      success: true,
      message: productCodeExists ? 'Product request submitted. Note: Product code already exists in system.' : 'Product request submitted successfully',
      data: request[0],
      warning: productCodeExists ? 'Product code already exists' : null
    });

  } catch (error) {
    console.error('Create approval request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all pending approval requests (Owner/Admin)
// @route   GET /api/product-approvals/pending
// @access  Private (Owner)
exports.getPendingRequests = async (req, res) => {
  try {
    const [requests] = await sequelize.query(`
      SELECT 
        r.*,
        e.name as requested_by_name,
        m.name as manufacturer_name,
        DATEDIFF(NOW(), r.requested_at) as days_pending
      FROM Product_Approval_Requests r
      LEFT JOIN Employee e ON r.requested_by = e.employee_id
      LEFT JOIN Manufacturer m ON r.manufacturer_id = m.manufacturer_id
      WHERE r.status = 'PENDING'
      ORDER BY r.requested_at DESC
    `);

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending requests'
    });
  }
};

// @desc    Get all requests (with filters)
// @route   GET /api/product-approvals
// @access  Private (Owner)
exports.getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    
    let whereClause = '';
    if (status) {
      whereClause = `WHERE r.status = '${status}'`;
    }

    const [requests] = await sequelize.query(`
      SELECT 
        r.*,
        e.name as requested_by_name,
        rv.name as reviewed_by_name,
        m.name as manufacturer_name,
        DATEDIFF(NOW(), r.requested_at) as days_pending
      FROM Product_Approval_Requests r
      LEFT JOIN Employee e ON r.requested_by = e.employee_id
      LEFT JOIN Employee rv ON r.reviewed_by = rv.employee_id
      LEFT JOIN Manufacturer m ON r.manufacturer_id = m.manufacturer_id
      ${whereClause}
      ORDER BY r.requested_at DESC
    `);

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests'
    });
  }
};

// @desc    Approve product request (Owner)
// @route   PUT /api/product-approvals/:id/approve
// @access  Private (Owner)
exports.approveRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Get the request
    const [requests] = await sequelize.query(`
      SELECT * FROM Product_Approval_Requests 
      WHERE request_id = ? AND status = 'PENDING'
    `, {
      replacements: [id],
      transaction
    });

    if (requests.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pending request not found'
      });
    }

    const request = requests[0];

    // Check if product code already exists (if provided)
    if (request.product_code) {
      const [existing] = await sequelize.query(`
        SELECT product_id FROM Product WHERE product_code = ?
      `, {
        replacements: [request.product_code],
        transaction
      });

      if (existing.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Product code already exists in system'
        });
      }
    }

    // Create the actual product
    const [productResult] = await sequelize.query(`
      INSERT INTO Product 
      (product_name, product_code, product_description, unit_price, low_stock_threshold, manufacturer_id, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        request.product_name,
        request.product_code,
        request.product_description,
        request.unit_price,
        request.low_stock_threshold,
        request.manufacturer_id,
        req.user.id, // Owner approving
        req.user.id
      ],
      transaction
    });

    // Update the request status
    await sequelize.query(`
      UPDATE Product_Approval_Requests
      SET status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
      WHERE request_id = ?
    `, {
      replacements: [req.user.id, notes || null, id],
      transaction
    });

    await transaction.commit();

    // Get the created product
    const [product] = await sequelize.query(`
      SELECT p.*, m.name as manufacturer_name
      FROM Product p
      LEFT JOIN Manufacturer m ON p.manufacturer_id = m.manufacturer_id
      WHERE p.product_id = ?
    `, {
      replacements: [productResult]
    });

    res.status(200).json({
      success: true,
      message: 'Product request approved and product created',
      data: {
        product: product[0],
        request_id: id
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Reject product request (Owner)
// @route   PUT /api/product-approvals/:id/reject
// @access  Private (Owner)
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const [result] = await sequelize.query(`
      UPDATE Product_Approval_Requests
      SET status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
      WHERE request_id = ? AND status = 'PENDING'
    `, {
      replacements: [req.user.id, notes || null, id]
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pending request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product request rejected'
    });

  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject request'
    });
  }
};

// @desc    Get single request details
// @route   GET /api/product-approvals/:id
// @access  Private (Owner, Clerk who created)
exports.getRequest = async (req, res) => {
  try {
    const [requests] = await sequelize.query(`
      SELECT 
        r.*,
        e.name as requested_by_name,
        rv.name as reviewed_by_name,
        m.name as manufacturer_name
      FROM Product_Approval_Requests r
      LEFT JOIN Employee e ON r.requested_by = e.employee_id
      LEFT JOIN Employee rv ON r.reviewed_by = rv.employee_id
      LEFT JOIN Manufacturer m ON r.manufacturer_id = m.manufacturer_id
      WHERE r.request_id = ?
    `, {
      replacements: [req.params.id]
    });

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check if user is Owner or the creator
    if (req.user.role !== 'Owner' && requests[0].requested_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }

    res.status(200).json({
      success: true,
      data: requests[0]
    });

  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch request'
    });
  }
};