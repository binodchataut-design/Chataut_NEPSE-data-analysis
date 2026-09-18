import { providerRegistry } from '../providers/providerRegistry';
import { LiveDataSourceUnavailableError } from '../types/dataInfrastructure';

export const fundamentalService = {
  async getMetrics(symbol: string) {
    if (providerRegistry.isLiveMode()) {
      throw new LiveDataSourceUnavailableError('Fundamental data not available in this mode');
    }
    return {
      symbol,
      eps: 25.4,
      peRatio: 18.5,
      bookValuePerShare: 150.0,
      pbRatio: 2.1,
      roe: 14.2,
      roa: 3.5,
      debtToEquity: 0.8,
      netProfitGrowthYoY: 12.5,
      dividendYield: 4.2,
    };
  },
  async getScoreForSymbol(symbol: string) {
    if (providerRegistry.isLiveMode()) {
      throw new LiveDataSourceUnavailableError('Fundamental score not available in this mode');
    }
    return {
      totalScore: 78,
      grade: 'B+',
      valuationScore: 80,
      profitabilityScore: 75,
      solvencyScore: 80,
    };
  },
  calculateFundamentalScore(metrics: any) {
    return {
      totalScore: 78,
      grade: 'B+',
    };
  },
  async fetchFinancialStatements(symbol: string) {
    if (providerRegistry.isLiveMode()) {
      throw new LiveDataSourceUnavailableError('Financial statements not available in this mode');
    }
    return [];
  }
};
