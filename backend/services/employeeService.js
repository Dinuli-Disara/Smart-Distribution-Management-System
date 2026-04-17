const Employee = require('../models/Employee');
const DeliveryArea = require('../models/DeliveryArea');
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
      include: [
        {
          model: DeliveryArea,
          as: 'area',
          attributes: ['area_id', 'area_name'],
          required: false
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
          model: DeliveryArea,
          as: 'area',
          attributes: ['area_id', 'area_name'],
          required: false
        }
      ],
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

    // If role is Sales Representative and area_id is provided, check if area is available
    if (data.role === 'Sales Representative' && data.area_id) {
      const existingAssignment = await Employee.findOne({
        where: {
          area_id: data.area_id,
          role: 'Sales Representative',
          is_active: true
        }
      });

      if (existingAssignment) {
        throw new Error('This area is already assigned to another sales representative');
      }
    }

    const employee = await Employee.create({
      ...data,
      created_by: createdBy,
      updated_by: createdBy
    });

    return await this.getEmployeeById(employee.employee_id);
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

    // If role is being changed to non-sales, remove area_id
    if (data.role && data.role !== 'Sales Representative') {
      data.area_id = null;
    }

    // If area is being assigned to a sales rep, check if it's available
    if (data.area_id && employee.role === 'Sales Representative') {
      const existingAssignment = await Employee.findOne({
        where: {
          area_id: data.area_id,
          employee_id: { [Op.ne]: id },
          role: 'Sales Representative',
          is_active: true
        }
      });

      if (existingAssignment) {
        throw new Error('This area is already assigned to another sales representative');
      }
    }

    // Update fields
    const updateData = {
      updated_by: updatedBy,
      ...data
    };

    // Remove any fields that shouldn't be updated directly
    delete updateData.employee_id;
    delete updateData.created_by;
    delete updateData.created_at;
    delete updateData.updated_at;
    delete updateData.password;
    delete updateData.password_reset_token;
    delete updateData.password_reset_expires;

    await employee.update(updateData);

    return await this.getEmployeeById(id);
  }

  // Deactivate employee
  async deactivateEmployee(id, updatedBy) {
    const employee = await Employee.findByPk(id);

    if (!employee) {
      throw new Error('Employee not found');
    }

    await employee.update({
      is_active: false,
      updated_by: updatedBy
    });

    return await this.getEmployeeById(id);
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

    return await this.getEmployeeById(id);
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