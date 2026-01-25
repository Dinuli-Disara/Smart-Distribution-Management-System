// frontend-web/src/services/inventoryService.ts
import api from './api';

const inventoryService = {
  // Get inventory summary
  getSummary: async () => {
    return await api.get('/inventory/summary');
  },

  // Get store inventory
  getStoreInventory: async () => {
    return await api.get('/inventory/store');
  },

  // Get van inventory
  getVanInventory: async () => {
    return await api.get('/inventory/vans');
  },

  // Get inventory by location
  getInventoryByLocation: async (locationId: number) => {
    return await api.get(`/inventory/location/${locationId}`);
  },

  // Receive stock
  receiveStock: async (data: any) => {
    return await api.post('/inventory/receive', data);
  }
};

export default inventoryService;