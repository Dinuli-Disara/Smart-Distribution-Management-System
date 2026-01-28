// frontend-mobile/src/services/api.ts
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Optional: For navigation in React Native
// import { CommonActions } from '@react-navigation/native';
// You'll need to set up a navigation ref or use a different approach

// Create axios instance
const api = axios.create({
  baseURL: 'http://10.90.46.38:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  async (error: AxiosError) => {
    // Handle different error cases
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - handle token invalidation
        try {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            // Token exists but is invalid - clear it
            await AsyncStorage.multiRemove(['token', 'user']);
            
            // For React Native, you need to navigate differently
            // Example using navigation ref (you'll need to set this up):
            // if (navigationRef.isReady()) {
            //   navigationRef.dispatch(
            //     CommonActions.reset({
            //       index: 0,
            //       routes: [{ name: 'Login' }],
            //     })
            //   );
            // }
            
            console.log('Session expired. Please login again.');
          }
        } catch (storageError) {
          console.error('Error handling 401:', storageError);
        }
      }
      
      return Promise.reject(data);
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({
        success: false,
        message: 'No response from server. Please check your connection.',
      });
    } else {
      // Something else happened
      return Promise.reject({
        success: false,
        message: error.message || 'An error occurred',
      });
    }
  }
);

export default api;