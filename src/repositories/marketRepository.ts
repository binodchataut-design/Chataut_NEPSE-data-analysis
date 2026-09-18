import { mockMarketIndices } from '../data/mockData';

export const marketRepository = {
  async getIndices() {
    return mockMarketIndices;
  }
};
