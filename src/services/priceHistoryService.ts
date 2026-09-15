import { HistoricalPriceRecord } from '../types/dataInfrastructure';
import { priceRepository } from '../repositories/priceRepository';

export class PriceHistoryService {
  public async getHistoricalPrices(
    symbolOrId: string,
    limit?: number
  ): Promise<HistoricalPriceRecord[]> {
    return priceRepository.getHistoricalPrices(symbolOrId, limit);
  }

  public async getLatestPrice(symbolOrId: string): Promise<HistoricalPriceRecord | null> {
    return priceRepository.getLatestPrice(symbolOrId);
  }

  public async getPriceRange(
    symbolOrId: string,
    fromDate: string,
    toDate: string
  ): Promise<HistoricalPriceRecord[]> {
    return priceRepository.getPriceRange(symbolOrId, fromDate, toDate);
  }

  public async getLatestTradingDate(): Promise<string> {
    return priceRepository.getLatestTradingDate();
  }

  public calculatePriceChange(
    currentClose: number,
    previousClose: number
  ): { change: number; changePercent: number } {
    const change = Math.round((currentClose - previousClose) * 100) / 100;
    const changePercent =
      previousClose > 0 ? Math.round(((currentClose - previousClose) / previousClose) * 10000) / 100 : 0;
    return { change, changePercent };
  }
}

export const priceHistoryService = new PriceHistoryService();
