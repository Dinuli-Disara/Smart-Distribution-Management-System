// frontend-mobile/src/services/orderService.ts
import api from './api';

export interface OrderItem {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  order_id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  order_date: string;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  payment_status: 'PAID' | 'PARTIAL' | 'PENDING';
  order_status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
  payments?: any[];
}

export interface CreateOrderData {
  customer_id: number;
  items: { product_id: number; quantity: number; price: number }[];
  discount?: number;
  notes?: string;
}

export interface PreOrder {
  pre_order_id: number;
  pre_order_number: string;
  customer_id: number;
  customer_name: string;
  created_at: string;
  expected_delivery_date?: string;
  items: OrderItem[];
  total_amount: number;
  discount_percentage: number;
  net_amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED' | 'DECLINED';
  notes?: string;
}

export interface CreatePreOrderData {
  customer_id: number;
  items: { product_id: number; quantity: number; price: number }[];
  expected_delivery_date?: string;
  notes?: string;
}

const orderService = {
  // Get customer orders
  getCustomerOrders: async (customerId: number, page: number = 1, limit: number = 20): Promise<{ orders: Order[], total: number }> => {
    try {
      const response: any = await api.get(`/customers/${customerId}/orders`, {
        params: { page, limit }
      });
      if (response.success && response.data) {
        return response.data;
      }
      return { orders: [], total: 0 };
    } catch (error: any) {
      console.error('Get customer orders error:', error);
      return { orders: [], total: 0 };
    }
  },

  // Get order details
  getOrderDetails: async (orderId: number): Promise<Order> => {
    try {
      const response: any = await api.get(`/orders/${orderId}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Order not found');
    } catch (error: any) {
      console.error('Get order details error:', error);
      throw error;
    }
  },

  // Create new order
  createOrder: async (orderData: CreateOrderData): Promise<Order> => {
    try {
      const response: any = await api.post('/orders', orderData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to create order');
    } catch (error: any) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  // Get customer pre-orders
  getCustomerPreOrders: async (customerId: number): Promise<PreOrder[]> => {
    try {
      const response: any = await api.get(`/customers/${customerId}/pre-orders`);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('Get customer pre-orders error:', error);
      return [];
    }
  },

  // Get sales rep pre-orders
  getSalesRepPreOrders: async (): Promise<PreOrder[]> => {
    try {
      const response: any = await api.get('/pre-orders');
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('Get sales rep pre-orders error:', error);
      return [];
    }
  },

  // Create pre-order
  createPreOrder: async (preOrderData: CreatePreOrderData): Promise<PreOrder> => {
    try {
      const response: any = await api.post('/pre-orders', preOrderData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to create pre-order');
    } catch (error: any) {
      console.error('Create pre-order error:', error);
      throw error;
    }
  },

  // Update pre-order status (for sales rep)
  updatePreOrderStatus: async (preOrderId: number, status: PreOrder['status'], notes?: string): Promise<PreOrder> => {
    try {
      const response: any = await api.put(`/pre-orders/${preOrderId}/status`, { status, notes });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to update pre-order status');
    } catch (error: any) {
      console.error('Update pre-order status error:', error);
      throw error;
    }
  },
};

export default orderService;