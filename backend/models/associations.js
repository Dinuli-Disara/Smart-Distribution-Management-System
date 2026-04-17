//backend/models/associations.js
const DeliveryArea = require('./DeliveryArea');
const DeliveryRoute = require('./DeliveryRoute');
const Employee = require('./Employee');
const Customer = require('./Customer');

// DeliveryArea <-> DeliveryRoute (One-to-Many)
DeliveryArea.hasMany(DeliveryRoute, {
  foreignKey: 'area_id',
  as: 'routes',
  sourceKey: 'area_id'
});

DeliveryRoute.belongsTo(DeliveryArea, {
  foreignKey: 'area_id',
  as: 'area',
  targetKey: 'area_id'
});

// DeliveryRoute <-> Customer (One-to-Many)
DeliveryRoute.hasMany(Customer, {
  foreignKey: 'route_id',
  as: 'customers',
  sourceKey: 'route_id'
});

Customer.belongsTo(DeliveryRoute, {
  foreignKey: 'route_id',
  as: 'route',
  targetKey: 'route_id'
});

// DeliveryArea <-> Employee (One-to-Many)
DeliveryArea.hasMany(Employee, {
  foreignKey: 'area_id',
  as: 'employees',
  sourceKey: 'area_id'
});

Employee.belongsTo(DeliveryArea, {
  foreignKey: 'area_id',
  as: 'area',
  targetKey: 'area_id'
});

console.log('✅ Database associations defined');