// frontend-mobile/src/services/authService.ts
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    // Common fields
    id: number;
    name: string;
    email: string;
    role: string;
    username: string;
    token: string;

    // Employee specific
    employee_id?: number;

    // Customer specific
    customer_id?: number;
    shop_name?: string;
    address?: string;
    loyalty_points?: number;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  username: string;
  token?: string;

  // Additional fields based on role
  employee_id?: number;
  customer_id?: number;
  shop_name?: string;
  address?: string;
  city?: string;
  loyalty_points?: number;
  credit_limit?: number;
}

const authService = {
  // Login - try customer first, then employee

  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      console.log('Attempting customer login...');
      // First try customer login
      const customerResponse: any = await api.post('/customer-auth/login', { username, password });

      console.log('Customer login response:', customerResponse);

      if (customerResponse.success && customerResponse.data.token) {
        console.log('Customer login successful');
        await AsyncStorage.setItem('token', customerResponse.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(customerResponse.data));
        return customerResponse;
      } else {
        console.log('Customer login failed:', customerResponse.message);
      }
    } catch (customerError) {
      // If customer login fails, try employee login
      console.log('Customer login error:', customerError);
    }

    console.log('Attempting employee login...');
    try {
      // Try employee login
      const employeeResponse: any = await api.post('/auth/login', { username, password });

      console.log('Employee login response:', employeeResponse);

      if (employeeResponse.success && employeeResponse.data.token) {
        console.log('Employee login successful');
        await AsyncStorage.setItem('token', employeeResponse.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(employeeResponse.data));
      }

      return employeeResponse;
    } catch (employeeError) {
      console.log('Employee login error:', employeeError);
      return {
        success: false,
        message: 'login failed',
      };
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    await AsyncStorage.multiRemove(['token', 'user']);
  },

  // Get current user from AsyncStorage
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('token');
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  // Get user role
  getUserRole: async (): Promise<string | null> => {
    try {
      const user = await authService.getCurrentUser();
      return user ? user.role : null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },

  // Get me (verify token and get fresh user data)
  getMe: async (): Promise<any> => {
    const response: any = await api.get('/auth/me');
    if (response.success) {
      // Update stored user data
      const currentUser = await authService.getCurrentUser();
      const updatedUser = {
        ...currentUser,
        ...response.data,
        // Keep the token if it exists in currentUser
        token: currentUser?.token
      };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
    return response;
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