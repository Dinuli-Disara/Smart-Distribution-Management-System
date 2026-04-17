const DeliveryArea = require('../models/DeliveryArea');
const Employee = require('../models/Employee');
const { Op } = require('sequelize');

class DeliveryAreaService {
  // Get all areas
  async getAllAreas() {
    const areas = await DeliveryArea.findAll({
      where: { is_active: true },
      order: [['area_name', 'ASC']]
    });

    // Add assigned_to info for each area
    const areasWithAssignment = await Promise.all(areas.map(async (area) => {
      const assignedRep = await Employee.findOne({
        where: {
          area_id: area.area_id,
          role: 'Sales Representative',
          is_active: true
        },
        attributes: ['employee_id', 'name']
      });

      return {
        ...area.toJSON(),
        assigned_to: assignedRep ? {
          employee_id: assignedRep.employee_id,
          name: assignedRep.name
        } : null
      };
    }));

    return areasWithAssignment;
  }

  // Get available areas (not assigned to any active sales rep)
  async getAvailableAreas() {
    // Find all area_ids that are assigned to active sales reps
    const assignedAreas = await Employee.findAll({
      where: {
        role: 'Sales Representative',
        is_active: true,
        area_id: { [Op.ne]: null }
      },
      attributes: ['area_id'],
      raw: true
    });

    const assignedAreaIds = assignedAreas.map(a => a.area_id);

    // Get areas that are not assigned
    const whereCondition = { is_active: true };
    if (assignedAreaIds.length > 0) {
      whereCondition.area_id = { [Op.notIn]: assignedAreaIds };
    }

    const availableAreas = await DeliveryArea.findAll({
      where: whereCondition,
      order: [['area_name', 'ASC']]
    });

    return availableAreas;
  }

  // Get area by ID
  async getAreaById(id) {
    const area = await DeliveryArea.findByPk(id, {
      where: { is_active: true }
    });
    
    if (!area) {
      throw new Error('Area not found');
    }
    
    return area;
  }

  // Create new area
  async createArea(data) {
    // Check if area name already exists
    const existingArea = await DeliveryArea.findOne({
      where: { area_name: data.area_name }
    });

    if (existingArea) {
      throw new Error('Area name already exists');
    }

    const area = await DeliveryArea.create(data);
    return area;
  }

  // Update area
  async updateArea(id, data) {
    const area = await this.getAreaById(id);

    // Check if area name is being changed and already exists
    if (data.area_name && data.area_name !== area.area_name) {
      const existingArea = await DeliveryArea.findOne({
        where: {
          area_name: data.area_name,
          area_id: { [Op.ne]: id }
        }
      });

      if (existingArea) {
        throw new Error('Area name already exists');
      }
    }

    await area.update(data);
    return area;
  }

  // Delete area (soft delete)
  async deleteArea(id) {
    const area = await this.getAreaById(id);
    
    // Check if area has any routes
    const DeliveryRoute = require('../models/DeliveryRoute');
    const routesCount = await DeliveryRoute.count({
      where: { area_id: id }
    });

    if (routesCount > 0) {
      throw new Error('Cannot delete area with existing routes. Remove or reassign routes first.');
    }

    await area.update({ is_active: false });
    return true;
  }
}

module.exports = new DeliveryAreaService();