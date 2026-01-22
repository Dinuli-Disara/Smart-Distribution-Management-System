// backend/services/customerService.js
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

class CustomerService {
  // Get all customers
  async getAllCustomers(filters = {}) {
    const where = {};
    
    // Filter by route
    if (filters.route_id) {
      where.route_id = filters.route_id;
    }
    
    // Filter by loyalty level
    if (filters.loyalty_level_id) {
      where.loyalty_level_id = filters.loyalty_level_id;
    }
    
    // Search by name, contact, or email
    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${filters.search}%` } },
        { contact: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    const [customers] = await sequelize.query(`
      SELECT 
        c.*,
        ll.level_name,
        ll.discount_percentage,
        dr.route_name,
        da.area_name,
        COUNT(DISTINCT o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        COALESCE(SUM(CASE WHEN o.payment_status != 'PAID' THEN o.total_amount - COALESCE(paid.total_paid, 0) ELSE 0 END), 0) as outstanding_balance
      FROM Customer c
      LEFT JOIN Loyalty_Level ll ON c.loyalty_level_id = ll.level_id
      LEFT JOIN Delivery_Route dr ON c.route_id = dr.route_id
      LEFT JOIN Delivery_Area da ON dr.area_id = da.area_id
      LEFT JOIN \`Order\` o ON c.customer_id = o.customer_id
      LEFT JOIN (
        SELECT order_id, SUM(amount) as total_paid
        FROM Customer_Payment
        GROUP BY order_id
      ) paid ON o.order_id = paid.order_id
      ${Object.keys(where).length > 0 ? 'WHERE ' + this.buildWhereClause(where) : ''}
      GROUP BY c.customer_id
      ORDER BY c.created_at DESC
    `);

    return customers;
  }

  // Helper to build WHERE clause
  buildWhereClause(where) {
    const conditions = [];
    
    if (where.route_id) {
      conditions.push(`c.route_id = ${where.route_id}`);
    }
    
    if (where.loyalty_level_id) {
      conditions.push(`c.loyalty_level_id = ${where.loyalty_level_id}`);
    }
    
    if (where[Op.or]) {
      const searchConditions = where[Op.or].map(condition => {
        const field = Object.keys(condition)[0];
        const value = condition[field][Op.like].replace(/%/g, '');
        return `c.${field} LIKE '%${value}%'`;
      }).join(' OR ');
      conditions.push(`(${searchConditions})`);
    }
    
    return conditions.join(' AND ');
  }

  // Get customer by ID with details
  async getCustomerById(id) {
    const [customers] = await sequelize.query(`
      SELECT 
        c.*,
        ll.level_name,
        ll.discount_percentage,
        ll.minimum_points,
        ll.maximum_points,
        dr.route_name,
        da.area_name,
        COUNT(DISTINCT o.order_id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        COALESCE(SUM(CASE WHEN o.payment_status != 'PAID' THEN o.total_amount - COALESCE(paid.total_paid, 0) ELSE 0 END), 0) as outstanding_balance
      FROM Customer c
      LEFT JOIN Loyalty_Level ll ON c.loyalty_level_id = ll.level_id
      LEFT JOIN Delivery_Route dr ON c.route_id = dr.route_id
      LEFT JOIN Delivery_Area da ON dr.area_id = da.area_id
      LEFT JOIN \`Order\` o ON c.customer_id = o.customer_id
      LEFT JOIN (
        SELECT order_id, SUM(amount) as total_paid
        FROM Customer_Payment
        GROUP BY order_id
      ) paid ON o.order_id = paid.order_id
      WHERE c.customer_id = ?
      GROUP BY c.customer_id
    `, {
      replacements: [id]
    });

    if (!customers || customers.length === 0) {
      throw new Error('Customer not found');
    }

    return customers[0];
  }

  // Create new customer
  async createCustomer(data) {
    // Check if contact already exists
    if (data.contact) {
      const [existing] = await sequelize.query(`
        SELECT customer_id FROM Customer WHERE contact = ?
      `, {
        replacements: [data.contact]
      });

      if (existing.length > 0) {
        throw new Error('Contact number already exists');
      }
    }

    // Check if email already exists
    if (data.email) {
      const [existing] = await sequelize.query(`
        SELECT customer_id FROM Customer WHERE email = ?
      `, {
        replacements: [data.email]
      });

      if (existing.length > 0) {
        throw new Error('Email already exists');
      }
    }

    // Insert customer
    const [result] = await sequelize.query(`
      INSERT INTO Customer (name, contact, email, address, route_id, loyalty_points, loyalty_level_id, username, password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        data.name,
        data.contact || null,
        data.email || null,
        data.address || null,
        data.route_id || null,
        0, // Initial loyalty points
        1, // Default loyalty level (Blue)
        data.username || null,
        data.password || null
      ]
    });

    return await this.getCustomerById(result);
  }

  // Update customer
  async updateCustomer(id, data) {
    const customer = await this.getCustomerById(id);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check if contact is being changed and already exists
    if (data.contact && data.contact !== customer.contact) {
      const [existing] = await sequelize.query(`
        SELECT customer_id FROM Customer WHERE contact = ? AND customer_id != ?
      `, {
        replacements: [data.contact, id]
      });

      if (existing.length > 0) {
        throw new Error('Contact number already exists');
      }
    }

    // Build update query
    const updates = [];
    const values = [];

    if (data.name) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.contact !== undefined) {
      updates.push('contact = ?');
      values.push(data.contact);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.address !== undefined) {
      updates.push('address = ?');
      values.push(data.address);
    }
    if (data.route_id !== undefined) {
      updates.push('route_id = ?');
      values.push(data.route_id);
    }

    if (updates.length === 0) {
      return customer;
    }

    values.push(id);

    await sequelize.query(`
      UPDATE Customer 
      SET ${updates.join(', ')}, modified_at = NOW()
      WHERE customer_id = ?
    `, {
      replacements: values
    });

    return await this.getCustomerById(id);
  }

  // Update loyalty points and level
  async updateLoyaltyPoints(customerId, points) {
    await sequelize.query(`
      UPDATE Customer 
      SET loyalty_points = loyalty_points + ?
      WHERE customer_id = ?
    `, {
      replacements: [points, customerId]
    });

    // Get updated points
    const [result] = await sequelize.query(`
      SELECT loyalty_points FROM Customer WHERE customer_id = ?
    `, {
      replacements: [customerId]
    });

    const totalPoints = result[0].loyalty_points;

    // Update loyalty level based on points
    await sequelize.query(`
      UPDATE Customer c
      SET loyalty_level_id = (
        SELECT level_id 
        FROM Loyalty_Level 
        WHERE ? >= minimum_points AND ? <= maximum_points
        LIMIT 1
      )
      WHERE customer_id = ?
    `, {
      replacements: [totalPoints, totalPoints, customerId]
    });

    return await this.getCustomerById(customerId);
  }

  // Get customer order history
  async getCustomerOrders(customerId) {
    const [orders] = await sequelize.query(`
      SELECT 
        o.*,
        e.name as created_by_name,
        COUNT(oi.order_item_id) as total_items,
        COALESCE(SUM(cp.amount), 0) as total_paid,
        o.total_amount - COALESCE(SUM(cp.amount), 0) as balance
      FROM \`Order\` o
      LEFT JOIN Employee e ON o.created_by_employee_id = e.employee_id
      LEFT JOIN Order_Items oi ON o.order_id = oi.order_id
      LEFT JOIN Customer_Payment cp ON o.order_id = cp.order_id
      WHERE o.customer_id = ?
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
    `, {
      replacements: [customerId]
    });

    return orders;
  }

  // Get customer payment history
  async getCustomerPayments(customerId) {
    const [payments] = await sequelize.query(`
      SELECT 
        cp.*,
        o.order_date,
        o.total_amount as order_amount
      FROM Customer_Payment cp
      LEFT JOIN \`Order\` o ON cp.order_id = o.order_id
      WHERE cp.customer_id = ?
      ORDER BY cp.payment_date DESC
    `, {
      replacements: [customerId]
    });

    return payments;
  }

  // Get customer statistics
  async getCustomerStats() {
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN loyalty_level_id = 1 THEN 1 END) as blue_customers,
        COUNT(CASE WHEN loyalty_level_id = 2 THEN 1 END) as bronze_customers,
        COUNT(CASE WHEN loyalty_level_id = 3 THEN 1 END) as silver_customers,
        COUNT(CASE WHEN loyalty_level_id = 4 THEN 1 END) as gold_customers,
        COUNT(CASE WHEN loyalty_level_id = 5 THEN 1 END) as platinum_customers
      FROM Customer
    `);

    return stats[0];
  }
}

module.exports = new CustomerService();