import { getCachedBars, getCachedCompany, getCachedCompanies } from '../data/liveBarsCache';

export const stockService = {
  async getHistory(symbol: string) {
    return getCachedBars(symbol);
  },
  async getHistoricalPrices(symbol: string) {
    return getCachedBars(symbol);
  },
  async getCompany(symbol: string) {
    return getCachedCompany(symbol);
  },
  async getAllCompanies() {
    return getCachedCompanies();
  }
};
