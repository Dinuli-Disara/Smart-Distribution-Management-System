// frontend-mobile/src/services/orderService.js
import api from './api';

export interface PreOrder {
  [x: string]: string | number | Date;
  pre_order_id: number;
  pre_order_number: string;
  customer_name: string;
  status: string;
  net_amount: number;
  items?: any[];
}

class OrderService {
  // Create a new order
  async createOrder(orderData: { customer_id: number; items: any[] }) {
    const response: any = await api.post('/orders', orderData);
    return response;
  }

  // Get all orders for sales rep
  async getOrders(filters?: { status?: string; customer_id?: number }) {
    const response: any = await api.get('/orders', { params: filters });
    return response;
  }

  // Get single order details
  async getOrder(orderId: number) {
    const response: any = await api.get(`/orders/${orderId}`);
    return response;
  }

  // Get sales rep pre-orders (for backward compatibility)
  async getSalesRepPreOrders() {
    const response: any = await api.get('/orders', { params: { status: 'PENDING' } });
    return response.data || [];
  }

  // Update pre-order status (for backward compatibility)
  async updatePreOrderStatus(orderId: number, status: string) {
    const response: any = await api.put(`/orders/${orderId}/status`, { order_status: status });
    return response;
  }

  // ============ CUSTOMER METHODS ============
  
  // Get customer dashboard data (orders, pre-orders, payments, loyalty)
  async getCustomerDashboard() {
    try {
      const response: any = await api.get('/customer/dashboard');
      return response;
    } catch (error: any) {
      console.error('Get customer dashboard error:', error);
      return { success: false, data: { orders: [], pre_orders: [], payments: [], loyalty: null } };
    }
  }

  // Get customer orders
  async getCustomerOrders() {
    try {
      const response: any = await api.get('/customer/orders');
      return response;
    } catch (error: any) {
      console.error('Get customer orders error:', error);
      return { success: false, data: [] };
    }
  }

  // Get customer pre-orders
  async getCustomerPreOrders() {
    try {
      const response: any = await api.get('/customer/pre-orders');
      return response;
    } catch (error: any) {
      console.error('Get customer pre-orders error:', error);
      return { success: false, data: [] };
    }
  }

  // Get customer payment history
  async getCustomerPayments() {
    try {
      const response: any = await api.get('/customer/payments');
      return response;
    } catch (error: any) {
      console.error('Get customer payments error:', error);
      return { success: false, data: [] };
    }
  }

  // Get customer loyalty stats
  async getCustomerLoyaltyStats() {
    try {
      const response: any = await api.get('/customer/loyalty');
      return response;
    } catch (error: any) {
      console.error('Get customer loyalty error:', error);
      return { success: false, data: null };
    }
  }

  // Update customer profile
  async updateCustomerProfile(profileData: any) {
    const response: any = await api.put('/customer/profile', profileData);
    return response;
  }
}

export default new OrderService();