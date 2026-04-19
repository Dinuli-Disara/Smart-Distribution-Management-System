// backend/controllers/vanStockController.js
const { sequelize } = require('../config/database');

// @desc    Get van stock for logged-in sales rep
// @route   GET /api/van-stock
// @access  Private (Sales Representative)
exports.getVanStock = async (req, res) => {
  try {
    const employeeId = req.user.id;
    
    // First, find the van assigned to this employee
    const [van] = await sequelize.query(`
      SELECT van_id, vehicle_number 
      FROM Van 
      WHERE assigned_employee_id = ? AND is_active = true
    `, {
      replacements: [employeeId]
    });
    
    if (van.length === 0) {
      // Return empty array instead of error
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No van assigned to this employee'
      });
    }
    
    const vanId = van[0].van_id;
    
    // Find stock location for this van
    const [location] = await sequelize.query(`
      SELECT location_id 
      FROM Stock_Location 
      WHERE van_id = ? AND location_type = 'VAN'
    `, {
      replacements: [vanId]
    });
    
    if (location.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No stock location found for van'
      });
    }
    
    const locationId = location[0].location_id;
    
    // Get stock items in this van
    const [stock] = await sequelize.query(`
      SELECT 
        sb.batch_id as van_stock_id,
        sb.product_id,
        p.product_name,
        p.product_code,
        p.unit_price,
        sb.quantity as available_quantity,
        sb.expiry_date,
        sb.batch_number,
        sb.price_per_unit as unit_price_actual
      FROM Stock_Batch sb
      JOIN Product p ON sb.product_id = p.product_id
      WHERE sb.location_id = ? 
        AND sb.batch_status = 'ACTIVE'
        AND sb.quantity > 0
      ORDER BY p.product_name
    `, {
      replacements: [locationId]
    });
    
    res.status(200).json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Get van stock error:', error);
    // Return empty array on error
    res.status(200).json({
      success: true,
      data: [],
      message: 'No van stock available'
    });
  }
};

// @desc    Update van stock quantity (after sale)
// @route   PUT /api/van-stock/:productId
// @access  Private (Sales Representative)
exports.updateVanStock = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { productId } = req.params;
    const { quantity, orderId } = req.body;
    const employeeId = req.user.id;
    
    // Find the van assigned to this employee
    const [van] = await sequelize.query(`
      SELECT van_id FROM Van WHERE assigned_employee_id = ? AND is_active = true
    `, {
      replacements: [employeeId],
      transaction
    });
    
    if (van.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No van assigned to this employee'
      });
    }
    
    // Find stock location for this van
    const [location] = await sequelize.query(`
      SELECT location_id FROM Stock_Location WHERE van_id = ? AND location_type = 'VAN'
    `, {
      replacements: [van[0].van_id],
      transaction
    });
    
    if (location.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Stock location not found for van'
      });
    }
    
    // Find the batch with this product in the van (FIFO - oldest first)
    const [batch] = await sequelize.query(`
      SELECT batch_id, quantity 
      FROM Stock_Batch 
      WHERE location_id = ? 
        AND product_id = ? 
        AND batch_status = 'ACTIVE'
        AND quantity >= ?
      ORDER BY expiry_date ASC, received_date ASC
      LIMIT 1
    `, {
      replacements: [location[0].location_id, productId, quantity],
      transaction
    });
    
    if (batch.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for this product'
      });
    }
    
    // Update the batch quantity
    await sequelize.query(`
      UPDATE Stock_Batch
      SET quantity = quantity - ?,
          updated_at = NOW()
      WHERE batch_id = ?
    `, {
      replacements: [quantity, batch[0].batch_id],
      transaction
    });
    
    // Log stock movement
    await sequelize.query(`
      INSERT INTO Stock_Movement
      (product_id, batch_id, from_location_id, quantity_change, movement_type, reference_id, created_by, created_at)
      VALUES (?, ?, ?, ?, 'SALE', ?, ?, NOW())
    `, {
      replacements: [productId, batch[0].batch_id, location[0].location_id, -quantity, orderId || null, employeeId],
      transaction
    });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Van stock updated successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update van stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update van stock'
    });
  }
};