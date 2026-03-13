// frontend-web/src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/authService';

// Define types
interface User {
  employee_id: number;
  name: string;
  email: string;
  role: string;
  username: string;
  contact?: string; // Add contact field
  token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; data?: User; message?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void; // Add this
  isAuthenticated: boolean;
  role: string | null;
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
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login(username, password);
      if (response.success) {
        setUser(response.data);
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Add updateUser function
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Update localStorage
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        const updatedStoredUser = { ...storedUser, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedStoredUser));
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateUser, // Add this to the value object
    isAuthenticated: !!user,
    role: user?.role || null,
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