const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RoutePlanHistory = sequelize.define('RoutePlanHistory', {
  history_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'route_plans',
      key: 'plan_id'
    }
  },
  action: {
    type: DataTypes.ENUM('created', 'updated', 'approved', 'rejected', 'cancelled'),
    allowNull: false
  },
  old_status: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  new_status: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  performed_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employee',
      key: 'employee_id'
    }
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'route_plan_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = RoutePlanHistory;