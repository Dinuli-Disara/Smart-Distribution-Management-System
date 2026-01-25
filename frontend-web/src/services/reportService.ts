// frontend-web/src/services/reportService.ts
import api from './api';

const reportService = {
  // Get dashboard stats
  getDashboardStats: async () => {
    return await api.get('/reports/dashboard');
  },

  // Get sales report
  getSalesReport: async (params?: any) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/reports/sales${queryString ? `?${queryString}` : ''}`);
  },

  // Get product sales report
  getProductSalesReport: async (params?: any) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/reports/product-sales${queryString ? `?${queryString}` : ''}`);
  },

  // Get route sales report
  getRouteSalesReport: async (params?: any) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/reports/route-sales${queryString ? `?${queryString}` : ''}`);
  },

  // Get employee performance
  getEmployeePerformanceReport: async (params?: any) => {
    const queryString = new URLSearchParams(params).toString();
    return await api.get(`/reports/employee-performance${queryString ? `?${queryString}` : ''}`);
  },

  // Get inventory valuation
  getInventoryValuationReport: async () => {
    return await api.get('/reports/inventory-valuation');
  }
};

export default reportService;