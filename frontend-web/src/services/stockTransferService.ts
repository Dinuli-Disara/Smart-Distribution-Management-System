// frontend-web/src/services/stockTransferService.ts
import api from './api';

const stockTransferService = {
  // Get all transfers
  getAllTransfers: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return await api.get(`/stock-transfers${params}`);
  },

  // Get single transfer
  getTransfer: async (id: number) => {
    return await api.get(`/stock-transfers/${id}`);
  },

  // Create transfer
  createTransfer: async (data: any) => {
    return await api.post('/stock-transfers', data);
  },

  // Get available stock for transfer
  getAvailableStock: async () => {
    return await api.get('/stock-transfers/available-stock');
  }
};

export default stockTransferService;