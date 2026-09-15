import { IFundamentalDataProvider } from '../interfaces';
import { RawFinancialStatement, ProviderStatusInfo } from '../../types/dataInfrastructure';
import { normalizedRawFinancials } from '../../data/normalizedMasterData';

export class MockFundamentalDataProvider implements IFundamentalDataProvider {
  public readonly providerName = 'MockFundamentalDataProvider';
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

  public async fetchFinancialStatements(symbolOrId: string): Promise<RawFinancialStatement[]> {
    const key = symbolOrId.toUpperCase();
    return normalizedRawFinancials.filter(
      f => f.symbol.toUpperCase() === key || f.company_id === symbolOrId
    );
  }
}
