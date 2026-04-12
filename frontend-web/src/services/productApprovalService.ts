// frontend-web/src/services/productApprovalService.ts
import api from './api';

const productApprovalService = {
  // Create a new product request (Clerk)
  createRequest: async (data: any) => {
    return await api.post('/product-approvals/request', data);
  },

  // Get pending requests (Owner)
  getPendingRequests: async () => {
    return await api.get('/product-approvals/pending');
  },

  // Get all requests with optional status filter (Owner)
  getAllRequests: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return await api.get(`/product-approvals${params}`);
  },

  // Get single request
  getRequest: async (id: number) => {
    return await api.get(`/product-approvals/${id}`);
  },

  // Approve request (Owner)
  approveRequest: async (id: number, notes?: string) => {
    return await api.put(`/product-approvals/${id}/approve`, { notes });
  },

  // Reject request (Owner)
  rejectRequest: async (id: number, notes?: string) => {
    return await api.put(`/product-approvals/${id}/reject`, { notes });
  }
};

export default productApprovalService;