// frontend-web/src/services/authService.ts
import api from './api';

interface LoginResponse {
  success: boolean;
  message?: string;
  data: {
    employee_id: number;
    name: string;
    email: string;
    role: string;
    username: string;
    token: string;
  };
}

interface User {
  employee_id: number;
  name: string;
  email: string;
  role: string;
  username: string;
  token?: string;
}

const authService = {
  // Login
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response: any = await api.post('/auth/login', { username, password });
    
    if (response.success && response.data.token) {
      // Store token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
  getMe: async (): Promise<any> => {
    const response: any = await api.get('/auth/me');
    if (response.success) {
      // Update stored user data
      const currentUser = authService.getCurrentUser();
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
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