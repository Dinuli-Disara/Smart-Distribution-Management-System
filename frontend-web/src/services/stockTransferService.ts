// frontend-web/src/services/stockTransferService.ts
import api from './api';

const stockTransferService = {
  // Get all transfers
  getAllTransfers: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return await api.get(`/stock-transfers${params}`);
  },

  // Get pending transfers
  getPendingTransfers: async () => {
    return await api.get('/stock-transfers/pending');
  },

  // Get available stock for transfer (products with stock in store)
  getAvailableStock: async () => {
    return await api.get('/stock-transfers/available-stock');
  },

  // Create stock transfer request
  createTransfer: async (data: any) => {
    return await api.post('/stock-transfers', data);
  },

  // Get single transfer details
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