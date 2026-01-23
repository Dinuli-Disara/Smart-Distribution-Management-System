// backend/controllers/inventoryController.js
const { sequelize } = require('../config/database');

// @desc    Get inventory by location (Store or Van)
// @route   GET /api/inventory/location/:locationId
// @access  Private
exports.getInventoryByLocation = async (req, res) => {
  try {
    const [inventory] = await sequelize.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.product_code,
        p.unit_price,
        sl.location_type,
        sl.location_name,
        SUM(sb.quantity) as total_quantity,
        MIN(sb.expiry_date) as nearest_expiry,
        COUNT(DISTINCT sb.batch_id) as batch_count
      FROM Product p
      JOIN Stock_Batch sb ON p.product_id = sb.product_id
      JOIN Stock_Location sl ON sb.location_id = sl.location_id
      WHERE sl.location_id = ? AND sb.batch_status = 'ACTIVE'
      GROUP BY p.product_id, sl.location_id
      ORDER BY p.product_name
    `, {
      replacements: [req.params.locationId]
    });

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    console.error('Get inventory by location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory'
    });
  }
};

// @desc    Get all store inventory
// @route   GET /api/inventory/store
// @access  Private
exports.getStoreInventory = async (req, res) => {
  try {
    const [inventory] = await sequelize.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.product_code,
        p.unit_price,
        p.low_stock_threshold,
        SUM(sb.quantity) as total_quantity,
        MIN(sb.expiry_date) as nearest_expiry,
        COUNT(DISTINCT sb.batch_id) as batch_count,
        CASE 
          WHEN SUM(sb.quantity) < p.low_stock_threshold THEN true
          ELSE false
        END as is_low_stock
      FROM Product p
      LEFT JOIN Stock_Batch sb ON p.product_id = sb.product_id AND sb.batch_status = 'ACTIVE'
      LEFT JOIN Stock_Location sl ON sb.location_id = sl.location_id
      WHERE sl.location_type = 'STORE' OR sl.location_type IS NULL
      GROUP BY p.product_id
      ORDER BY is_low_stock DESC, p.product_name
    `);

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    console.error('Get store inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch store inventory'
    });
  }
};

// @desc    Get all van inventory
// @route   GET /api/inventory/vans
// @access  Private
exports.getVanInventory = async (req, res) => {
  try {
    const [inventory] = await sequelize.query(`
      SELECT 
        v.van_id,
        v.vehicle_number,
        e.name as assigned_employee,
        p.product_id,
        p.product_name,
        p.product_code,
        p.unit_price,
        SUM(sb.quantity) as quantity,
        MIN(sb.expiry_date) as nearest_expiry
      FROM Van v
      LEFT JOIN Employee e ON v.assigned_employee_id = e.employee_id
      LEFT JOIN Stock_Location sl ON sl.van_id = v.van_id
      LEFT JOIN Stock_Batch sb ON sb.location_id = sl.location_id AND sb.batch_status = 'ACTIVE'
      LEFT JOIN Product p ON sb.product_id = p.product_id
      WHERE sl.location_type = 'VAN'
      GROUP BY v.van_id, p.product_id
      ORDER BY v.vehicle_number, p.product_name
    `);

    // Group by van
    const vanInventory = {};
    inventory.forEach(item => {
      if (!vanInventory[item.van_id]) {
        vanInventory[item.van_id] = {
          van_id: item.van_id,
          vehicle_number: item.vehicle_number,
          assigned_employee: item.assigned_employee,
          products: []
        };
      }
      if (item.product_id) {
        vanInventory[item.van_id].products.push({
          product_id: item.product_id,
          product_name: item.product_name,
          product_code: item.product_code,
          unit_price: item.unit_price,
          quantity: item.quantity,
          nearest_expiry: item.nearest_expiry
        });
      }
    });

    res.status(200).json({
      success: true,
      data: Object.values(vanInventory)
    });
  } catch (error) {
    console.error('Get van inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch van inventory'
    });
  }
};

// @desc    Get inventory summary (dashboard)
// @route   GET /api/inventory/summary
// @access  Private
exports.getInventorySummary = async (req, res) => {
  try {
    // Get basic summary
    const [summary] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT p.product_id) as total_products,
        COALESCE(SUM(CASE WHEN sl.location_type = 'STORE' THEN sb.quantity ELSE 0 END), 0) as store_stock,
        COALESCE(SUM(CASE WHEN sl.location_type = 'VAN' THEN sb.quantity ELSE 0 END), 0) as van_stock,
        COALESCE(SUM(sb.quantity), 0) as total_stock
      FROM Product p
      LEFT JOIN Stock_Batch sb ON p.product_id = sb.product_id AND sb.batch_status = 'ACTIVE'
      LEFT JOIN Stock_Location sl ON sb.location_id = sl.location_id
      WHERE p.is_active = true
    `);

    // Get expiring batches
    const [expiringCount] = await sequelize.query(`
      SELECT COUNT(DISTINCT sb.batch_id) as expiring_batches
      FROM Stock_Batch sb
      WHERE sb.batch_status = 'ACTIVE'
        AND sb.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `);

    // Get low stock products count
    const [lowStockCount] = await sequelize.query(`
      SELECT COUNT(*) as low_stock_products
      FROM (
        SELECT p.product_id
        FROM Product p
        LEFT JOIN Stock_Batch sb ON p.product_id = sb.product_id AND sb.batch_status = 'ACTIVE'
        WHERE p.is_active = true
        GROUP BY p.product_id, p.low_stock_threshold
        HAVING COALESCE(SUM(sb.quantity), 0) < p.low_stock_threshold
      ) as low_stock
    `);

    // Get zero stock products count
    const [zeroStockCount] = await sequelize.query(`
      SELECT COUNT(*) as zero_stock_products
      FROM (
        SELECT p.product_id
        FROM Product p
        LEFT JOIN Stock_Batch sb ON p.product_id = sb.product_id AND sb.batch_status = 'ACTIVE'
        WHERE p.is_active = true
        GROUP BY p.product_id
        HAVING COALESCE(SUM(sb.quantity), 0) = 0
      ) as zero_stock
    `);

    res.status(200).json({
      success: true,
      data: {
        ...summary[0],
        expiring_batches: expiringCount[0].expiring_batches,
        low_stock_products: lowStockCount[0].low_stock_products,
        zero_stock_products: zeroStockCount[0].zero_stock_products
      }
    });

  } catch (error) {
    console.error('Get inventory summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Receive stock from manufacturer
// @route   POST /api/inventory/receive
// @access  Private (Clerk, Owner)
exports.receiveStock = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { purchase_id, items } = req.body;

    // Validate
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide items to receive'
      });
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

    // Process each item
    for (const item of items) {
      const { product_id, quantity, batch_number, expiry_date, unit_price } = item;

      // Create stock batch
      await sequelize.query(`
        INSERT INTO Stock_Batch 
        (product_id, location_id, batch_number, quantity, price_per_unit, expiry_date, received_date, batch_status, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'ACTIVE', ?, ?)
      `, {
        replacements: [
          product_id,
          locationId,
          batch_number,
          quantity,
          unit_price,
          expiry_date,
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
        replacements: [product_id, locationId, quantity, purchase_id, req.user.id],
        transaction
      });
    }

    // Update purchase order status if provided
    if (purchase_id) {
      await sequelize.query(`
        UPDATE Purchase_Order
        SET purchase_status = 'RECEIVED', delivery_date = CURDATE(), updated_by = ?
        WHERE purchase_id = ?
      `, {
        replacements: [req.user.id, purchase_id],
        transaction
      });
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Stock received successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Receive stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to receive stock',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};