import { MarketIndexRecord } from '../types/dataInfrastructure';
import { marketRepository } from '../repositories/marketRepository';

export class MarketIndexService {
  public async getIndices(date?: string): Promise<MarketIndexRecord[]> {
    return marketRepository.getIndices(date);
  }

  public async getIndexBySymbol(symbol: string): Promise<MarketIndexRecord | null> {
    return marketRepository.getIndex(symbol);
  }

  public async getSectorIndices(date?: string): Promise<MarketIndexRecord[]> {
    const all = await this.getIndices(date);
    const benchmarkSymbols = ['NEPSE', 'SENSITIVE', 'FLOAT', 'SEN_FLOAT'];
    return all.filter(i => !benchmarkSymbols.includes(i.index_id.toUpperCase()));
  }

  public async getBenchmarkIndices(date?: string): Promise<MarketIndexRecord[]> {
    const all = await this.getIndices(date);
    const benchmarkSymbols = ['NEPSE', 'SENSITIVE', 'FLOAT'];
    return all.filter(i => benchmarkSymbols.includes(i.index_id.toUpperCase()));
  }
}

export const marketIndexService = new MarketIndexService();
