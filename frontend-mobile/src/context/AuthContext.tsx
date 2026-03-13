// frontend-mobile/src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/authService';
import { Alert } from 'react-native';

// Define types - SIMPLIFIED VERSION
export interface User {
  id: number;
  name: string;
  email: string;
  role: string; // Just use string for flexibility
  username: string;
  token?: string;
  
  // Optional fields that might exist
  employee_id?: number;
  customer_id?: number;
  shop_name?: string;
  address?: string;
  city?: string;
  loyalty_points?: number;
  credit_limit?: number;
}

// Type guards for better type safety
export const isEmployeeUser = (user: User): boolean => {
  return ['Owner', 'Clerk', 'Sales Representative'].includes(user.role);
};

export const isCustomerUser = (user: User): boolean => {
  return user.role === 'customer';
};

interface LoginResponse {
  success: boolean;
  data?: User;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  role: string | null;
  refreshUser: () => Promise<void>;
  isCustomer: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      Alert.alert('Error', 'Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<LoginResponse> => {
    try {
      setLoading(true);
      const response = await authService.login(username, password);
      
      if (response.success && response.data) {
        setUser(response.data);
        return { 
          success: true, 
          data: response.data
        };
      }
      
      return { 
        success: false, 
        message: response.message || 'Login failed' 
      };
      
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Login failed. Please check your credentials.';
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to logout properly');
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      if (response.success) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } else {
        // Token might be invalid, force logout
        await logout();
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      // Token might be invalid, force logout
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    role: user?.role || null,
    refreshUser,
    isCustomer: user ? isCustomerUser(user) : false,
    isEmployee: user ? isEmployeeUser(user) : false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};