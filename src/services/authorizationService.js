import api from './api';

export const authorizationService = {
  // Get all pending authorizations
  async getPendingAuthorizations(params = {}) {
    try {
      const { page = 1, limit = 50 } = params;
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      
      const response = await api.get(`/api/authorizations?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending authorizations:', error);
      throw error;
    }
  },

  // Get authorization by ID
  async getAuthorization(authorizationId, type = 'client_instruction') {
    try {
      const response = await api.get(`/api/authorizations/${authorizationId}?type=${type}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching authorization:', error);
      throw error;
    }
  },

  // Approve authorization
  async approveAuthorization(authorizationId, comments, type = 'client_instruction') {
    try {
      const response = await api.post(`/api/authorizations/${authorizationId}/approve`, {
        comments,
        type,
      });
      return response.data;
    } catch (error) {
      console.error('Error approving authorization:', error);
      throw error;
    }
  },

  // Reject authorization
  async rejectAuthorization(authorizationId, rejectionReason, type = 'client_instruction') {
    try {
      const response = await api.post(`/api/authorizations/${authorizationId}/reject`, {
        rejectionReason,
        type,
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting authorization:', error);
      throw error;
    }
  },
};

