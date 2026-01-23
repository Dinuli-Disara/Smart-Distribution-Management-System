// backend/controllers/stockTransferController.js
const { sequelize } = require('../config/database');

// @desc    Get all stock transfers
// @route   GET /api/stock-transfers
// @access  Private
exports.getAllTransfers = async (req, res) => {
  try {
    const { status } = req.query;
    
    let whereClause = '';
    if (status) {
      whereClause = `WHERE st.status = '${status}'`;
    }

    const [transfers] = await sequelize.query(`
      SELECT 
        st.*,
        e.name as transferred_by_name,
        sl_from.location_type as from_location_type,
        sl_from.location_name as from_location_name,
        sl_to.location_type as to_location_type,
        sl_to.location_name as to_location_name,
        v.vehicle_number,
        COUNT(ti.transfer_item_id) as item_count
      FROM Stock_Transfer st
      LEFT JOIN Employee e ON st.transferred_by = e.employee_id
      LEFT JOIN Stock_Location sl_from ON st.from_location_id = sl_from.location_id
      LEFT JOIN Stock_Location sl_to ON st.to_location_id = sl_to.location_id
      LEFT JOIN Van v ON sl_to.van_id = v.van_id
      LEFT JOIN Transfer_Items ti ON st.transfer_id = ti.transfer_id
      ${whereClause}
      GROUP BY st.transfer_id
      ORDER BY st.transfer_date DESC
    `);

    res.status(200).json({
      success: true,
      count: transfers.length,
      data: transfers
    });
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transfers'
    });
  }
};

// @desc    Get single transfer with items
// @route   GET /api/stock-transfers/:id
// @access  Private
exports.getTransfer = async (req, res) => {
  try {
    const [transfer] = await sequelize.query(`
      SELECT 
        st.*,
        e.name as transferred_by_name,
        sl_from.location_type as from_location_type,
        sl_from.location_name as from_location_name,
        sl_to.location_type as to_location_type,
        sl_to.location_name as to_location_name,
        v.vehicle_number
      FROM Stock_Transfer st
      LEFT JOIN Employee e ON st.transferred_by = e.employee_id
      LEFT JOIN Stock_Location sl_from ON st.from_location_id = sl_from.location_id
      LEFT JOIN Stock_Location sl_to ON st.to_location_id = sl_to.location_id
      LEFT JOIN Van v ON sl_to.van_id = v.van_id
      WHERE st.transfer_id = ?
    `, {
      replacements: [req.params.id]
    });

    if (!transfer || transfer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }

    // Get transfer items
    const [items] = await sequelize.query(`
      SELECT 
        ti.*,
        p.product_name,
        p.product_code,
        sb.batch_number,
        sb.expiry_date
      FROM Transfer_Items ti
      JOIN Product p ON ti.product_id = p.product_id
      LEFT JOIN Stock_Batch sb ON ti.source_batch_id = sb.batch_id
      WHERE ti.transfer_id = ?
    `, {
      replacements: [req.params.id]
    });

    res.status(200).json({
      success: true,
      data: {
        ...transfer[0],
        items
      }
    });
  } catch (error) {
    console.error('Get transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transfer'
    });
  }
};

// @desc    Create stock transfer (Store to Van)
// @route   POST /api/stock-transfers
// @access  Private (Clerk, Owner)
exports.createTransfer = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { to_van_id, items, notes } = req.body;

    // Validation
    if (!to_van_id || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide van and items to transfer'
      });
    }

    // Get store location (from)
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

    // Get van location (to)
    const [vanLocation] = await sequelize.query(`
      SELECT location_id FROM Stock_Location 
      WHERE location_type = 'VAN' AND van_id = ?
    `, {
      replacements: [to_van_id],
      transaction
    });

    if (vanLocation.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Van location not found'
      });
    }

    const fromLocationId = storeLocation[0].location_id;
    const toLocationId = vanLocation[0].location_id;

    // Create transfer record
    const transferNumber = `TRF-${Date.now()}`;
    
    const [transferResult] = await sequelize.query(`
      INSERT INTO Stock_Transfer 
      (transfer_number, from_location_id, to_location_id, transferred_by, status, notes)
      VALUES (?, ?, ?, ?, 'PENDING', ?)
    `, {
      replacements: [
        transferNumber,
        fromLocationId,
        toLocationId,
        req.user.id,
        notes || null
      ],
      transaction
    });

    const transferId = transferResult;

    // Process each item
    for (const item of items) {
      const { product_id, quantity } = item;

      if (!product_id || !quantity || quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid item data'
        });
      }

      // Get oldest batch with sufficient quantity (FIFO)
      const [batches] = await sequelize.query(`
        SELECT batch_id, quantity, price_per_unit, expiry_date
        FROM Stock_Batch
        WHERE product_id = ? 
          AND location_id = ?
          AND batch_status = 'ACTIVE'
          AND quantity >= ?
        ORDER BY expiry_date ASC, received_date ASC
        LIMIT 1
      `, {
        replacements: [product_id, fromLocationId, quantity],
        transaction
      });

      if (batches.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ID ${product_id}`
        });
      }

      const sourceBatch = batches[0];

      // Create transfer item
      await sequelize.query(`
        INSERT INTO Transfer_Items
        (transfer_id, product_id, source_batch_id, quantity_to_transfer, unit_price, item_status)
        VALUES (?, ?, ?, ?, ?, 'PENDING')
      `, {
        replacements: [
          transferId,
          product_id,
          sourceBatch.batch_id,
          quantity,
          sourceBatch.price_per_unit
        ],
        transaction
      });

      // Deduct from source batch
      await sequelize.query(`
        UPDATE Stock_Batch
        SET quantity = quantity - ?,
            updated_by = ?,
            updated_at = NOW()
        WHERE batch_id = ?
      `, {
        replacements: [quantity, req.user.id, sourceBatch.batch_id],
        transaction
      });

      // Create new batch in destination (van)
      const [newBatchResult] = await sequelize.query(`
        INSERT INTO Stock_Batch
        (product_id, location_id, batch_number, quantity, price_per_unit, expiry_date, received_date, batch_status, parent_batch_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'ACTIVE', ?, ?, ?)
      `, {
        replacements: [
          product_id,
          toLocationId,
          `VAN-${Date.now()}-${product_id}`,
          quantity,
          sourceBatch.price_per_unit,
          sourceBatch.expiry_date,
          sourceBatch.batch_id,
          req.user.id,
          req.user.id
        ],
        transaction
      });

      // Update transfer item with destination batch
      await sequelize.query(`
        UPDATE Transfer_Items
        SET destination_batch_id = ?, item_status = 'PROCESSED'
        WHERE transfer_id = ? AND product_id = ?
      `, {
        replacements: [newBatchResult, transferId, product_id],
        transaction
      });

      // Log stock movement
      await sequelize.query(`
        INSERT INTO Stock_Movement
        (product_id, from_location_id, to_location_id, quantity_change, movement_type, reference_id, created_by)
        VALUES (?, ?, ?, ?, 'TRANSFER', ?, ?)
      `, {
        replacements: [
          product_id,
          fromLocationId,
          toLocationId,
          quantity,
          transferId,
          req.user.id
        ],
        transaction
      });
    }

    // Update transfer status to completed
    await sequelize.query(`
      UPDATE Stock_Transfer
      SET status = 'COMPLETED'
      WHERE transfer_id = ?
    `, {
      replacements: [transferId],
      transaction
    });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Stock transfer completed successfully',
      data: {
        transfer_id: transferId,
        transfer_number: transferNumber
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transfer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get available stock for transfer
// @route   GET /api/stock-transfers/available-stock
// @access  Private
exports.getAvailableStockForTransfer = async (req, res) => {
  try {
    const [stock] = await sequelize.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.product_code,
        p.unit_price,
        SUM(sb.quantity) as available_quantity,
        MIN(sb.expiry_date) as nearest_expiry
      FROM Product p
      JOIN Stock_Batch sb ON p.product_id = sb.product_id
      JOIN Stock_Location sl ON sb.location_id = sl.location_id
      WHERE sl.location_type = 'STORE' 
        AND sb.batch_status = 'ACTIVE'
        AND p.is_active = true
      GROUP BY p.product_id
      HAVING available_quantity > 0
      ORDER BY p.product_name
    `);

    res.status(200).json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Get available stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available stock'
    });
  }
};