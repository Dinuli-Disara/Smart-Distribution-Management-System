// backend/controllers/orderController.js
const { sequelize } = require('../config/database');

// @desc    Create new order (for Sales Rep)
// @route   POST /api/orders
// @access  Private (Sales Rep)
exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { customer_id, items } = req.body;
    const employee_id = req.user.id;

    // Validation
    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Customer is required'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Get customer details and loyalty discount
    const [customer] = await sequelize.query(`
      SELECT c.*, ll.discount_percentage
      FROM Customer c
      LEFT JOIN Loyalty_Level ll ON c.loyalty_level_id = ll.level_id
      WHERE c.customer_id = ?
    `, {
      replacements: [customer_id],
      transaction
    });

    if (!customer || customer.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const discountPercentage = customer[0].discount_percentage || 0;

    // Calculate totals and validate products
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const { product_id, quantity } = item;

      if (!product_id || !quantity || quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid item data'
        });
      }

      // Get product details
      const [product] = await sequelize.query(`
        SELECT product_id, product_name, unit_price
        FROM Product
        WHERE product_id = ? AND is_active = true
      `, {
        replacements: [product_id],
        transaction
      });

      if (!product || product.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Product not found`
        });
      }

      const unitPrice = parseFloat(product[0].unit_price);
      const itemSubtotal = unitPrice * quantity;
      subtotal += itemSubtotal;

      processedItems.push({
        product_id,
        quantity,
        unit_price: unitPrice,
        subtotal: itemSubtotal
      });
    }

    // Calculate discount and total
    const discountAmount = (subtotal * discountPercentage) / 100;
    const totalAmount = subtotal - discountAmount;

    // Create order
    const [orderResult] = await sequelize.query(`
      INSERT INTO \`Order\`
      (customer_id, employee_id, order_date, subtotal, discount_amount, total_amount, 
       order_status, payment_status, created_by_employee_id, updated_by)
      VALUES (?, ?, NOW(), ?, ?, ?, 'PENDING', 'UNPAID', ?, ?)
    `, {
      replacements: [
        customer_id,
        employee_id,
        subtotal,
        discountAmount,
        totalAmount,
        employee_id,
        employee_id
      ],
      transaction
    });

    const orderId = orderResult;

    // Create order items
    for (const item of processedItems) {
      await sequelize.query(`
        INSERT INTO Order_Items
        (order_id, product_id, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `, {
        replacements: [
          orderId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.subtotal
        ],
        transaction
      });
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order_id: orderId,
        subtotal: subtotal.toFixed(2),
        discount_amount: discountAmount.toFixed(2),
        total_amount: totalAmount.toFixed(2)
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all orders for sales rep
// @route   GET /api/orders
// @access  Private
exports.getAllOrders = async (req, res) => {
  try {
    const { status, customer_id } = req.query;
    const employee_id = req.user.id;
    
    let whereClause = 'WHERE o.employee_id = ?';
    const replacements = [employee_id];

    if (status) {
      whereClause += ' AND o.order_status = ?';
      replacements.push(status);
    }
    if (customer_id) {
      whereClause += ' AND o.customer_id = ?';
      replacements.push(customer_id);
    }

    const [orders] = await sequelize.query(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.shop_name,
        c.contact as customer_contact,
        COUNT(oi.order_item_id) as item_count,
        COALESCE(SUM(cp.amount), 0) as total_paid,
        o.total_amount - COALESCE(SUM(cp.amount), 0) as balance
      FROM \`Order\` o
      LEFT JOIN Customer c ON o.customer_id = c.customer_id
      LEFT JOIN Order_Items oi ON o.order_id = oi.order_id
      LEFT JOIN Customer_Payment cp ON o.order_id = cp.order_id
      ${whereClause}
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
    `, {
      replacements
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// @desc    Get single order with items
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const [order] = await sequelize.query(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.shop_name,
        c.contact as customer_contact,
        c.address as customer_address,
        e.name as employee_name,
        COALESCE(SUM(cp.amount), 0) as total_paid,
        o.total_amount - COALESCE(SUM(cp.amount), 0) as balance
      FROM \`Order\` o
      LEFT JOIN Customer c ON o.customer_id = c.customer_id
      LEFT JOIN Employee e ON o.employee_id = e.employee_id
      LEFT JOIN Customer_Payment cp ON o.order_id = cp.order_id
      WHERE o.order_id = ?
      GROUP BY o.order_id
    `, {
      replacements: [req.params.id]
    });

    if (!order || order.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order items
    const [items] = await sequelize.query(`
      SELECT 
        oi.*,
        p.product_name,
        p.product_code
      FROM Order_Items oi
      JOIN Product p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, {
      replacements: [req.params.id]
    });

    res.status(200).json({
      success: true,
      data: {
        ...order[0],
        items
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
};