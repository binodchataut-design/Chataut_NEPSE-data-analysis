import { RawFinancialStatement } from '../types/dataInfrastructure';
import { providerRegistry } from '../providers/providerRegistry';
import { normalizedRawFinancials } from '../data/normalizedMasterData';

export class FundamentalRepository {
  public async getRawFinancialStatements(symbolOrId: string): Promise<RawFinancialStatement[]> {
    if (providerRegistry.getMode() === 'MOCK_DATA') {
      const key = symbolOrId.toUpperCase();
      return normalizedRawFinancials.filter(
        f => f.symbol.toUpperCase() === key || f.company_id === symbolOrId
      );
    }
    // Live mode: strictly call live provider. Never substitute mock data.
    const provider = providerRegistry.getFundamentalProvider();
    return provider.fetchFinancialStatements(symbolOrId);
  }

  public async getLatestStatement(symbolOrId: string): Promise<RawFinancialStatement | null> {
    const all = await this.getRawFinancialStatements(symbolOrId);
    if (all.length === 0) return null;
    return all[0];
  }
}

export const fundamentalRepository = new FundamentalRepository();
