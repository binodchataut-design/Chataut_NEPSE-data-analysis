import { IBrokerDataProvider } from '../interfaces';
import { BrokerMaster, BrokerTransactionRecord, ProviderStatusInfo } from '../../types/dataInfrastructure';
import { normalizedBrokers, normalizedBrokerTransactions } from '../../data/normalizedMasterData';

export class MockBrokerDataProvider implements IBrokerDataProvider {
  public readonly providerName = 'MockBrokerDataProvider';
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

  public async fetchBrokers(): Promise<BrokerMaster[]> {
    return [...normalizedBrokers];
  }

  public async fetchBrokerTransactions(symbolOrId?: string, date?: string): Promise<BrokerTransactionRecord[]> {
    let result = [...normalizedBrokerTransactions];
    if (symbolOrId) {
      const key = symbolOrId.toUpperCase();
      result = result.filter(t => t.symbol.toUpperCase() === key || t.company_id === symbolOrId);
    }
    if (date) {
      result = result.filter(t => t.date === date);
    }
    return result;
  }
}
