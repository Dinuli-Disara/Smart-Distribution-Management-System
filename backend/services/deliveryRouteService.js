// backend/services/deliveryRouteService.js
const DeliveryRoute = require('../models/DeliveryRoute');
const Employee = require('../models/Employee');
const { Op } = require('sequelize');

class DeliveryRouteService {
  // Get all routes
  async getAllRoutes() {
    const routes = await DeliveryRoute.findAll({
      order: [['route_name', 'ASC']]
    });
    return routes;
  }

  // Get available routes (not assigned to any active sales rep)
  async getAvailableRoutes() {
    try {
      // Find all route_ids that are assigned to active sales reps
      const assignedRoutes = await Employee.findAll({
        where: {
          role: 'Sales Representative',
          is_active: true,
          route_id: { [Op.ne]: null }
        },
        attributes: ['route_id'],
        raw: true
      });

      const assignedRouteIds = assignedRoutes.map(r => r.route_id);

      // Get routes that are not assigned
      const whereCondition = {};
      if (assignedRouteIds.length > 0) {
        whereCondition.route_id = { [Op.notIn]: assignedRouteIds };
      }

      const availableRoutes = await DeliveryRoute.findAll({
        where: whereCondition,
        order: [['route_name', 'ASC']]
      });

      return availableRoutes;
    } catch (error) {
      console.error('Error in getAvailableRoutes:', error);
      throw error;
    }
  }

  // Get route by ID
  async getRouteById(id) {
    const route = await DeliveryRoute.findByPk(id);
    if (!route) {
      throw new Error('Route not found');
    }
    return route;
  }
}

module.exports = new DeliveryRouteService();