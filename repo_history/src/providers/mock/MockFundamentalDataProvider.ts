import { IFundamentalDataProvider } from '../interfaces';
import { ProviderStatusInfo, RawFinancialStatement } from '../../types/dataInfrastructure';

export class MockFundamentalDataProvider implements IFundamentalDataProvider {
  public readonly providerName = 'Mock Fundamental Data Provider';
  public readonly isLive = false;

  public getStatus(): ProviderStatusInfo {
    return {
      providerStatus: 'MOCK_DATA',
      reason: 'Running on mock fundamental data.',
      timestamp: new Date().toISOString(),
      gateway: this.providerName,
      authenticated: false,
    };
  }

  public async fetchFinancialStatements(symbol: string): Promise<RawFinancialStatement[]> {
    return [];
  }
}
