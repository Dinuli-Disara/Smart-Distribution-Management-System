// backend/models/DeliveryArea.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DeliveryArea = sequelize.define('DeliveryArea', {
  area_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  area_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'delivery_area',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = DeliveryArea;