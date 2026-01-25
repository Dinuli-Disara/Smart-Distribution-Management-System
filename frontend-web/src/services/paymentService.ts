// frontend-web/src/services/paymentService.ts
import api from './api';

const paymentService = {
  // Record customer payment
  recordCustomerPayment: async (data: any) => {
    return await api.post('/payments/customer', data);
  },

  // Get customer payments
  getCustomerPayments: async (customerId: number) => {
    return await api.get(`/payments/customer/${customerId}`);
  },

  // Record manufacturer payment
  recordManufacturerPayment: async (data: any) => {
    return await api.post('/payments/manufacturer', data);
  },

  // Get pending cheques
  getPendingCheques: async (days?: number) => {
    const params = days ? `?days=${days}` : '';
    return await api.get(`/payments/cheques/pending${params}`);
  },

  // Update cheque status
  updateChequeStatus: async (chequeId: number, data: any) => {
    return await api.put(`/payments/cheques/${chequeId}/status`, data);
  },

  // Get payment aging report
  getPaymentAging: async () => {
    return await api.get('/payments/aging');
  }
};

export default paymentService;