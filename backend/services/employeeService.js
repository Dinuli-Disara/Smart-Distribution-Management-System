// backend/services/employeeService.js
const Employee = require('../models/Employee');
const DeliveryRoute = require('../models/DeliveryRoute');
const { Op } = require('sequelize');

class EmployeeService {
  // Get all employees
  async getAllEmployees(filters = {}) {
    const where = {};
    const DeliveryRoute = require('../models/DeliveryRoute');

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
      include: [
        {
          model: DeliveryRoute,
          as: 'route',
          attributes: ['route_id', 'route_name', 'area_id']
        }
      ],
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    return employees;
  }

  // Get employee by ID
  async getEmployeeById(id) {
    const employee = await Employee.findByPk(id, {
      include: [
        {
          model: DeliveryRoute,
          as: 'route',
          attributes: ['route_id', 'route_name', 'area_id']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return employee;
  }

  // Update employee
  async updateEmployee(id, data, updatedBy) {
    console.log('EmployeeService.updateEmployee called with:', { id, data, updatedBy });

    const employee = await Employee.findByPk(id);
    console.log('Found employee:', employee ? employee.toJSON() : null);

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check if username is being changed and already exists
    if (data.username && data.username !== employee.username) {
      console.log('Checking username uniqueness:', data.username);
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
      console.log('Checking email uniqueness:', data.email);
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

    // If role is being changed to non-sales, remove route_id
    if (data.role && data.role !== 'Sales Representative') {
      data.route_id = null;
    }

    // If route is being assigned to a sales rep, check if it's available
    if (data.route_id && employee.role === 'Sales Representative') {
      const existingAssignment = await Employee.findOne({
        where: {
          route_id: data.route_id,
          employee_id: { [Op.ne]: id },
          role: 'Sales Representative',
          is_active: true
        }
      });

      if (existingAssignment) {
        throw new Error('This route is already assigned to another sales representative');
      }
    }

    // Update fields - INCLUDE ALL FIELDS FROM data
    const updateData = {
      updated_by: updatedBy,
      ...data // This will include all fields from data
    };

    // Remove any fields that shouldn't be updated directly
    delete updateData.employee_id;
    delete updateData.created_by;
    delete updateData.created_at;
    delete updateData.updated_at;
    delete updateData.password; // Password should be changed through separate endpoint
    delete updateData.password_reset_token;
    delete updateData.password_reset_expires;

    console.log('Updating with data:', updateData);

    await employee.update(updateData);

    // Fetch fresh data with route info
    const DeliveryRoute = require('../models/DeliveryRoute');
    const updatedEmployee = await Employee.findByPk(id, {
      include: [
        {
          model: DeliveryRoute,
          as: 'route',
          attributes: ['route_id', 'route_name', 'area_id']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    console.log('Updated employee:', updatedEmployee.toJSON());
    return updatedEmployee.toJSON();
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