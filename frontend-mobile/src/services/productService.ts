// frontend-mobile/src/services/productService.ts
import api from './api';

export interface Product {
  product_id: number;
  product_code: string;
  product_name: string;
  category: string;
  unit_price: number;
  stock_quantity: number;
  min_stock_level: number;
  is_active: boolean;
  image_url?: string;
}

export interface VanStock {
  van_stock_id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  available_quantity: number;
  unit_price: number;
  last_updated: string;
}

const productService = {
  // Get all products
  getProducts: async (category?: string, search?: string): Promise<Product[]> => {
    try {
      const response: any = await api.get('/products', {
        params: { category, search }
      });
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('Get products error:', error);
      return [];
    }
  },

  // Get product by ID
  getProductById: async (productId: number): Promise<Product | null> => {
    try {
      const response: any = await api.get(`/products/${productId}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Get product by ID error:', error);
      return null;
    }
  },

  // Get van stock for sales rep
  getVanStock: async (): Promise<VanStock[]> => {
    try {
      const response: any = await api.get('/van-stock');
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('Get van stock error:', error);
      return [];
    }
  },

  // Get product categories
  getCategories: async (): Promise<string[]> => {
    try {
      const response: any = await api.get('/products/categories');
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('Get categories error:', error);
      return [];
    }
  },
};

export default productService;