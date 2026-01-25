// backend/controllers/productController.js
const { sequelize } = require('../config/database');

// @desc    Get all products with stock information
// @route   GET /api/products
// @access  Private
exports.getAllProducts = async (req, res) => {
  try {
    const [products] = await sequelize.query(`
      SELECT 
        p.*,
        m.name as manufacturer_name,
        COALESCE(SUM(CASE WHEN sl.location_type = 'STORE' THEN sb.quantity ELSE 0 END), 0) as store_stock,
        COALESCE(SUM(CASE WHEN sl.location_type = 'VAN' THEN sb.quantity ELSE 0 END), 0) as van_stock,
        COALESCE(SUM(sb.quantity), 0) as total_stock,
        MIN(CASE WHEN sb.batch_status = 'ACTIVE' THEN sb.expiry_date END) as nearest_expiry
      FROM Product p
      LEFT JOIN Manufacturer m ON p.manufacturer_id = m.manufacturer_id
      LEFT JOIN Stock_Batch sb ON p.product_id = sb.product_id AND sb.batch_status = 'ACTIVE'
      LEFT JOIN Stock_Location sl ON sb.location_id = sl.location_id
      WHERE p.is_active = true
      GROUP BY p.product_id
      ORDER BY p.product_name
    `);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single product with detailed stock info
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res) => {
  try {
    const [product] = await sequelize.query(`
      SELECT 
        p.*,
        m.name as manufacturer_name,
        m.contact_person,
        m.phone as manufacturer_phone
      FROM Product p
      LEFT JOIN Manufacturer m ON p.manufacturer_id = m.manufacturer_id
      WHERE p.product_id = ? AND p.is_active = true
    `, {
      replacements: [req.params.id]
    });

    if (!product || product.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get batch details
    const [batches] = await sequelize.query(`
      SELECT 
        sb.*,
        sl.location_type,
        sl.location_name
      FROM Stock_Batch sb
      JOIN Stock_Location sl ON sb.location_id = sl.location_id
      WHERE sb.product_id = ? AND sb.batch_status = 'ACTIVE'
      ORDER BY sb.expiry_date ASC
    `, {
      replacements: [req.params.id]
    });

    res.status(200).json({
      success: true,
      data: {
        ...product[0],
        batches
      }
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
};

// @desc    Get products with low stock
// @route   GET /api/products/low-stock
// @access  Private
exports.getLowStockProducts = async (req, res) => {
  try {
    const [products] = await sequelize.query(`
      SELECT 
        p.*,
        COALESCE(SUM(sb.quantity), 0) as total_stock,
        p.low_stock_threshold
      FROM Product p
      LEFT JOIN Stock_Batch sb ON p.product_id = sb.product_id AND sb.batch_status = 'ACTIVE'
      WHERE p.is_active = true
      GROUP BY p.product_id
      HAVING total_stock < p.low_stock_threshold
      ORDER BY total_stock ASC
    `);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock products'
    });
  }
};

// @desc    Get products expiring soon (within 30 days)
// @route   GET /api/products/expiring
// @access  Private
exports.getExpiringProducts = async (req, res) => {
  try {
    const daysThreshold = req.query.days || 30;

    const [products] = await sequelize.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.product_code,
        sb.batch_id,
        sb.batch_number,
        sb.quantity,
        sb.expiry_date,
        sl.location_type,
        sl.location_name,
        DATEDIFF(sb.expiry_date, CURDATE()) as days_to_expiry
      FROM Product p
      JOIN Stock_Batch sb ON p.product_id = sb.product_id
      JOIN Stock_Location sl ON sb.location_id = sl.location_id
      WHERE sb.batch_status = 'ACTIVE'
        AND sb.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND sb.expiry_date >= CURDATE()
      ORDER BY sb.expiry_date ASC, p.product_name
    `, {
      replacements: [daysThreshold]
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get expiring products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring products'
    });
  }
};

// @desc    Get products that have expired
// @route   GET /api/products/expired
// @access  Private
exports.getExpiredProducts = async (req, res) => {
  try {
    const [products] = await sequelize.query(`
      SELECT 
        p.product_id,
        p.product_name,
        p.product_code,
        sb.batch_id,
        sb.batch_number,
        sb.quantity,
        sb.expiry_date,
        sl.location_type,
        sl.location_name,
        DATEDIFF(CURDATE(), sb.expiry_date) as days_expired
      FROM Product p
      JOIN Stock_Batch sb ON p.product_id = sb.product_id
      JOIN Stock_Location sl ON sb.location_id = sl.location_id
      WHERE sb.batch_status = 'ACTIVE'
        AND sb.expiry_date < CURDATE()
      ORDER BY sb.expiry_date ASC, p.product_name
    `);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get expired products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expired products'
    });
  }
};

// @desc    Create new product (Owner only)
// @route   POST /api/products
// @access  Private (Owner)
exports.createProduct = async (req, res) => {
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

    // Check if product code already exists
    if (product_code) {
      const [existing] = await sequelize.query(`
        SELECT product_id FROM Product WHERE product_code = ?
      `, {
        replacements: [product_code]
      });

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Product code already exists'
        });
      }
    }

    // Insert product
    const [result] = await sequelize.query(`
      INSERT INTO Product 
      (product_name, product_code, product_description, unit_price, low_stock_threshold, manufacturer_id, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        product_name,
        product_code || null,
        product_description || null,
        unit_price,
        low_stock_threshold || 10,
        manufacturer_id,
        req.user.id,
        req.user.id
      ]
    });

    // Get created product
    const [product] = await sequelize.query(`
      SELECT p.*, m.name as manufacturer_name
      FROM Product p
      LEFT JOIN Manufacturer m ON p.manufacturer_id = m.manufacturer_id
      WHERE p.product_id = ?
    `, {
      replacements: [result]
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update product (Owner only)
// @route   PUT /api/products/:id
// @access  Private (Owner)
exports.updateProduct = async (req, res) => {
  try {
    const { 
      product_name, 
      product_description, 
      unit_price, 
      low_stock_threshold 
    } = req.body;

    // Check if product exists
    const [existing] = await sequelize.query(`
      SELECT product_id FROM Product WHERE product_id = ? AND is_active = true
    `, {
      replacements: [req.params.id]
    });

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (product_name) {
      updates.push('product_name = ?');
      values.push(product_name);
    }
    if (product_description !== undefined) {
      updates.push('product_description = ?');
      values.push(product_description);
    }
    if (unit_price) {
      updates.push('unit_price = ?');
      values.push(unit_price);
    }
    if (low_stock_threshold !== undefined) {
      updates.push('low_stock_threshold = ?');
      values.push(low_stock_threshold);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push('updated_by = ?');
    values.push(req.user.id);
    values.push(req.params.id);

    await sequelize.query(`
      UPDATE Product
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE product_id = ?
    `, {
      replacements: values
    });

    // Get updated product
    const [product] = await sequelize.query(`
      SELECT p.*, m.name as manufacturer_name
      FROM Product p
      LEFT JOIN Manufacturer m ON p.manufacturer_id = m.manufacturer_id
      WHERE p.product_id = ?
    `, {
      replacements: [req.params.id]
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
};