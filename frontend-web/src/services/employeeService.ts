import api from './api';

export interface Employee {
  employee_id: number;
  name: string;
  email: string;
  contact: string | null;
  role: 'Owner' | 'Clerk' | 'Sales Representative';
  username: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  area_id?: number | null;
  area?: {
    area_id: number;
    area_name: string;
  } | null;
}

export interface CreateEmployeeData {
  name: string;
  email: string;
  contact?: string;
  role: 'Owner' | 'Clerk' | 'Sales Representative';
  username: string;
  password: string;
  area_id?: number | null; 
}

export interface UpdateEmployeeData {
  name?: string;
  email?: string;
  contact?: string;
  role?: 'Owner' | 'Clerk' | 'Sales Representative';
  area_id?: number | null;
  is_active?: boolean;
}

const employeeService = {
  // Get all employees (Admin only)
  getAllEmployees: async (): Promise<Employee[]> => {
    try {
      const response = await api.get('/employees');
      console.log('Get all employees response:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch employees');
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  // Get single employee
  getEmployee: async (id: number): Promise<Employee> => {
    try {
      const response = await api.get(`/employees/${id}`);
      console.log('Get employee response:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch employee');
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  },

  // Create new employee (Admin only)
  createEmployee: async (data: CreateEmployeeData): Promise<Employee> => {
    try {
      const response = await api.post('/employees', data);
      console.log('Create employee response:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create employee');
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  // Update employee (Admin only - can update role, status, etc.)
  updateEmployee: async (id: number, data: UpdateEmployeeData): Promise<Employee> => {
    try {
      const response = await api.put(`/employees/${id}`, data);
      console.log('Update employee response:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update employee');
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  // Deactivate employee (Admin only)
  deactivateEmployee: async (id: number): Promise<Employee> => {
    try {
      const response = await api.put(`/employees/${id}/deactivate`);
      console.log('Deactivate employee response:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to deactivate employee');
    } catch (error) {
      console.error('Error deactivating employee:', error);
      throw error;
    }
  },

  // Activate employee (Admin only)
  activateEmployee: async (id: number): Promise<Employee> => {
    try {
      const response = await api.put(`/employees/${id}/activate`);
      console.log('Activate employee response:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to activate employee');
    } catch (error) {
      console.error('Error activating employee:', error);
      throw error;
    }
  },

  // Search employees
  searchEmployees: async (searchTerm: string): Promise<Employee[]> => {
    try {
      const response = await api.get(`/employees?search=${encodeURIComponent(searchTerm)}`);
      console.log('Search employees response:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to search employees');
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  },

  // Get employee statistics (Admin only)
  getEmployeeStats: async (): Promise<any> => {
    try {
      const response = await api.get('/employees/stats');
      console.log('Employee stats response:', response.data);
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch employee stats');
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      throw error;
    }
  },
};

export default employeeService;