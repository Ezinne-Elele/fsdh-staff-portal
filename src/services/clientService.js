import api from './api';

export const clientService = {
  async getClients(params = {}) {
    const response = await api.get('/api/clients', { params });
    return response.data;
  },

  async getClient(clientId) {
    const response = await api.get(`/api/clients/${clientId}`);
    return response.data;
  },

  async createClient(data) {
    const response = await api.post('/api/clients', data);
    return response.data;
  },

  async updateClient(clientId, data) {
    const response = await api.put(`/api/clients/${clientId}`, data);
    return response.data;
  },

  async validateKYC(clientId) {
    const response = await api.post(`/api/clients/${clientId}/validate-kyc`);
    return response.data;
  },

  async syncFlexcube(clientId) {
    const response = await api.post(`/api/clients/${clientId}/sync-flexcube`);
    return response.data;
  },

  async requestClosure(clientId, reason) {
    const response = await api.post(`/api/clients/${clientId}/request-closure`, { reason });
    return response.data;
  },

  async approveClosure(clientId) {
    const response = await api.post(`/api/clients/${clientId}/approve-closure`);
    return response.data;
  },
};

