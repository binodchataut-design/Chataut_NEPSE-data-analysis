import { BrokerMaster, BrokerTransactionRecord } from '../types/dataInfrastructure';
import { providerRegistry } from '../providers/providerRegistry';
import { normalizedBrokers, normalizedBrokerTransactions } from '../data/normalizedMasterData';

export class BrokerRepository {
  public async getAllBrokers(): Promise<BrokerMaster[]> {
    if (providerRegistry.getMode() === 'MOCK_DATA') {
      return [...normalizedBrokers];
    }
    // Live mode: strictly call live provider. Never substitute mock data.
    const provider = providerRegistry.getBrokerProvider();
    return provider.fetchBrokers();
  }

  public async getBrokerByNumber(brokerNumber: number): Promise<BrokerMaster | null> {
    const brokers = await this.getAllBrokers();
    return brokers.find(b => b.broker_number === brokerNumber) || null;
  }

  public async getBrokerTransactions(symbolOrId?: string, date?: string): Promise<BrokerTransactionRecord[]> {
    if (providerRegistry.getMode() === 'MOCK_DATA') {
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
    // Live mode: strictly call live provider. Never substitute mock data.
    const provider = providerRegistry.getBrokerProvider();
    return provider.fetchBrokerTransactions(symbolOrId, date);
  }
}

export const brokerRepository = new BrokerRepository();
