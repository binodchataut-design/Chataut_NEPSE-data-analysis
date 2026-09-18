import { providerRegistry } from '../providers/providerRegistry';
import { LiveDataSourceUnavailableError } from '../types/dataInfrastructure';

export const brokerService = {
  async getStockBrokerConcentration(symbol: string) {
    if (providerRegistry.isLiveMode()) {
      throw new LiveDataSourceUnavailableError('Broker concentration data not available in this mode');
    }
    return {
      symbol,
      topBuyerBroker: 58,
      topSellerBroker: 45,
      buyerAccumulationScore: 65,
    };
  },
  async fetchBrokerTransactions(symbol: string) {
    if (providerRegistry.isLiveMode()) {
      throw new LiveDataSourceUnavailableError('Broker transactions not available in this mode');
    }
    return [];
  }
};
