import api from './api';

export const settlementInstructionService = {
  // Get all settlement instructions
  async getSettlementInstructions(params = {}) {
    try {
      const { status, instructionType, page = 1, limit = 50 } = params;
      const queryParams = new URLSearchParams();
      
      if (status) queryParams.append('status', status);
      if (instructionType) queryParams.append('instructionType', instructionType);
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      
      const response = await api.get(`/api/settlement-instructions?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching settlement instructions:', error);
      throw error;
    }
  },

  // Get settlement instruction by ID
  async getSettlementInstruction(instructionId) {
    try {
      const response = await api.get(`/api/settlement-instructions/${instructionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching settlement instruction:', error);
      throw error;
    }
  },

  // Get settlement instructions by trade ID
  async getSettlementInstructionsByTradeId(tradeId) {
    try {
      const response = await api.get(`/api/settlement-instructions/trade/${tradeId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching settlement instructions by trade:', error);
      throw error;
    }
  },

};

