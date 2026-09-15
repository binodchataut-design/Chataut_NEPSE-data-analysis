import { MarketIndexRecord, DailyMarketStatistics } from '../types/dataInfrastructure';
import { providerRegistry } from '../providers/providerRegistry';
import { normalizedIndices, normalizedDailyStats } from '../data/normalizedMasterData';

export class MarketRepository {
  public async getIndices(date?: string): Promise<MarketIndexRecord[]> {
    if (providerRegistry.getMode() === 'MOCK_DATA') {
      if (!date) return [...normalizedIndices];
      return normalizedIndices.filter(i => i.date === date);
    }
    // Live mode: strictly call live provider. Never substitute mock data.
    const provider = providerRegistry.getMarketProvider();
    return provider.fetchIndices(date);
  }

  public async getIndex(symbol: string): Promise<MarketIndexRecord | null> {
    const indices = await this.getIndices();
    const found = indices.find(i => i.index_id.toUpperCase() === symbol.toUpperCase());
    return found || null;
  }

  public async getDailyStatistics(date?: string): Promise<DailyMarketStatistics> {
    if (providerRegistry.getMode() === 'MOCK_DATA') {
      return { ...normalizedDailyStats };
    }
    // Live mode: strictly call live provider. Never substitute mock data.
    const provider = providerRegistry.getMarketProvider();
    return provider.fetchDailyStatistics(date);
  }
}

export const marketRepository = new MarketRepository();
