// frontend-web/src/services/orderService.ts
import api from './api';

const orderService = {
  // Get all orders
  getAllOrders: async (filters?: any) => {
    const params = new URLSearchParams(filters).toString();
    return await api.get(`/orders${params ? `?${params}` : ''}`);
  },

  // Get single order
  getOrder: async (id: number) => {
    return await api.get(`/orders/${id}`);
  },

  // Create order
  createOrder: async (data: any) => {
    return await api.post('/orders', data);
  },

  // Update order status
  updateOrderStatus: async (id: number, status: string) => {
    return await api.put(`/orders/${id}/status`, { order_status: status });
  },

  // Generate invoice
  generateInvoice: async (id: number) => {
    return await api.post(`/orders/${id}/invoice`);
  }
};

export default orderService;