// frontend-web/src/services/stockTransferService.ts
import api from './api';

const stockTransferService = {
  // Get available stock for transfer (products with stock in store)
  getAvailableStock: async () => {
    return await api.get('/stock-transfers/available-stock');
  },

  // Create stock transfer
  createTransfer: async (data: any) => {
    return await api.post('/stock-transfers', data);
  },

  // Get transfer details
  getTransfer: async (id: number) => {
    return await api.get(`/stock-transfers/${id}`);
  },

  // Approve transfer
  approveTransfer: async (id: number, notes?: string) => {
    return await api.put(`/stock-transfers/${id}/approve`, { notes });
  },

  // Reject transfer
  rejectTransfer: async (id: number, notes?: string) => {
    return await api.put(`/stock-transfers/${id}/reject`, { notes });
  }
};

export default stockTransferService;