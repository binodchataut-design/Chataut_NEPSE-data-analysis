import { mockMarketIndices, mockSectors } from '../data/mockData';
export const marketService = {
  async getIndices() { return mockMarketIndices; },
  async getSectors() { return mockSectors; }
};
