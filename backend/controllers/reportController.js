// backend/controllers/reportController.js
const { sequelize } = require('../config/database');

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private
exports.getSalesReport = async (req, res) => {
  try {
    const { start_date, end_date, employee_id, customer_id } = req.query;

    const conditions = [];
    const replacements = [];

    if (start_date) {
      conditions.push('o.order_date >= ?');
      replacements.push(start_date);
    }
    if (end_date) {
      conditions.push('o.order_date <= ?');
      replacements.push(end_date);
    }
    if (employee_id) {
      conditions.push('o.employee_id = ?');
      replacements.push(employee_id);
    }
    if (customer_id) {
      conditions.push('o.customer_id = ?');
      replacements.push(customer_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [sales] = await sequelize.query(`
      SELECT 
        DATE(o.order_date) as sale_date,
        COUNT(DISTINCT o.order_id) as total_orders,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        SUM(o.subtotal) as gross_sales,
        SUM(o.discount_amount) as total_discounts,
        SUM(o.total_amount) as net_sales,
        COALESCE(SUM(cp.amount), 0) as total_collected
      FROM \`Order\` o
      LEFT JOIN Customer_Payment cp ON o.order_id = cp.order_id
      ${whereClause}
      GROUP BY DATE(o.order_date)
      ORDER BY sale_date DESC
    `, {
      replacements
    });

    // Get summary
    const [summary] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT o.order_id) as total_orders,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        SUM(o.subtotal) as gross_sales,
        SUM(o.discount_amount) as total_discounts,
        SUM(o.total_amount) as net_sales,
        COALESCE(SUM(cp.amount), 0) as total_collected,
        SUM(o.total_amount) - COALESCE(SUM(cp.amount), 0) as outstanding
      FROM \`Order\` o
      LEFT JOIN Customer_Payment cp ON o.order_id = cp.order_id
      ${whereClause}
    `, {
      replacements
    });

    res.status(200).json({
      success: true,
      data: {
        summary: summary[0],
        daily_sales: sales
      }
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sales report'
    });
  }
};

// @desc    Get product-wise sales report
// @route   GET /api/reports/product-sales
// @access  Private
exports.getProductSalesReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const conditions = [];
    const replacements = [];

    if (start_date) {
      conditions.push('o.order_date >= ?');
      replacements.push(start_date);
    }
    if (end_date) {
      conditions.push('o.order_date <= ?');
      replacements.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [productSales] = await sequelize.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.product_code,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.subtotal) as total_revenue,
        AVG(oi.unit_price) as avg_selling_price,
        COUNT(DISTINCT o.order_id) as order_count,
        COUNT(DISTINCT o.customer_id) as unique_customers
      FROM Order_Items oi
      JOIN Product p ON oi.product_id = p.product_id
      JOIN \`Order\` o ON oi.order_id = o.order_id
      ${whereClause}
      GROUP BY p.product_id
      ORDER BY total_revenue DESC
    `, {
      replacements
    });

    res.status(200).json({
      success: true,
      count: productSales.length,
      data: productSales
    });
  } catch (error) {
    console.error('Get product sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate product sales report'
    });
  }
};

// @desc    Get route-wise sales report
// @route   GET /api/reports/route-sales
// @access  Private
exports.getRouteSalesReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const conditions = [];
    const replacements = [];

    if (start_date) {
      conditions.push('o.order_date >= ?');
      replacements.push(start_date);
    }
    if (end_date) {
      conditions.push('o.order_date <= ?');
      replacements.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [routeSales] = await sequelize.query(`
      SELECT 
        da.area_id,
        da.area_name,
        dr.route_id,
        dr.route_name,
        COUNT(DISTINCT o.order_id) as total_orders,
        COUNT(DISTINCT o.customer_id) as active_customers,
        SUM(o.total_amount) as total_sales,
        COALESCE(SUM(cp.amount), 0) as total_collected,
        SUM(o.total_amount) - COALESCE(SUM(cp.amount), 0) as outstanding
      FROM Delivery_Area da
      LEFT JOIN Delivery_Route dr ON da.area_id = dr.area_id
      LEFT JOIN Customer c ON dr.route_id = c.route_id
      LEFT JOIN \`Order\` o ON c.customer_id = o.customer_id ${whereClause ? 'AND ' + whereClause.replace('WHERE ', '') : ''}
      LEFT JOIN Customer_Payment cp ON o.order_id = cp.order_id
      ${conditions.length > 0 && !whereClause.includes('o.') ? whereClause : ''}
      GROUP BY dr.route_id
      ORDER BY total_sales DESC
    `, {
      replacements
    });

    res.status(200).json({
      success: true,
      count: routeSales.length,
      data: routeSales
    });
  } catch (error) {
    console.error('Get route sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate route sales report'
    });
  }
};

// @desc    Get employee performance report
// @route   GET /api/reports/employee-performance
// @access  Private (Owner only)
exports.getEmployeePerformanceReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const conditions = [];
    const replacements = [];

    if (start_date) {
      conditions.push('o.order_date >= ?');
      replacements.push(start_date);
    }
    if (end_date) {
      conditions.push('o.order_date <= ?');
      replacements.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [performance] = await sequelize.query(`
      SELECT 
        e.employee_id,
        e.name as employee_name,
        e.role,
        COUNT(DISTINCT o.order_id) as total_orders,
        COUNT(DISTINCT o.customer_id) as unique_customers,
        SUM(o.total_amount) as total_sales,
        AVG(o.total_amount) as avg_order_value,
        COALESCE(SUM(cp.amount), 0) as total_collected
      FROM Employee e
      LEFT JOIN \`Order\` o ON e.employee_id = o.employee_id ${whereClause ? 'AND ' + whereClause.replace('WHERE ', '') : ''}
      LEFT JOIN Customer_Payment cp ON o.order_id = cp.order_id
      WHERE e.role = 'Sales Representative' AND e.is_active = true
      GROUP BY e.employee_id
      ORDER BY total_sales DESC
    `, {
      replacements
    });

    res.status(200).json({
      success: true,
      count: performance.length,
      data: performance
    });
  } catch (error) {
    console.error('Get employee performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate employee performance report'
    });
  }
};

// @desc    Get inventory valuation report
// @route   GET /api/reports/inventory-valuation
// @access  Private
exports.getInventoryValuationReport = async (req, res) => {
  try {
    const [valuation] = await sequelize.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.product_code,
        p.unit_price as current_price,
        COALESCE(SUM(CASE WHEN sl.location_type = 'STORE' THEN sb.quantity ELSE 0 END), 0) as store_qty,
        COALESCE(SUM(CASE WHEN sl.location_type = 'VAN' THEN sb.quantity ELSE 0 END), 0) as van_qty,
        COALESCE(SUM(sb.quantity), 0) as total_qty,
        COALESCE(AVG(sb.price_per_unit), p.unit_price) as avg_cost,
        COALESCE(SUM(sb.quantity * sb.price_per_unit), 0) as inventory_value,
        MIN(sb.expiry_date) as nearest_expiry
      FROM Product p
      LEFT JOIN Stock_Batch sb ON p.product_id = sb.product_id AND sb.batch_status = 'ACTIVE'
      LEFT JOIN Stock_Location sl ON sb.location_id = sl.location_id
      WHERE p.is_active = true
      GROUP BY p.product_id
      ORDER BY inventory_value DESC
    `);

    // Calculate totals
    const totalStoreQty = valuation.reduce((sum, item) => sum + parseInt(item.store_qty || 0), 0);
    const totalVanQty = valuation.reduce((sum, item) => sum + parseInt(item.van_qty || 0), 0);
    const totalValue = valuation.reduce((sum, item) => sum + parseFloat(item.inventory_value || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total_products: valuation.length,
          total_store_qty: totalStoreQty,
          total_van_qty: totalVanQty,
          total_inventory_value: totalValue
        },
        products: valuation
      }
    });
  } catch (error) {
    console.error('Get inventory valuation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory valuation report'
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    // Today's sales
    const [todaySales] = await sequelize.query(`
      SELECT 
        COUNT(order_id) as orders_today,
        COALESCE(SUM(total_amount), 0) as sales_today
      FROM \`Order\`
      WHERE DATE(order_date) = CURDATE()
    `);

    // This month's sales
    const [monthSales] = await sequelize.query(`
      SELECT 
        COUNT(order_id) as orders_this_month,
        COALESCE(SUM(total_amount), 0) as sales_this_month
      FROM \`Order\`
      WHERE YEAR(order_date) = YEAR(CURDATE()) 
        AND MONTH(order_date) = MONTH(CURDATE())
    `);

    // Pending payments
    const [pendingPayments] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT o.customer_id) as customers_with_dues,
        COALESCE(SUM(o.total_amount - COALESCE(paid.amount, 0)), 0) as total_outstanding
      FROM \`Order\` o
      LEFT JOIN (
        SELECT order_id, SUM(amount) as amount
        FROM Customer_Payment
        GROUP BY order_id
      ) paid ON o.order_id = paid.order_id
      WHERE o.payment_status != 'PAID'
    `);

    // Low stock products
    const [lowStock] = await sequelize.query(`
      SELECT COUNT(DISTINCT p.product_id) as low_stock_count
      FROM Product p
      LEFT JOIN Stock_Batch sb ON p.product_id = sb.product_id AND sb.batch_status = 'ACTIVE'
      GROUP BY p.product_id
      HAVING COALESCE(SUM(sb.quantity), 0) < p.low_stock_threshold
    `);

    // Expiring products (next 30 days)
    const [expiringProducts] = await sequelize.query(`
      SELECT COUNT(DISTINCT batch_id) as expiring_batches
      FROM Stock_Batch
      WHERE batch_status = 'ACTIVE'
        AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
    `);

    res.status(200).json({
      success: true,
      data: {
        today: todaySales[0],
        month: monthSales[0],
        payments: pendingPayments[0],
        inventory: {
          low_stock_count: lowStock[0]?.low_stock_count || 0,
          expiring_batches: expiringProducts[0]?.expiring_batches || 0
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};