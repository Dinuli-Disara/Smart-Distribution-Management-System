// backend/controllers/preOrderController.js
const { sequelize } = require('../config/database');

// @desc    Get all pre-orders (for sales rep)
// @route   GET /api/pre-orders
// @access  Private (Sales Rep, Clerk, Owner)
exports.getPreOrders = async (req, res) => {
  try {
    const [preOrders] = await sequelize.query(`
      SELECT 
        po.pre_order_id,
        po.pre_order_number,
        po.customer_id,
        c.name as customer_name,
        c.shop_name,
        po.total_amount,
        po.discount_percentage,
        po.net_amount,
        po.status,
        po.notes,
        po.expected_delivery_date,
        po.created_at,
        po.updated_at
      FROM Pre_Order po
      LEFT JOIN Customer c ON po.customer_id = c.customer_id
      ORDER BY po.created_at DESC
    `);
    
    // Get items for each pre-order
    for (let order of preOrders) {
      const [items] = await sequelize.query(`
        SELECT 
          poi.pre_order_item_id,
          poi.product_id,
          p.product_name,
          p.product_code,
          poi.quantity,
          poi.price,
          (poi.quantity * poi.price) as total
        FROM Pre_Order_Item poi
        LEFT JOIN Product p ON poi.product_id = p.product_id
        WHERE poi.pre_order_id = ?
      `, {
        replacements: [order.pre_order_id]
      });
      order.items = items;
    }
    
    res.status(200).json({
      success: true,
      data: preOrders
    });
  } catch (error) {
    console.error('Get pre-orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pre-orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get pre-orders for a specific customer
// @route   GET /api/pre-orders/customer/:customerId
// @access  Private (Customer)
exports.getCustomerPreOrders = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const [preOrders] = await sequelize.query(`
      SELECT 
        po.pre_order_id,
        po.pre_order_number,
        po.total_amount,
        po.discount_percentage,
        po.net_amount,
        po.status,
        po.notes,
        po.expected_delivery_date,
        po.created_at,
        po.updated_at
      FROM Pre_Order po
      WHERE po.customer_id = ?
      ORDER BY po.created_at DESC
    `, {
      replacements: [customerId]
    });
    
    // Get items for each pre-order
    for (let order of preOrders) {
      const [items] = await sequelize.query(`
        SELECT 
          poi.pre_order_item_id,
          poi.product_id,
          p.product_name,
          p.product_code,
          poi.quantity,
          poi.price,
          (poi.quantity * poi.price) as total
        FROM Pre_Order_Item poi
        LEFT JOIN Product p ON poi.product_id = p.product_id
        WHERE poi.pre_order_id = ?
      `, {
        replacements: [order.pre_order_id]
      });
      order.items = items;
    }
    
    res.status(200).json({
      success: true,
      data: preOrders
    });
  } catch (error) {
    console.error('Get customer pre-orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pre-orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single pre-order by ID
// @route   GET /api/pre-orders/:id
// @access  Private
exports.getPreOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [preOrders] = await sequelize.query(`
      SELECT 
        po.pre_order_id,
        po.pre_order_number,
        po.customer_id,
        c.name as customer_name,
        c.shop_name,
        c.address,
        c.contact,
        po.total_amount,
        po.discount_percentage,
        po.net_amount,
        po.status,
        po.notes,
        po.expected_delivery_date,
        po.created_at,
        po.updated_at
      FROM Pre_Order po
      LEFT JOIN Customer c ON po.customer_id = c.customer_id
      WHERE po.pre_order_id = ?
    `, {
      replacements: [id]
    });
    
    if (preOrders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pre-order not found'
      });
    }
    
    const [items] = await sequelize.query(`
      SELECT 
        poi.pre_order_item_id,
        poi.product_id,
        p.product_name,
        p.product_code,
        p.unit_price as current_price,
        poi.quantity,
        poi.price,
        (poi.quantity * poi.price) as total
      FROM Pre_Order_Item poi
      LEFT JOIN Product p ON poi.product_id = p.product_id
      WHERE poi.pre_order_id = ?
    `, {
      replacements: [id]
    });
    
    preOrders[0].items = items;
    
    res.status(200).json({
      success: true,
      data: preOrders[0]
    });
  } catch (error) {
    console.error('Get pre-order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pre-order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new pre-order
// @route   POST /api/pre-orders
// @access  Private (Customer)
exports.createPreOrder = async (req, res) => {
  try {
    const { customer_id, items, expected_delivery_date, notes } = req.body;
    
    // Validation
    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }
    
    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.price) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have product_id, quantity, and price'
        });
      }
      totalAmount += item.price * item.quantity;
    }
    
    // Get customer's discount percentage
    const [customer] = await sequelize.query(`
      SELECT c.customer_id, ll.discount_percentage
      FROM Customer c
      LEFT JOIN Loyalty_Level ll ON c.loyalty_level_id = ll.level_id
      WHERE c.customer_id = ?
    `, {
      replacements: [customer_id]
    });
    
    const discountPercentage = customer[0]?.discount_percentage || 0;
    const netAmount = totalAmount * (1 - discountPercentage / 100);
    
    // Generate pre-order number
    const [lastOrder] = await sequelize.query(`
      SELECT pre_order_number FROM Pre_Order 
      WHERE pre_order_number LIKE 'PO-%' 
      ORDER BY pre_order_id DESC LIMIT 1
    `);
    
    let nextNumber = 1;
    if (lastOrder.length > 0) {
      const lastNumber = parseInt(lastOrder[0].pre_order_number.split('-')[1]);
      nextNumber = lastNumber + 1;
    }
    const preOrderNumber = `PO-${String(nextNumber).padStart(6, '0')}`;
    
    // Create pre-order
    const [result] = await sequelize.query(`
      INSERT INTO Pre_Order (
        pre_order_number,
        customer_id, 
        total_amount, 
        discount_percentage, 
        net_amount, 
        expected_delivery_date,
        notes,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())
    `, {
      replacements: [preOrderNumber, customer_id, totalAmount, discountPercentage, netAmount, expected_delivery_date || null, notes || null]
    });
    
    const preOrderId = result;
    
    // Add items
    for (const item of items) {
      await sequelize.query(`
        INSERT INTO Pre_Order_Item (
          pre_order_id,
          product_id,
          quantity,
          price
        ) VALUES (?, ?, ?, ?)
      `, {
        replacements: [preOrderId, item.product_id, item.quantity, item.price]
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Pre-order created successfully',
      data: {
        pre_order_id: preOrderId,
        pre_order_number: preOrderNumber
      }
    });
  } catch (error) {
    console.error('Create pre-order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pre-order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update pre-order status
// @route   PUT /api/pre-orders/:id/status
// @access  Private (Sales Rep, Clerk, Owner)
exports.updatePreOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const validStatuses = ['PENDING', 'CONFIRMED', 'DECLINED', 'PROCESSING', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Get current pre-order
    const [preOrder] = await sequelize.query(`
      SELECT status FROM Pre_Order WHERE pre_order_id = ?
    `, {
      replacements: [id]
    });
    
    if (preOrder.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pre-order not found'
      });
    }
    
    // Build update query
    let updateQuery = `UPDATE Pre_Order SET status = ?, updated_at = NOW()`;
    const replacements = [status];
    
    if (notes) {
      updateQuery = `UPDATE Pre_Order SET status = ?, notes = CONCAT(IFNULL(notes, ''), '\\n', ?), updated_at = NOW()`;
      replacements.push(notes);
    }
    
    updateQuery += ` WHERE pre_order_id = ?`;
    replacements.push(id);
    
    await sequelize.query(updateQuery, {
      replacements
    });
    
    // If status is DELIVERED, create an actual order from this pre-order
    if (status === 'DELIVERED') {
      await convertPreOrderToOrder(id);
    }
    
    res.status(200).json({
      success: true,
      message: `Pre-order status updated to ${status}`
    });
  } catch (error) {
    console.error('Update pre-order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pre-order status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to convert pre-order to actual order
async function convertPreOrderToOrder(preOrderId) {
  try {
    // Get pre-order details
    const [preOrder] = await sequelize.query(`
      SELECT * FROM Pre_Order WHERE pre_order_id = ?
    `, {
      replacements: [preOrderId]
    });
    
    if (preOrder.length === 0) return;
    
    // Get pre-order items
    const [items] = await sequelize.query(`
      SELECT * FROM Pre_Order_Item WHERE pre_order_id = ?
    `, {
      replacements: [preOrderId]
    });
    
    // Generate order number
    const [lastOrder] = await sequelize.query(`
      SELECT order_number FROM \`Order\` 
      WHERE order_number LIKE 'ORD-%' 
      ORDER BY order_id DESC LIMIT 1
    `);
    
    let nextNumber = 1;
    if (lastOrder.length > 0) {
      const lastNumber = parseInt(lastOrder[0].order_number.split('-')[1]);
      nextNumber = lastNumber + 1;
    }
    const orderNumber = `ORD-${String(nextNumber).padStart(6, '0')}`;
    
    // Create order
    const [orderResult] = await sequelize.query(`
      INSERT INTO \`Order\` (
        order_number,
        customer_id,
        order_date,
        total_amount,
        discount_amount,
        net_amount,
        payment_status,
        order_status,
        pre_order_id,
        created_at
      ) VALUES (?, ?, NOW(), ?, ?, ?, 'PENDING', 'PENDING', ?, NOW())
    `, {
      replacements: [
        orderNumber,
        preOrder[0].customer_id,
        preOrder[0].total_amount,
        preOrder[0].total_amount - preOrder[0].net_amount,
        preOrder[0].net_amount,
        preOrderId
      ]
    });
    
    const orderId = orderResult;
    
    // Create order items
    for (const item of items) {
      await sequelize.query(`
        INSERT INTO Order_Items (
          order_id,
          product_id,
          quantity,
          price,
          total
        ) VALUES (?, ?, ?, ?, ?)
      `, {
        replacements: [orderId, item.product_id, item.quantity, item.price, item.quantity * item.price]
      });
    }
    
    console.log(`✅ Pre-order ${preOrderId} converted to order ${orderId}`);
  } catch (error) {
    console.error('Error converting pre-order to order:', error);
  }
}