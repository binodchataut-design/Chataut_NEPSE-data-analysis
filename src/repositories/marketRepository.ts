import { mockMarketIndices } from '../data/mockData';
import { providerRegistry } from '../providers/providerRegistry';

export const marketRepository = {
  async getIndices(date?: string) {
    const mode = providerRegistry.getMode();
    if (mode === 'SUPABASE' || mode === 'REAL_DATA') {
      const provider = providerRegistry.getMarketProvider() as any;
      return provider.fetchIndices(date);
    }
    return mockMarketIndices;
  }
};

