import { IBrokerDataProvider } from '../interfaces';
import { ProviderStatusInfo, BrokerTransactionRecord } from '../../types/dataInfrastructure';

export class MockBrokerDataProvider implements IBrokerDataProvider {
  public readonly providerName = 'Mock Broker Data Provider';
  public readonly isLive = false;

  public getStatus(): ProviderStatusInfo {
    return {
      providerStatus: 'MOCK_DATA',
      reason: 'Running on mock broker data.',
      timestamp: new Date().toISOString(),
      gateway: this.providerName,
      authenticated: false,
    };
  }

  public async fetchBrokerTransactions(symbol: string): Promise<BrokerTransactionRecord[]> {
    return [];
  }
}
