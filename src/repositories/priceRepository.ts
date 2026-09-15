import { HistoricalPriceRecord } from '../types/dataInfrastructure';
import { providerRegistry } from '../providers/providerRegistry';
import { normalizedPrices } from '../data/normalizedMasterData';

export class PriceRepository {
  public async getHistoricalPrices(symbolOrId: string, limit?: number): Promise<HistoricalPriceRecord[]> {
    if (providerRegistry.getMode() === 'MOCK_DATA') {
      const clean = symbolOrId.toUpperCase();
      const filtered = normalizedPrices.filter(p => p.symbol === clean || p.company_id === symbolOrId);
      const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return limit ? sorted.slice(0, limit) : sorted;
    }
    // Live mode: strictly call live provider. Never silently substitute mock data.
    const provider = providerRegistry.getStockProvider();
    return provider.fetchPriceHistory(symbolOrId, limit);
  }

  public async getLatestPrice(symbolOrId: string): Promise<HistoricalPriceRecord | null> {
    if (providerRegistry.getMode() === 'MOCK_DATA') {
      const history = await this.getHistoricalPrices(symbolOrId, 1);
      return history.length > 0 ? history[0] : null;
    }
    // Live mode: strictly call live provider. Never silently substitute mock data.
    const provider = providerRegistry.getStockProvider();
    return provider.fetchLatestPrice(symbolOrId);
  }

  public async getPriceRange(
    symbolOrId: string,
    fromDate: string,
    toDate: string
  ): Promise<HistoricalPriceRecord[]> {
    const all = await this.getHistoricalPrices(symbolOrId);
    return all.filter(p => p.date >= fromDate && p.date <= toDate);
  }

  public async getLatestTradingDate(): Promise<string> {
    if (providerRegistry.getMode() === 'MOCK_DATA') {
      const dates = normalizedPrices.map(p => p.date);
      if (dates.length === 0) return '2026-09-11';
      dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      return dates[0];
    }
    // Live mode
    const latest = await this.getAllLatestPrices();
    if (latest.length > 0) return latest[0].date;
    return new Date().toISOString().substring(0, 10);
  }

  public async getAllLatestPrices(): Promise<HistoricalPriceRecord[]> {
    if (providerRegistry.getMode() === 'MOCK_DATA') {
      const map = new Map<string, HistoricalPriceRecord>();
      for (const p of normalizedPrices) {
        const existing = map.get(p.symbol);
        if (!existing || new Date(p.date) > new Date(existing.date)) {
          map.set(p.symbol, p);
        }
      }
      return Array.from(map.values());
    }
    // Live mode: strictly call live provider.
    const provider = providerRegistry.getStockProvider();
    const companies = await provider.fetchCompanies();
    const prices: HistoricalPriceRecord[] = [];
    for (const c of companies) {
      const p = await provider.fetchLatestPrice(c.symbol);
      if (p) prices.push(p);
    }
    return prices;
  }
}

export const priceRepository = new PriceRepository();
