const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RoutePlan = sequelize.define('RoutePlan', {
  plan_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  planned_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  requested_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employee',
      key: 'employee_id'
    }
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'employee',
      key: 'employee_id'
    }
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'route_plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = RoutePlan;