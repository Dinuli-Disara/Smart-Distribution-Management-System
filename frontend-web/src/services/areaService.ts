import api from './api';

export interface DeliveryArea {
  area_id: number;
  area_name: string;
  description?: string;
  is_active: boolean;
  assigned_to?: {
    employee_id: number;
    name: string;
  } | null;
  created_at?: string;
  updated_at?: string;
}

class AreaService {
  // Get all areas
  async getAllAreas(): Promise<DeliveryArea[]> {
    const response = await api.get('/delivery-areas');
    return response.data.data;
  }

  // Get unassigned areas (not assigned to any active sales rep)
  async getUnassignedAreas(): Promise<DeliveryArea[]> {
    const response = await api.get('/delivery-areas/unassigned');
    return response.data.data;
  }

  // Get area by ID
  async getAreaById(id: number): Promise<DeliveryArea> {
    const response = await api.get(`/delivery-areas/${id}`);
    return response.data.data;
  }

  // Create new area
  async createArea(data: Partial<DeliveryArea>): Promise<DeliveryArea> {
    const response = await api.post('/delivery-areas', data);
    return response.data.data;
  }

  // Update area
  async updateArea(id: number, data: Partial<DeliveryArea>): Promise<DeliveryArea> {
    const response = await api.put(`/delivery-areas/${id}`, data);
    return response.data.data;
  }

  // Delete area (soft delete)
  async deleteArea(id: number): Promise<void> {
    await api.delete(`/delivery-areas/${id}`);
  }
}

export default new AreaService();