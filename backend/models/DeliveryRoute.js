// backend/models/DeliveryRoute.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DeliveryRoute = sequelize.define('DeliveryRoute', {
  route_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  area_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'delivery_area',
      key: 'area_id'
    }
  },
  route_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'delivery_route',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

DeliveryRoute.associate = (models) => {
  DeliveryRoute.belongsTo(models.DeliveryArea, {
    foreignKey: 'area_id',
    as: 'area'
  });
  
  DeliveryRoute.hasMany(models.RoutePlan, {
    foreignKey: 'route_id',
    as: 'routePlans'
  });
};

module.exports = DeliveryRoute;