// frontend-web/src/services/stockReceiveApprovalService.ts
import api from './api';

const stockReceiveApprovalService = {
  // Create a new stock receive request (Clerk)
  createReceiveRequest: async (data: any) => {
    return await api.post('/stock-receive-approvals/request', data);
  },

  // Get pending receive requests (Owner)
  getPendingReceiveRequests: async () => {
    return await api.get('/stock-receive-approvals/pending');
  },

  // Get all receive requests with optional status filter (Owner)
  getAllReceiveRequests: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return await api.get(`/stock-receive-approvals${params}`);
  },

  // Get single receive request with items
  getReceiveRequest: async (id: number) => {
    return await api.get(`/stock-receive-approvals/${id}`);
  },

  // Approve receive request (Owner)
  approveReceiveRequest: async (id: number, data?: any) => {
    return await api.put(`/stock-receive-approvals/${id}/approve`, data);
  },

  // Reject receive request (Owner)
  rejectReceiveRequest: async (id: number, notes?: string) => {
    return await api.put(`/stock-receive-approvals/${id}/reject`, { notes });
  }
};

export default stockReceiveApprovalService;