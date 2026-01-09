import api from './api';

export const userService = {
  // Get all users
  async getUsers(params = {}) {
    try {
      const { role, isActive, page = 1, limit = 50 } = params;
      const queryParams = new URLSearchParams();
      if (role) queryParams.append('role', role);
      if (isActive !== undefined) queryParams.append('isActive', isActive);
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      
      const response = await api.get(`/api/users?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user by ID
  async getUser(userId) {
    try {
      const response = await api.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Create user
  async createUser(userData) {
    try {
      const response = await api.post('/api/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/api/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user (soft delete)
  async deleteUser(userId) {
    try {
      const response = await api.delete(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Toggle user active status
  async toggleActive(userId) {
    try {
      const response = await api.post(`/api/users/${userId}/toggle-active`);
      return response.data;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },

  // Update user permissions
  async updatePermissions(userId, permissions) {
    try {
      const response = await api.put(`/api/users/${userId}/permissions`, { permissions });
      return response.data;
    } catch (error) {
      console.error('Error updating permissions:', error);
      throw error;
    }
  },
};
