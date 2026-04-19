// frontend-mobile/src/services/loyaltyService.ts
import api from './api';

export interface LoyaltyLevel {
  level_id: number;
  level_name: string;
  minimum_points: number;
  maximum_points: number;
  discount_percentage: number;
  credit_limit: number;
}

export interface LoyaltyTransaction {
  transaction_id: number;
  customer_id: number;
  points_earned: number;
  points_used: number;
  transaction_type: 'purchase' | 'redeem' | 'bonus';
  reference_id: string;
  created_at: string;
}

export interface LoyaltyStats {
  total_points: number;
  current_level: LoyaltyLevel;
  next_level?: LoyaltyLevel;
  points_to_next_level: number;
  total_points_earned: number;
  total_points_redeemed: number;
}

const loyaltyService = {
  // Get customer loyalty stats - FIXED ENDPOINT
  getLoyaltyStats: async (customerId: number): Promise<LoyaltyStats> => {
    try {
      // Use the correct endpoint from your backend
      const response: any = await api.get(`/loyalty-levels/customer/${customerId}/stats`);
      if (response.success && response.data) {
        return response.data;
      }
      // Return default stats if API fails
      return {
        total_points: 0,
        current_level: {
          level_id: 1,
          level_name: 'Blue',
          minimum_points: 0,
          maximum_points: 999,
          discount_percentage: 0,
          credit_limit: 50000
        },
        next_level: {
          level_id: 2,
          level_name: 'Bronze',
          minimum_points: 1000,
          maximum_points: 2499,
          discount_percentage: 2,
          credit_limit: 75000
        },
        points_to_next_level: 1000,
        total_points_earned: 0,
        total_points_redeemed: 0
      };
    } catch (error: any) {
      console.error('Get loyalty stats error:', error);
      // Return default stats instead of throwing
      return {
        total_points: 0,
        current_level: {
          level_id: 1,
          level_name: 'Blue',
          minimum_points: 0,
          maximum_points: 999,
          discount_percentage: 0,
          credit_limit: 50000
        },
        next_level: {
          level_id: 2,
          level_name: 'Bronze',
          minimum_points: 1000,
          maximum_points: 2499,
          discount_percentage: 2,
          credit_limit: 75000
        },
        points_to_next_level: 1000,
        total_points_earned: 0,
        total_points_redeemed: 0
      };
    }
  },

  // Get loyalty transaction history
  getLoyaltyTransactions: async (customerId: number, page: number = 1, limit: number = 20): Promise<{ transactions: LoyaltyTransaction[], total: number }> => {
    try {
      const response: any = await api.get(`/loyalty-levels/customer/${customerId}/transactions`, {
        params: { page, limit }
      });
      if (response.success && response.data) {
        return response.data;
      }
      return { transactions: [], total: 0 };
    } catch (error: any) {
      console.error('Get loyalty transactions error:', error);
      return { transactions: [], total: 0 };
    }
  },

  // Get all loyalty levels
  getLoyaltyLevels: async (): Promise<LoyaltyLevel[]> => {
    try {
      const response: any = await api.get('/loyalty-levels');
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('Get loyalty levels error:', error);
      return [];
    }
  },

  // Get available rewards
  getAvailableRewards: async (customerId: number): Promise<any[]> => {
    try {
      const response: any = await api.get(`/customers/${customerId}/available-rewards`);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('Get available rewards error:', error);
      return [];
    }
  },

  // Redeem points
  redeemPoints: async (customerId: number, points: number, rewardId?: string): Promise<any> => {
    try {
      const response: any = await api.post(`/loyalty-levels/customer/${customerId}/redeem`, {
        points,
        reward_id: rewardId
      });
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to redeem points');
    } catch (error: any) {
      console.error('Redeem points error:', error);
      throw error;
    }
  },
};

export default loyaltyService;