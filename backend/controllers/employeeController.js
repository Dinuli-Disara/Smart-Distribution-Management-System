// backend/controllers/employeeController.js
const employeeService = require('../services/employeeService');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Owner only)
exports.getAllEmployees = async (req, res) => {
  try {
    const { role, is_active, search } = req.query;
    
    const filters = {};
    if (role) filters.role = role;
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (search) filters.search = search;

    const employees = await employeeService.getAllEmployees(filters);

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = async (req, res) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(error.message === 'Employee not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Owner only)
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, contact, role, username, password } = req.body;

    // Validation
    if (!name || !email || !role || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const employee = await employeeService.createEmployee(req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Owner only)
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await employeeService.updateEmployee(
      req.params.id,
      req.body,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(error.message === 'Employee not found' ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Deactivate employee
// @route   PUT /api/employees/:id/deactivate
// @access  Private (Owner only)
exports.deactivateEmployee = async (req, res) => {
  try {
    const employee = await employeeService.deactivateEmployee(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully',
      data: employee
    });
  } catch (error) {
    console.error('Deactivate employee error:', error);
    res.status(error.message === 'Employee not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Activate employee
// @route   PUT /api/employees/:id/activate
// @access  Private (Owner only)
exports.activateEmployee = async (req, res) => {
  try {
    const employee = await employeeService.activateEmployee(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Employee activated successfully',
      data: employee
    });
  } catch (error) {
    console.error('Activate employee error:', error);
    res.status(error.message === 'Employee not found' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get employee statistics
// @route   GET /api/employees/stats
// @access  Private (Owner only)
exports.getEmployeeStats = async (req, res) => {
  try {
    const stats = await employeeService.getEmployeeStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get employee stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee statistics'
    });
  }
};