const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RoutePlanDetail = sequelize.define('RoutePlanDetail', {
  detail_id: {
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
  area_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'delivery_area',
      key: 'area_id'
    }
  },
  route_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'delivery_route',
      key: 'route_id'
    }
  },
  van_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'van',
      key: 'van_id'
    }
  }
}, {
  tableName: 'route_plan_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = RoutePlanDetail;