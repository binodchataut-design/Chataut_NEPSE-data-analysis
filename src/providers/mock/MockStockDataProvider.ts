import { IStockDataProvider } from '../interfaces';
import { CompanyMaster, HistoricalPriceRecord, ProviderStatusInfo } from '../../types/dataInfrastructure';
import { normalizedCompanies, normalizedPrices } from '../../data/normalizedMasterData';

export class MockStockDataProvider implements IStockDataProvider {
  public readonly providerName = 'MockStockDataProvider';
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

  public async fetchCompanies(): Promise<CompanyMaster[]> {
    return [...normalizedCompanies];
  }

  public async fetchPriceHistory(symbolOrId: string, limit?: number): Promise<HistoricalPriceRecord[]> {
    const key = symbolOrId.toUpperCase();
    const matches = normalizedPrices.filter(
      p => p.symbol.toUpperCase() === key || p.company_id === symbolOrId
    );
    // Sort descending by date
    const sorted = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  public async fetchLatestPrice(symbolOrId: string): Promise<HistoricalPriceRecord | null> {
    const history = await this.fetchPriceHistory(symbolOrId, 1);
    return history.length > 0 ? history[0] : null;
  }
}
