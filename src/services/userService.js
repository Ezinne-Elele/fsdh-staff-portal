import api from './api';

export const userService = {
  async getUsers(params = {}) {
    const response = await api.get('/api/users', { params });
    return response.data;
  },

  async getUser(userId) {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },

  async createUser(data) {
    const response = await api.post('/api/users', data);
    return response.data;
  },

  async updateUser(userId, data) {
    const response = await api.put(`/api/users/${userId}`, data);
    return response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/api/users/${userId}`);
    return response.data;
  },

  async updateUserStatus(userId, isActive) {
    const response = await api.patch(`/api/users/${userId}/status`, { isActive });
    return response.data;
  },
};

