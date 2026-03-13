import api from './api';

export interface DeliveryRoute {
  route_id: number;
  route_name: string;
  area_id: number | null;
  route_code?: string;
  area?: string;
  assigned_to?: number | null; 
  sales_representative?: {
    employee_id: number;
    name: string;
  } | null;
}

const deliveryRouteService = {
  // Get all routes
  getAllRoutes: async (): Promise<DeliveryRoute[]> => {
    try {
      const response = await api.get('/delivery-routes');
      console.log('Get all routes response:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch routes');
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  },

  // Get unassigned routes
  getUnassignedRoutes: async (): Promise<DeliveryRoute[]> => {
    try {
      const response = await api.get('/delivery-routes/available');
      console.log('Get unassigned routes response:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch unassigned routes');
    } catch (error) {
      console.error('Error fetching unassigned routes:', error);
      throw error;
    }
  },

  // Get route by ID
  getRouteById: async (id: number): Promise<DeliveryRoute> => {
    try {
      const response = await api.get(`/delivery-routes/${id}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch route');
    } catch (error) {
      console.error('Error fetching route:', error);
      throw error;
    }
  }
};

export default deliveryRouteService;