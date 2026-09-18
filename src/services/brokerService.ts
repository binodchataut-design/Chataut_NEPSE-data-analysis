import { providerRegistry } from '../providers/providerRegistry';
import { LiveDataSourceUnavailableError } from '../types/dataInfrastructure';
import { BrokerActivity, StockBrokerConcentration } from '../types';
import { mockBrokerActivities, mockConcentrationCHCL } from '../data/mockData';

export const brokerService = {
  async getTopBrokers(): Promise<BrokerActivity[]> {
    return mockBrokerActivities;
  },
  async getStockBrokerConcentration(symbol: string): Promise<StockBrokerConcentration> {
    if (providerRegistry.isLiveMode()) {
      throw new LiveDataSourceUnavailableError('Broker concentration data not available in this mode');
    }
    const sym = symbol.toUpperCase().trim();
    if (sym === 'CHCL') {
      return mockConcentrationCHCL;
    }
    return {
      symbol: sym,
      topBuyerBroker: 58,
      topSellerBroker: 45,
      top5BuyerSharePercent: 52.3,
      top5SellerSharePercent: 31.8,
      institutionalAccumulationStatus: 'ACCUMULATION',
      brokerScore: 72,
    };
  },
  async fetchBrokerTransactions(symbol: string) {
    if (providerRegistry.isLiveMode()) {
      throw new LiveDataSourceUnavailableError('Broker transactions not available in this mode');
    }
    return [];
  }
};

