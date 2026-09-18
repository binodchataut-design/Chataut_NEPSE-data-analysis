import { IMarketDataProvider } from '../interfaces';
import { ProviderStatusInfo } from '../../types/dataInfrastructure';

export class MockMarketDataProvider implements IMarketDataProvider {
  public readonly providerName = 'Mock Market Data Provider';
  public readonly isLive = false;

  public getStatus(): ProviderStatusInfo {
    return {
      providerStatus: 'MOCK_DATA',
      reason: 'Running on local mock market data for testing and offline analysis.',
      timestamp: new Date().toISOString(),
      gateway: this.providerName,
      authenticated: false,
    };
  }
}
