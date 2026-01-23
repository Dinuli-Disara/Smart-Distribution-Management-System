// backend/controllers/orderController.js
const { sequelize } = require('../config/database');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getAllOrders = async (req, res) => {
  try {
    const { status, customer_id, employee_id } = req.query;
    
    const conditions = [];
    const replacements = [];

    if (status) {
      conditions.push('o.order_status = ?');
      replacements.push(status);
    }
    if (customer_id) {
      conditions.push('o.customer_id = ?');
      replacements.push(customer_id);
    }
    if (employee_id) {
      conditions.push('o.employee_id = ?');
      replacements.push(employee_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [orders] = await sequelize.query(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.contact as customer_contact,
        e.name as employee_name,
        COUNT(oi.order_item_id) as item_count,
        COALESCE(SUM(cp.amount), 0) as total_paid,
        o.total_amount - COALESCE(SUM(cp.amount), 0) as balance
      FROM \`Order\` o
      LEFT JOIN Customer c ON o.customer_id = c.customer_id
      LEFT JOIN Employee e ON o.employee_id = e.employee_id
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

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Sales Rep, Clerk, Owner)
exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { customer_id, items, created_by_type } = req.body;

    // Validation
    if (!customer_id || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customer and items'
      });
    }

    // Get customer loyalty discount
    const [customer] = await sequelize.query(`
      SELECT c.*, ll.discount_percentage
      FROM Customer c
      LEFT JOIN Loyalty_Level ll ON c.loyalty_level_id = ll.level_id
      WHERE c.customer_id = ?
    `, {
      replacements: [customer_id],
      transaction
    });

    if (customer.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const discountPercentage = customer[0].discount_percentage || 0;

    // Calculate totals
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

      // Get product price
      const [product] = await sequelize.query(`
        SELECT product_id, product_name, unit_price
        FROM Product
        WHERE product_id = ? AND is_active = true
      `, {
        replacements: [product_id],
        transaction
      });

      if (product.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Product ID ${product_id} not found`
        });
      }

      const unitPrice = product[0].unit_price;
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
    const createdByCustomerId = created_by_type === 'customer' ? customer_id : null;
    const createdByEmployeeId = created_by_type === 'employee' ? req.user.id : null;

    const [orderResult] = await sequelize.query(`
      INSERT INTO \`Order\`
      (customer_id, employee_id, subtotal, discount_amount, total_amount, order_status, payment_status, created_by_customer_id, created_by_employee_id, updated_by)
      VALUES (?, ?, ?, ?, ?, 'PENDING', 'UNPAID', ?, ?, ?)
    `, {
      replacements: [
        customer_id,
        req.user.id,
        subtotal,
        discountAmount,
        totalAmount,
        createdByCustomerId,
        createdByEmployeeId,
        req.user.id
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
        subtotal,
        discount_amount: discountAmount,
        total_amount: totalAmount
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

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
exports.updateOrderStatus = async (req, res) => {
  try {
    const { order_status } = req.body;

    if (!order_status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide order status'
      });
    }

    // Valid statuses
    const validStatuses = ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    await sequelize.query(`
      UPDATE \`Order\`
      SET order_status = ?, updated_by = ?, updated_at = NOW()
      WHERE order_id = ?
    `, {
      replacements: [order_status, req.user.id, req.params.id]
    });

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
};

// @desc    Generate invoice for order
// @route   POST /api/orders/:id/invoice
// @access  Private
exports.generateInvoice = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if invoice already exists
    const [existing] = await sequelize.query(`
      SELECT invoice_id FROM Invoice WHERE order_id = ?
    `, {
      replacements: [req.params.id],
      transaction
    });

    if (existing.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invoice already exists for this order'
      });
    }

    // Get order details
    const [order] = await sequelize.query(`
      SELECT * FROM \`Order\` WHERE order_id = ?
    `, {
      replacements: [req.params.id],
      transaction
    });

    if (order.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Create invoice
    const [invoiceResult] = await sequelize.query(`
      INSERT INTO Invoice (order_id, created_by)
      VALUES (?, ?)
    `, {
      replacements: [req.params.id, req.user.id],
      transaction
    });

    // Update order status to confirmed
    await sequelize.query(`
      UPDATE \`Order\`
      SET order_status = 'CONFIRMED', updated_by = ?
      WHERE order_id = ?
    `, {
      replacements: [req.user.id, req.params.id],
      transaction
    });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: {
        invoice_id: invoiceResult
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice'
    });
  }
};