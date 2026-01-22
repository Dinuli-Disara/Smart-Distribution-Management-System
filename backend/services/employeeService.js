// backend/services/employeeService.js
const Employee = require('../models/Employee');
const { Op } = require('sequelize');

class EmployeeService {
  // Get all employees
  async getAllEmployees(filters = {}) {
    const where = {};
    
    // Filter by role
    if (filters.role) {
      where.role = filters.role;
    }
    
    // Filter by active status
    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }
    
    // Search by name or email
    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } },
        { username: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    const employees = await Employee.findAll({
      where,
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password'] } // Don't send password
    });

    return employees;
  }

  // Get employee by ID
  async getEmployeeById(id) {
    const employee = await Employee.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return employee;
  }

  // Create new employee
  async createEmployee(data, createdBy) {
    // Check if username already exists
    const existingUsername = await Employee.findOne({
      where: { username: data.username }
    });

    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await Employee.findOne({
      where: { email: data.email }
    });

    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Create employee
    const employee = await Employee.create({
      name: data.name,
      email: data.email,
      contact: data.contact,
      role: data.role,
      username: data.username,
      password: data.password, // Will be hashed by model hook
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy
    });

    // Return without password
    const employeeData = employee.toJSON();
    return employeeData;
  }

  // Update employee
  async updateEmployee(id, data, updatedBy) {
    const employee = await Employee.findByPk(id);

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if username is being changed and already exists
    if (data.username && data.username !== employee.username) {
      const existingUsername = await Employee.findOne({
        where: { 
          username: data.username,
          employee_id: { [Op.ne]: id }
        }
      });

      if (existingUsername) {
        throw new Error('Username already exists');
      }
    }

    // Check if email is being changed and already exists
    if (data.email && data.email !== employee.email) {
      const existingEmail = await Employee.findOne({
        where: { 
          email: data.email,
          employee_id: { [Op.ne]: id }
        }
      });

      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Update fields
    const updateData = {
      updated_by: updatedBy
    };

    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.contact) updateData.contact = data.contact;
    if (data.role) updateData.role = data.role;
    if (data.username) updateData.username = data.username;
    if (data.password) updateData.password = data.password; // Will be hashed

    await employee.update(updateData);

    return employee.toJSON();
  }

  // Soft delete (deactivate) employee
  async deactivateEmployee(id, updatedBy) {
    const employee = await Employee.findByPk(id);

    if (!employee) {
      throw new Error('Employee not found');
    }

    await employee.update({
      is_active: false,
      updated_by: updatedBy
    });

    return employee.toJSON();
  }

  // Activate employee
  async activateEmployee(id, updatedBy) {
    const employee = await Employee.findByPk(id);

    if (!employee) {
      throw new Error('Employee not found');
    }

    await employee.update({
      is_active: true,
      updated_by: updatedBy
    });

    return employee.toJSON();
  }

  // Get employee statistics
  async getEmployeeStats() {
    const total = await Employee.count();
    const active = await Employee.count({ where: { is_active: true } });
    const inactive = await Employee.count({ where: { is_active: false } });
    
    const byRole = await Employee.findAll({
      attributes: [
        'role',
        [Employee.sequelize.fn('COUNT', Employee.sequelize.col('employee_id')), 'count']
      ],
      group: ['role'],
      where: { is_active: true }
    });

    return {
      total,
      active,
      inactive,
      byRole: byRole.map(r => ({
        role: r.role,
        count: parseInt(r.get('count'))
      }))
    };
  }
}

module.exports = new EmployeeService();