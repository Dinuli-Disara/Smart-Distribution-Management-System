// frontend-web/src/services/authService.ts
import api from './api';

export interface User {
  employee_id: number;
  name: string;
  email: string;
  role: string;
  username: string;
  contact?: string;
  token?: string;
}

export interface ProfileData {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  role: string;
  employee_id: number;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  data: User;
}

const authService = {
  // Login
  // In authService.ts - update login method
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/login', { username, password });
      console.log('Login response:', response.data);

      if (response.data.success && response.data.data.token) {
        // Store token and user info
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));

        // Set default auth header
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
      }

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.data) {
        return error.data;
      }
      throw error;
    }
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // Get user role
  getUserRole: (): string | null => {
    const user = authService.getCurrentUser();
    return user ? user.role : null;
  },

  // Get me (verify token and get fresh user data)
  // In authService.ts - update getMe method
  getMe: async (): Promise<any> => {
    try {
      const response = await api.get('/auth/me');
      console.log('GetMe response:', response.data);

      if (response.data.success) {
        // Update stored user data
        const currentUser = authService.getCurrentUser();
        const updatedUser = { ...currentUser, ...response.data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return response.data;
    } catch (error) {
      console.error('GetMe error:', error);
      throw error;
    }
  },
  // Get current user's profile
  getProfile: async (): Promise<ProfileData> => {
    try {
      console.log('Fetching profile from /auth/me');
      const response = await api.get('/auth/me');
      console.log('Raw /auth/me response:', response);

      // The response from api.get is the full axios response
      // We need to access response.data which contains your backend response
      const backendResponse = response.data;
      console.log('Backend response data:', backendResponse);

      if (backendResponse.success) {
        const employee = backendResponse.data;
        console.log('Employee data from backend:', employee);

        // Format the data for the Profile component
        const profileData = authService.mapEmployeeToProfile(employee);
        console.log('Formatted profile data:', profileData);
        return profileData;
      } else {
        throw new Error(backendResponse.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Update profile
  updateProfile: async (profileData: Partial<ProfileData>): Promise<ProfileData> => {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('No user logged in');

      // Prepare data for backend - ONLY send fields that can be updated
      const updateData: any = {};

      // Only add fields that are provided and valid
      if (profileData.firstName || profileData.lastName) {
        updateData.name = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
      }

      if (profileData.username) {
        updateData.username = profileData.username;
      }

      if (profileData.phone !== undefined) {
        updateData.contact = profileData.phone;
      }

      console.log('Sending update data to backend:', updateData);
      console.log('User employee_id:', user.employee_id);

      // Make the API call
      const response = await api.put(`/employees/${user.employee_id}`, updateData);
      console.log('Full update response:', response);
      console.log('Response data:', response.data);

      // The response structure from your backend
      if (response.data && response.data.success) {
        // Update stored user data
        const updatedUser = {
          ...user,
          name: updateData.name || user.name,
          username: updateData.username || user.username,
          contact: updateData.contact || user.contact
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Return formatted profile data
        return authService.mapEmployeeToProfile(response.data.data || updatedUser);
      } else {
        throw new Error(response.data?.message || 'Update failed');
      }
    } catch (error: any) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);

      // Throw a meaningful error
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to update profile');
      }
    }
  },

  // Helper function to map employee to profile format
  mapEmployeeToProfile: (employee: any): ProfileData => {
    console.log('Mapping employee to profile:', employee);

    // Handle case when employee is null or undefined
    if (!employee) {
      return {
        firstName: '',
        lastName: '',
        name: '',
        email: '',
        phone: '',
        username: '',
        role: '',
        employee_id: 0
      };
    }

    const fullName = employee.name || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      firstName,
      lastName,
      name: fullName,
      email: employee.email || '',
      phone: employee.contact || '',
      username: employee.username || '',
      role: employee.role || '',
      employee_id: employee.employee_id || 0
    };
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<any> => {
    return await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  // Forgot password - request reset token
  forgotPassword: async (email: string): Promise<any> => {
    return await api.post('/auth/forgot-password', { email });
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string): Promise<any> => {
    return await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
  },

  // Verify reset token
  verifyResetToken: async (token: string): Promise<any> => {
    return await api.get(`/auth/verify-reset-token/${token}`);
  },

};

export default authService;