// frontend-web/src/services/api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import { InternalAxiosRequestConfig } from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data); // Debug log
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response:', response.status, response.data); // Debug log
    // Return the full response data structure
    return response;
  },
  (error: AxiosError) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    // Handle different error cases
    if (error.response) {
      // Server responded with error
      const { status } = error.response;
      
      if (status === 401) {
        // Unauthorized - only redirect if already authenticated
        const token = localStorage.getItem('token');
        if (token) {
          // Token exists but is invalid - clear it and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
      
      // Return the error response with its data
      return Promise.reject(error.response);
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({
        status: 0,
        data: {
          success: false,
          message: 'No response from server. Please check your connection.',
        },
      });
    } else {
      // Something else happened
      return Promise.reject({
        status: 0,
        data: {
          success: false,
          message: error.message || 'An error occurred',
        },
      });
    }
  }
);

export default api;