import api from './api';

export const reportService = {
  async getReportTypes() {
    const response = await api.get('/api/reports/types');
    return response.data;
  },

  async generateReport(reportType, filters = {}, format = 'json') {
    const response = await api.post('/api/reports/generate', {
      reportType,
      filters,
      format,
    });
    return response.data;
  },

  async getKPIs(params = {}) {
    const response = await api.get('/api/reports/kpis', { params });
    return response.data;
  },

  async scheduleReport(data) {
    const response = await api.post('/api/reports/schedule', data);
    return response.data;
  },

  async getDashboardSummary() {
    const response = await api.get('/api/reports/dashboard/summary');
    return response.data;
  },
};

