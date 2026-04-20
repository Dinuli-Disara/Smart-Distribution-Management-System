const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Van = sequelize.define('Van', {
  van_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vehicle_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  assigned_employee_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'employee',
      key: 'employee_id'
    }
  },
  area_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'delivery_area',
      key: 'area_id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'van',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Van.associate = (models) => {
  Van.belongsTo(models.Employee, {
    foreignKey: 'assigned_employee_id',
    as: 'assignedEmployee'
  });
  
  Van.belongsTo(models.DeliveryArea, {
    foreignKey: 'area_id',
    as: 'area'
  });
  
  Van.hasMany(models.RoutePlanDetail, {
    foreignKey: 'van_id',
    as: 'planDetails'
  });
};

module.exports = Van;