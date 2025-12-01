import api from './api';

export const auditService = {
  async getAuditLogs(params = {}) {
    const response = await api.get('/api/audit', { params });
    return response.data;
  },
};

