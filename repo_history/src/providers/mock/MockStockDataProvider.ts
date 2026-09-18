import { IStockDataProvider } from '../interfaces';
import { CompanyMaster, HistoricalPriceRecord, ProviderStatusInfo } from '../../types/dataInfrastructure';
import { normalizedCompanies, getNormalizedStockBars } from '../../data/normalizedMasterData';

export class MockStockDataProvider implements IStockDataProvider {
  public readonly providerName = 'Mock Stock Data Provider';
  public readonly isLive = false;

  public getStatus(): ProviderStatusInfo {
    return {
      providerStatus: 'MOCK_DATA',
      reason: 'Running on normalized mock stock data.',
      timestamp: new Date().toISOString(),
      gateway: this.providerName,
      authenticated: false,
    };
  }

  public async fetchCompanies(): Promise<CompanyMaster[]> {
    return normalizedCompanies;
  }

  public async fetchPriceHistory(symbol: string, limit?: number): Promise<HistoricalPriceRecord[]> {
    const bars = getNormalizedStockBars(symbol);
    const records: HistoricalPriceRecord[] = bars.map((b, idx, arr) => {
      const nextOlder = arr[idx + 1];
      const prevClose = nextOlder ? nextOlder.close : b.open;
      const change = Math.round((b.close - prevClose) * 100) / 100;
      const change_percent = prevClose !== 0 ? Math.round(((change / prevClose) * 100) * 100) / 100 : 0;
      return {
        id: `mock-pr-${symbol}-${b.date}`,
        company_id: symbol,
        symbol,
        date: b.date,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        previous_close: prevClose,
        change,
        change_percent,
        volume: b.volume,
        turnover: Math.round(b.close * b.volume),
        transactions: 100,
        possible_corporate_action: false,
        created_at: b.date,
      };
    });

    return limit ? records.slice(0, limit) : records;
  }
}
