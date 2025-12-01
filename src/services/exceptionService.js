import api from './api';

export const exceptionService = {
  async getExceptions(params = {}) {
    const response = await api.get('/api/exceptions', { params });
    return response.data;
  },

  async getException(exceptionId) {
    const response = await api.get(`/api/exceptions/${exceptionId}`);
    return response.data;
  },

  async assignException(exceptionId, assignedTo) {
    const response = await api.post(`/api/exceptions/${exceptionId}/assign`, { assignedTo });
    return response.data;
  },

  async resolveException(exceptionId, data) {
    const response = await api.post(`/api/exceptions/${exceptionId}/resolve`, data);
    return response.data;
  },

  async approveClosure(exceptionId) {
    const response = await api.post(`/api/exceptions/${exceptionId}/approve`);
    return response.data;
  },

  async getDashboardSummary() {
    const response = await api.get('/api/exceptions/dashboard/summary');
    return response.data;
  },
};


