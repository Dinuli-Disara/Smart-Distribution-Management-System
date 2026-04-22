const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

class RoutePlanService {
  // Create a new route plan request
  async createRoutePlan(data, requestedBy) {
    const transaction = await sequelize.transaction();
    
    try {
      const { planned_date, assignments, notes } = data;
      
      // Validate date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(planned_date);
      
      if (selectedDate < today) {
        throw new Error('Cannot plan routes for past dates');
      }
      
      // Check if there's already a plan for this date
      const [existingPlans] = await sequelize.query(
        `SELECT plan_id, status FROM route_plans 
         WHERE planned_date = :planned_date AND status IN ('pending', 'approved')`,
        { replacements: { planned_date }, type: sequelize.QueryTypes.SELECT, transaction }
      );
      
      if (existingPlans) {
        throw new Error(`A ${existingPlans.status} plan already exists for ${planned_date}`);
      }
      
      // Create the main plan
      const [planResult] = await sequelize.query(
        `INSERT INTO route_plans (planned_date, status, requested_by, notes, created_at, updated_at)
         VALUES (:planned_date, 'pending', :requested_by, :notes, NOW(), NOW())`,
        { 
          replacements: { planned_date, requested_by: requestedBy, notes: notes || null },
          type: sequelize.QueryTypes.INSERT,
          transaction 
        }
      );
      
      const planId = planResult;
      
      // Create all details
      for (const assignment of assignments) {
        await sequelize.query(
          `INSERT INTO route_plan_details (plan_id, area_id, route_id, van_id, created_at, updated_at)
           VALUES (:plan_id, :area_id, :route_id, :van_id, NOW(), NOW())`,
          {
            replacements: {
              plan_id: planId,
              area_id: assignment.area_id,
              route_id: assignment.route_id,
              van_id: assignment.van_id
            },
            type: sequelize.QueryTypes.INSERT,
            transaction
          }
        );
      }
      
      await transaction.commit();
      
      return {
        plan_id: planId,
        planned_date,
        status: 'pending',
        requested_by: requestedBy,
        notes
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  // Get all route plans (with filtering by role)
  async getAllRoutePlans(userId, userRole) {
    try {
      let query = `
        SELECT 
          rp.*,
          e.name as requester_name,
          e.email as requester_email
        FROM route_plans rp
        LEFT JOIN employee e ON rp.requested_by = e.employee_id
      `;
      
      const replacements = {};
      
      if (userRole === 'Clerk') {
        query += ` WHERE rp.requested_by = :userId`;
        replacements.userId = userId;
      }
      
      query += ` ORDER BY rp.created_at DESC`;
      
      const plans = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });
      
      // Get details for each plan
      for (const plan of plans) {
        const details = await sequelize.query(
          `SELECT 
            rd.*,
            a.area_name,
            r.route_name,
            v.vehicle_number
          FROM route_plan_details rd
          LEFT JOIN delivery_area a ON rd.area_id = a.area_id
          LEFT JOIN delivery_route r ON rd.route_id = r.route_id
          LEFT JOIN van v ON rd.van_id = v.van_id
          WHERE rd.plan_id = :plan_id`,
          {
            replacements: { plan_id: plan.plan_id },
            type: sequelize.QueryTypes.SELECT
          }
        );
        plan.details = details;
      }
      
      return plans;
    } catch (error) {
      console.error('Error in getAllRoutePlans:', error);
      throw error;
    }
  }
  
  // Get pending approvals for owner
  async getPendingApprovals() {
    try {
      const plans = await sequelize.query(
        `SELECT 
          rp.*,
          e.name as requester_name,
          e.email as requester_email
        FROM route_plans rp
        LEFT JOIN employee e ON rp.requested_by = e.employee_id
        WHERE rp.status = 'pending'
        ORDER BY rp.planned_date ASC, rp.created_at ASC`,
        {
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      // Get details for each plan
      for (const plan of plans) {
        const details = await sequelize.query(
          `SELECT 
            rd.*,
            a.area_name,
            r.route_name,
            v.vehicle_number
          FROM route_plan_details rd
          LEFT JOIN delivery_area a ON rd.area_id = a.area_id
          LEFT JOIN delivery_route r ON rd.route_id = r.route_id
          LEFT JOIN van v ON rd.van_id = v.van_id
          WHERE rd.plan_id = :plan_id`,
          {
            replacements: { plan_id: plan.plan_id },
            type: sequelize.QueryTypes.SELECT
          }
        );
        plan.details = details;
      }
      
      return plans;
    } catch (error) {
      console.error('Error in getPendingApprovals:', error);
      throw error;
    }
  }
  
  // Approve a route plan
  async approveRoutePlan(planId, approvedBy, comments = null) {
    try {
      await sequelize.query(
        `UPDATE route_plans 
         SET status = 'approved', approved_by = :approved_by, approved_at = NOW()
         WHERE plan_id = :plan_id AND status = 'pending'`,
        {
          replacements: { plan_id: planId, approved_by: approvedBy },
          type: sequelize.QueryTypes.UPDATE
        }
      );
      
      return this.getRoutePlanById(planId);
    } catch (error) {
      console.error('Error in approveRoutePlan:', error);
      throw error;
    }
  }
  
  // Reject a route plan
  async rejectRoutePlan(planId, rejectedBy, reason, comments = null) {
    try {
      await sequelize.query(
        `UPDATE route_plans 
         SET status = 'rejected', approved_by = :approved_by, approved_at = NOW(), rejection_reason = :reason
         WHERE plan_id = :plan_id AND status = 'pending'`,
        {
          replacements: { plan_id: planId, approved_by: rejectedBy, reason: reason },
          type: sequelize.QueryTypes.UPDATE
        }
      );
      
      return this.getRoutePlanById(planId);
    } catch (error) {
      console.error('Error in rejectRoutePlan:', error);
      throw error;
    }
  }
  
  // Get route plan by ID
  async getRoutePlanById(planId) {
    try {
      const [plan] = await sequelize.query(
        `SELECT 
          rp.*,
          e.name as requester_name,
          e.email as requester_email,
          ae.name as approver_name,
          ae.email as approver_email
        FROM route_plans rp
        LEFT JOIN employee e ON rp.requested_by = e.employee_id
        LEFT JOIN employee ae ON rp.approved_by = ae.employee_id
        WHERE rp.plan_id = :plan_id`,
        {
          replacements: { plan_id: planId },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      if (!plan) {
        throw new Error('Route plan not found');
      }
      
      const details = await sequelize.query(
        `SELECT 
          rd.*,
          a.area_name,
          r.route_name,
          v.vehicle_number
        FROM route_plan_details rd
        LEFT JOIN delivery_area a ON rd.area_id = a.area_id
        LEFT JOIN delivery_route r ON rd.route_id = r.route_id
        LEFT JOIN van v ON rd.van_id = v.van_id
        WHERE rd.plan_id = :plan_id`,
        {
          replacements: { plan_id: planId },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      plan.details = details;
      return plan;
    } catch (error) {
      console.error('Error in getRoutePlanById:', error);
      throw error;
    }
  }
  
  // Get approved plans for a date
  async getApprovedPlansByDate(date) {
    try {
      const [plan] = await sequelize.query(
        `SELECT * FROM route_plans 
         WHERE planned_date = :date AND status = 'approved'`,
        {
          replacements: { date },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      if (!plan) return null;
      
      const details = await sequelize.query(
        `SELECT 
          rd.*,
          a.area_name,
          r.route_name,
          v.vehicle_number
        FROM route_plan_details rd
        LEFT JOIN delivery_area a ON rd.area_id = a.area_id
        LEFT JOIN delivery_route r ON rd.route_id = r.route_id
        LEFT JOIN van v ON rd.van_id = v.van_id
        WHERE rd.plan_id = :plan_id`,
        {
          replacements: { plan_id: plan.plan_id },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      plan.details = details;
      return plan;
    } catch (error) {
      console.error('Error in getApprovedPlansByDate:', error);
      throw error;
    }
  }
  
  // Get areas with routes and vans for selection
  async getAreasWithRoutesAndVans() {
    try {
      console.log('=== getAreasWithRoutesAndVans called ===');
      
      const areas = await sequelize.query(
        `SELECT 
          a.area_id,
          a.area_name,
          v.van_id,
          v.vehicle_number
        FROM delivery_area a
        LEFT JOIN van v ON a.area_id = v.area_id AND v.is_active = 1
        WHERE a.is_active = 1
        ORDER BY a.area_name`,
        {
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      const result = [];
      for (const area of areas) {
        const routes = await sequelize.query(
          `SELECT route_id, route_name 
           FROM delivery_route 
           WHERE area_id = :area_id AND is_active = 1`,
          {
            replacements: { area_id: area.area_id },
            type: sequelize.QueryTypes.SELECT
          }
        );
        
        result.push({
          area_id: area.area_id,
          area_name: area.area_name,
          van: area.van_id ? {
            van_id: area.van_id,
            vehicle_number: area.vehicle_number
          } : null,
          routes: routes
        });
      }
      
      console.log(`Found ${result.length} areas with routes and vans`);
      return { areas: result };
    } catch (error) {
      console.error('Error in getAreasWithRoutesAndVans:', error);
      throw error;
    }
  }
  
  // Check date availability
  async checkDateAvailability(date) {
    try {
      const [existingPlan] = await sequelize.query(
        `SELECT plan_id, status FROM route_plans 
         WHERE planned_date = :date AND status IN ('pending', 'approved')
         LIMIT 1`,
        {
          replacements: { date },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      return {
        available: !existingPlan,
        existingPlan: existingPlan || null
      };
    } catch (error) {
      console.error('Error in checkDateAvailability:', error);
      throw error;
    }
  }
}

module.exports = new RoutePlanService();