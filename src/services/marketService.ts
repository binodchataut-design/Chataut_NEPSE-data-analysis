import { mockMarketIndices, mockSectors, mockMarketBreadth } from '../data/mockData';
import { MarketIndex, Sector, MarketBreadth } from '../types';

export const marketService = {
  async getIndices(): Promise<MarketIndex[]> {
    return mockMarketIndices;
  },
  async getMarketIndices(): Promise<MarketIndex[]> {
    return mockMarketIndices;
  },
  async getSectors(): Promise<Sector[]> {
    return mockSectors;
  },
  async getMarketBreadth(): Promise<MarketBreadth> {
    return mockMarketBreadth;
  }
};

