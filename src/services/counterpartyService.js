import api from './api';

export const counterpartyService = {
  // Get all counterparties
  async getCounterparties(params = {}) {
    try {
      const { type, status, page = 1, limit = 100 } = params;
      const queryParams = new URLSearchParams();
      
      if (type) queryParams.append('type', type);
      if (status) queryParams.append('status', status);
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      
      const response = await api.get(`/api/counterparties?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching counterparties:', error);
      throw error;
    }
  },

  // Get counterparty by ID
  async getCounterparty(counterpartyId) {
    try {
      const response = await api.get(`/api/counterparties/${counterpartyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching counterparty:', error);
      throw error;
    }
  },
};

