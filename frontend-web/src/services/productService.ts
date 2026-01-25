// frontend-web/src/services/productService.ts
import api from './api';

const productService = {
  // Get all products
  getAllProducts: async () => {
    return await api.get('/products');
  },

  // Get single product
  getProduct: async (id: number) => {
    return await api.get(`/products/${id}`);
  },

  // Get low stock products
  getLowStockProducts: async () => {
    return await api.get('/products/low-stock');
  },

  // Get expiring products
  getExpiringProducts: async (days = 30) => {
    return await api.get(`/products/expiring?days=${days}`);
  },

  // Get expired products
  getExpiredProducts: async () => {
    return await api.get('/products/expired');
  },

  // Create product
  createProduct: async (data: any) => {
    return await api.post('/products', data);
  },

  // Update product
  updateProduct: async (id: number, data: any) => {
    return await api.put(`/products/${id}`, data);
  }
};

export default productService;