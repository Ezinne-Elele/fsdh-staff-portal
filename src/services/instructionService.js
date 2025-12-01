import api from './api';

const primaryBase = '/api/instructions';
const legacyBase = '/api/trades/instructions';

const getWithFallback = async (path = '', config = {}) => {
  try {
    return await api.get(`${primaryBase}${path}`, config);
  } catch (error) {
    if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      return await api.get(`${legacyBase}${path}`, config);
    }
    throw error;
  }
};

const postWithFallback = async (path = '', payload) => {
  try {
    return await api.post(`${primaryBase}${path}`, payload);
  } catch (error) {
    if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      return await api.post(`${legacyBase}${path}`, payload);
    }
    throw error;
  }
};

export const instructionService = {
  async getInstructions(params = {}) {
    const response = await getWithFallback('', { params });
    return response.data;
  },

  async getInstruction(instructionId) {
    const response = await getWithFallback(`/${instructionId}`);
    return response.data;
  },

  async createInstruction(data) {
    const response = await postWithFallback('', data);
    return response.data;
  },

  async submitInstruction(instructionId, comments) {
    const response = await postWithFallback(`/${instructionId}/submit`, { comments });
    return response.data;
  },

  async approveInstruction(instructionId, comments) {
    const response = await postWithFallback(`/${instructionId}/approve`, { comments });
    return response.data;
  },

  async rejectInstruction(instructionId, reason) {
    const response = await postWithFallback(`/${instructionId}/reject`, { reason });
    return response.data;
  },

  async completeInstruction(instructionId) {
    const response = await postWithFallback(`/${instructionId}/complete`);
    return response.data;
  },
};


