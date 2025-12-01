import api from './api';

export const reconciliationService = {
  async getReconciliations(params = {}) {
    const response = await api.get('/api/reconciliations', { params });
    return response.data;
  },

  async getReconciliation(reconciliationId) {
    const response = await api.get(`/api/reconciliations/${reconciliationId}`);
    return response.data;
  },

  async resolveReconciliation(reconciliationId, data) {
    const response = await api.post(`/api/reconciliations/${reconciliationId}/resolve`, data);
    return response.data;
  },
};

