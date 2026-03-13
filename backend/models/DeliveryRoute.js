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
    allowNull: true
  },
  route_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'delivery_route', // Make sure this matches your actual table name
  timestamps: false // Set to true if your table has created_at/updated_at
});

module.exports = DeliveryRoute;