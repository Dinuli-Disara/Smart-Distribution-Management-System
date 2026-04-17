// backend/controllers/stockReceiveApprovalController.js
const { sequelize } = require('../config/database');

// @desc    Create stock receive request (Clerk)
// @route   POST /api/stock-receive-approvals/request
// @access  Private (Clerk, Owner)
exports.createReceiveRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { manufacturer_id, purchase_order_reference, items, notes } = req.body;

    // Validation
    if (!items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Please provide items to receive'
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.batch_number || 
          !item.expiry_date || !item.unit_price) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Each item must have product_id, quantity, batch_number, expiry_date, and unit_price'
        });
      }
    }

    // Create receive request
    const [result] = await sequelize.query(`
      INSERT INTO Stock_Receive_Requests 
      (manufacturer_id, purchase_order_reference, requested_by, status, review_notes)
      VALUES (?, ?, ?, 'PENDING', ?)
    `, {
      replacements: [
        manufacturer_id || null,
        purchase_order_reference || null,
        req.user.id,
        notes || null
      ],
      transaction
    });

    const receiveRequestId = result;

    // Insert request items
    for (const item of items) {
      await sequelize.query(`
        INSERT INTO Stock_Receive_Request_Items
        (receive_request_id, product_id, quantity, batch_number, expiry_date, unit_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `, {
        replacements: [
          receiveRequestId,
          item.product_id,
          item.quantity,
          item.batch_number,
          item.expiry_date,
          item.unit_price
        ],
        transaction
      });
    }

    await transaction.commit();

    // Get created request with details
    const [request] = await sequelize.query(`
      SELECT 
        r.*,
        e.name as requested_by_name,
        m.name as manufacturer_name
      FROM Stock_Receive_Requests r
      LEFT JOIN Employee e ON r.requested_by = e.employee_id
      LEFT JOIN Manufacturer m ON r.manufacturer_id = m.manufacturer_id
      WHERE r.receive_request_id = ?
    `, {
      replacements: [receiveRequestId]
    });

    res.status(201).json({
      success: true,
      message: 'Stock receive request submitted successfully. Waiting for admin approval.',
      data: request[0]
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Create receive request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stock receive request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all pending receive requests (Owner/Admin)
// @route   GET /api/stock-receive-approvals/pending
// @access  Private (Owner)
exports.getPendingReceiveRequests = async (req, res) => {
  try {
    const [requests] = await sequelize.query(`
      SELECT 
        r.*,
        e.name as requested_by_name,
        m.name as manufacturer_name,
        DATEDIFF(NOW(), r.requested_at) as days_pending,
        COUNT(DISTINCT i.item_id) as item_count,
        SUM(i.quantity) as total_quantity
      FROM Stock_Receive_Requests r
      LEFT JOIN Employee e ON r.requested_by = e.employee_id
      LEFT JOIN Manufacturer m ON r.manufacturer_id = m.manufacturer_id
      LEFT JOIN Stock_Receive_Request_Items i ON r.receive_request_id = i.receive_request_id
      WHERE r.status = 'PENDING'
      GROUP BY r.receive_request_id
      ORDER BY r.requested_at DESC
    `);

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Get pending receive requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending receive requests'
    });
  }
};

// @desc    Get all receive requests with details
// @route   GET /api/stock-receive-approvals
// @access  Private (Owner)
exports.getAllReceiveRequests = async (req, res) => {
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
        DATEDIFF(NOW(), r.requested_at) as days_pending,
        COUNT(DISTINCT i.item_id) as item_count,
        SUM(i.quantity) as total_quantity
      FROM Stock_Receive_Requests r
      LEFT JOIN Employee e ON r.requested_by = e.employee_id
      LEFT JOIN Employee rv ON r.reviewed_by = rv.employee_id
      LEFT JOIN Manufacturer m ON r.manufacturer_id = m.manufacturer_id
      LEFT JOIN Stock_Receive_Request_Items i ON r.receive_request_id = i.receive_request_id
      ${whereClause}
      GROUP BY r.receive_request_id
      ORDER BY r.requested_at DESC
    `);

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Get all receive requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch receive requests'
    });
  }
};

// @desc    Get single receive request with items
// @route   GET /api/stock-receive-approvals/:id
// @access  Private (Owner, Clerk who created)
exports.getReceiveRequest = async (req, res) => {
  try {
    const [requests] = await sequelize.query(`
      SELECT 
        r.*,
        e.name as requested_by_name,
        rv.name as reviewed_by_name,
        m.name as manufacturer_name,
        m.manufacturer_id
      FROM Stock_Receive_Requests r
      LEFT JOIN Employee e ON r.requested_by = e.employee_id
      LEFT JOIN Employee rv ON r.reviewed_by = rv.employee_id
      LEFT JOIN Manufacturer m ON r.manufacturer_id = m.manufacturer_id
      WHERE r.receive_request_id = ?
    `, {
      replacements: [req.params.id]
    });

    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Receive request not found'
      });
    }

    // Check if user is Owner or the creator
    if (req.user.role !== 'Owner' && requests[0].requested_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }

    // Get request items
    const [items] = await sequelize.query(`
      SELECT 
        i.*,
        p.product_name,
        p.product_code,
        p.unit_price as current_unit_price
      FROM Stock_Receive_Request_Items i
      JOIN Product p ON i.product_id = p.product_id
      WHERE i.receive_request_id = ?
      ORDER BY p.product_name
    `, {
      replacements: [req.params.id]
    });

    res.status(200).json({
      success: true,
      data: {
        ...requests[0],
        items
      }
    });

  } catch (error) {
    console.error('Get receive request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch receive request'
    });
  }
};

// @desc    Approve receive request (Owner)
// @route   PUT /api/stock-receive-approvals/:id/approve
// @access  Private (Owner)
exports.approveReceiveRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    // Get the request with items
    const [requests] = await sequelize.query(`
      SELECT * FROM Stock_Receive_Requests 
      WHERE receive_request_id = ? AND status = 'PENDING'
    `, {
      replacements: [id],
      transaction
    });

    if (requests.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pending receive request not found'
      });
    }

    const { notes, items: editedItems } = req.body;

    let items = [];
    if (editedItems && Array.isArray(editedItems)) {
      if (editedItems.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Receive request must contain at least one item'
        });
      }

      // Validate edited items
      for (const item of editedItems) {
        if (!item.product_id || !item.quantity || !item.batch_number ||
            !item.expiry_date || !item.unit_price) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'Each item must have product_id, quantity, batch_number, expiry_date, and unit_price'
          });
        }
      }

      // Replace existing request items with edited items
      await sequelize.query(`
        DELETE FROM Stock_Receive_Request_Items
        WHERE receive_request_id = ?
      `, {
        replacements: [id],
        transaction
      });

      for (const item of editedItems) {
        await sequelize.query(`
          INSERT INTO Stock_Receive_Request_Items
          (receive_request_id, product_id, quantity, batch_number, expiry_date, unit_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            id,
            item.product_id,
            item.quantity,
            item.batch_number,
            item.expiry_date,
            item.unit_price
          ],
          transaction
        });
      }

      const [updatedItems] = await sequelize.query(`
        SELECT * FROM Stock_Receive_Request_Items
        WHERE receive_request_id = ?
      `, {
        replacements: [id],
        transaction
      });
      items = updatedItems;
    } else {
      const [existingItems] = await sequelize.query(`
        SELECT * FROM Stock_Receive_Request_Items
        WHERE receive_request_id = ?
      `, {
        replacements: [id],
        transaction
      });
      items = existingItems;
    }

    // Get main store location
    const [storeLocation] = await sequelize.query(`
      SELECT location_id FROM Stock_Location 
      WHERE location_type = 'STORE' 
      LIMIT 1
    `, { transaction });

    if (storeLocation.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Store location not found'
      });
    }

    const locationId = storeLocation[0].location_id;

    // Process each item and add to inventory
    for (const item of items) {
      // Create stock batch
      await sequelize.query(`
        INSERT INTO Stock_Batch 
        (product_id, location_id, batch_number, quantity, price_per_unit, expiry_date, received_date, batch_status, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'ACTIVE', ?, ?)
      `, {
        replacements: [
          item.product_id,
          locationId,
          item.batch_number,
          item.quantity,
          item.unit_price,
          item.expiry_date,
          req.user.id,
          req.user.id
        ],
        transaction
      });

      // Log stock movement
      await sequelize.query(`
        INSERT INTO Stock_Movement
        (product_id, to_location_id, quantity_change, movement_type, reference_id, created_by)
        VALUES (?, ?, ?, 'PURCHASE', ?, ?)
      `, {
        replacements: [item.product_id, locationId, item.quantity, id, req.user.id],
        transaction
      });
    }

    // Update the request status
    await sequelize.query(`
      UPDATE Stock_Receive_Requests
      SET status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
      WHERE receive_request_id = ?
    `, {
      replacements: [req.user.id, notes || null, id],
      transaction
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Stock receive request approved and inventory updated',
      data: {
        receive_request_id: id,
        items_processed: items.length
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Approve receive request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve receive request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Reject receive request (Owner)
// @route   PUT /api/stock-receive-approvals/:id/reject
// @access  Private (Owner)
exports.rejectReceiveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const [result] = await sequelize.query(`
      UPDATE Stock_Receive_Requests
      SET status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW(), review_notes = ?
      WHERE receive_request_id = ? AND status = 'PENDING'
    `, {
      replacements: [req.user.id, notes || null, id]
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pending receive request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stock receive request rejected'
    });

  } catch (error) {
    console.error('Reject receive request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject receive request'
    });
  }
};