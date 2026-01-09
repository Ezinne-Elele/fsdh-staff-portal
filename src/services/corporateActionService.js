import api from './api';

export const corporateActionService = {
  async getCorporateActions(params = {}) {
    const response = await api.get('/api/corporate-actions', { params });
    return response.data;
  },

  async getCorporateAction(actionId) {
    const response = await api.get(`/api/corporate-actions/${actionId}`);
    return response.data;
  },

  async createCorporateAction(data) {
    const response = await api.post('/api/corporate-actions', data);
    return response.data;
  },

  async fetchExternalActions(source, date) {
    const response = await api.post('/api/corporate-actions/fetch-external', { source, date });
    return response.data;
  },

  async calculateEntitlements(actionId) {
    const response = await api.post(`/api/corporate-actions/${actionId}/calculate-entitlements`);
    return response.data;
  },
};


