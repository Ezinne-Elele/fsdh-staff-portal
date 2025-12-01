import api from './api';

export const tradeService = {
  async getTrades(params = {}) {
    const response = await api.get('/api/trades', { params });
    return response.data;
  },

  async getTrade(tradeId) {
    const response = await api.get(`/api/trades/${tradeId}`);
    return response.data;
  },

  async validateTrade(tradeId) {
    const response = await api.post(`/api/trades/${tradeId}/validate`);
    return response.data;
  },

  async matchTrade(tradeId) {
    const response = await api.post(`/api/trades/${tradeId}/match`);
    return response.data;
  },

  async settleTrade(tradeId) {
    const response = await api.post(`/api/trades/${tradeId}/settle`);
    return response.data;
  },

  async cancelTrade(tradeId) {
    const response = await api.post(`/api/trades/${tradeId}/cancel`);
    return response.data;
  },

  async getInstruments(params = {}) {
    const response = await api.get('/api/instruments', { params });
    return response.data;
  },
};

