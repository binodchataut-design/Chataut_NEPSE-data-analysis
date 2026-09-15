import { IMarketDataProvider } from '../interfaces';
import { MarketIndexRecord, DailyMarketStatistics, ProviderStatusInfo } from '../../types/dataInfrastructure';
import { normalizedIndices, normalizedDailyStats } from '../../data/normalizedMasterData';

export class MockMarketDataProvider implements IMarketDataProvider {
  public readonly providerName = 'MockMarketDataProvider';
  public readonly isLive = false;

  public getStatus(): ProviderStatusInfo {
    return {
      providerStatus: 'MOCK_DATA',
      reason: 'Standardized simulated reference dataset loaded for calculation validation.',
      timestamp: new Date().toISOString(),
      gateway: this.providerName,
      authenticated: true,
    };
  }

  public async fetchIndices(date?: string): Promise<MarketIndexRecord[]> {
    if (!date) return [...normalizedIndices];
    return normalizedIndices.filter(i => i.date === date);
  }

  public async fetchDailyStatistics(date?: string): Promise<DailyMarketStatistics> {
    return { ...normalizedDailyStats };
  }
}
