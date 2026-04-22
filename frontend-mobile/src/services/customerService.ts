// frontend-mobile/src/services/customerService.ts
import api from './api';

export interface CustomerProfile {
  customer_id: number;
  name: string;
  shop_name: string;
  email: string;
  contact: string;
  address: string;
  city: string | null;
  route_id: number;
  route_name?: string;
  loyalty_points: number;
  credit_limit: string;
  level_name?: string;
  discount_percentage?: number;
  is_active: boolean;
}

export interface CustomerOrder {
  order_id: number;
  order_date: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  order_status: string;
  payment_status: string;
  item_count: number;
  total_paid: number;
  balance: number;
}

export interface CustomerPreOrder {
  pre_order_id: number;
  pre_order_number: string;
  total_amount: number;
  discount_percentage: number;
  net_amount: number;
  status: string;
  notes: string | null;
  expected_delivery_date: string | null;
  created_at: string;
  item_count: number;
  items?: PreOrderItem[];
}

export interface PreOrderItem {
  pre_order_item_id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  price: number;
}

export interface CustomerPayment {
  payment_id: number;
  order_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  order_date?: string;
  order_amount?: number;
}

export interface LoyaltyStats {
  loyalty_points: number;
  level_name: string;
  discount_percentage: number;
  minimum_points: number;
  maximum_points: number;
  points_to_next_level: number | null;
  next_level_name: string | null;
}

class CustomerService {
  // Get customer profile
  async getProfile(): Promise<CustomerProfile> {
    const response: any = await api.get('/customer/profile');
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch profile');
  }

  // Update customer profile
  async updateProfile(profileData: Partial<CustomerProfile>): Promise<CustomerProfile> {
    const response: any = await api.put('/customer/profile', profileData);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update profile');
  }

  // Get customer dashboard (all data at once)
  async getDashboard(): Promise<{
    orders: CustomerOrder[];
    pre_orders: CustomerPreOrder[];
    payments: CustomerPayment[];
    loyalty: LoyaltyStats;
  }> {
    const response: any = await api.get('/customer/dashboard');
    if (response.success) {
      return response.data;
    }
    return { orders: [], pre_orders: [], payments: [], loyalty: null as any };
  }

  // Get customer orders
  async getOrders(): Promise<CustomerOrder[]> {
    try {
      const response: any = await api.get('/customer/orders');
      if (response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Get orders error:', error);
      return [];
    }
  }

  // Get single order details
  async getOrderDetails(orderId: number): Promise<any> {
    const response: any = await api.get(`/customer/orders/${orderId}`);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch order details');
  }

  // Get customer pre-orders
  async getPreOrders(): Promise<CustomerPreOrder[]> {
    try {
      const response: any = await api.get('/customer/pre-orders');
      if (response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Get pre-orders error:', error);
      return [];
    }
  }

  // Get customer payment history
  async getPayments(): Promise<CustomerPayment[]> {
    try {
      const response: any = await api.get('/customer/payments');
      if (response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Get payments error:', error);
      return [];
    }
  }

  // Get loyalty statistics
  async getLoyaltyStats(): Promise<LoyaltyStats | null> {
    try {
      const response: any = await api.get('/customer/loyalty');
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Get loyalty stats error:', error);
      return null;
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response: any = await api.post('/customer/change-password', {
      currentPassword,
      newPassword
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to change password');
    }
  }
}

export default new CustomerService();