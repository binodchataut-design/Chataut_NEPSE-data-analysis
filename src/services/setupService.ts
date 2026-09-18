import { SetupDetection, SetupType } from '../types';
import { mockDetectedSetups } from '../data/mockData';

export const setupService = {
  async getDetectedSetups(): Promise<SetupDetection[]> {
    return mockDetectedSetups;
  },
  async getSetupsForStock(symbol: string): Promise<SetupDetection[]> {
    const sym = symbol.toUpperCase().trim();
    return mockDetectedSetups.filter(s => s.symbol.toUpperCase() === sym);
  },
  async getSetupTypes(): Promise<Array<{ type: SetupType; label: string; description: string }>> {
    return [
      {
        type: 'BREAKOUT_VOLUME',
        label: 'Breakout + Volume Expansion',
        description: 'Multi-week resistance breakout backed by expanding turnover (>1.5x average)',
      },
      {
        type: 'PULLBACK_EMA',
        label: 'Pullback to 20 EMA',
        description: 'Orderly pullback to 20-day exponential moving average in an established uptrend',
      },
      {
        type: 'SUPPORT_BOUNCE',
        label: 'Support Bounce + Divergence',
        description: 'Reversal off structural support with bullish RSI or MACD momentum divergence',
      },
      {
        type: 'ACCUMULATION_BASE',
        label: 'Stage 1 Accumulation Base',
        description: 'Tight volatility contraction base with institutional broker accumulation footprint',
      },
      {
        type: 'MOMENTUM_CONTINUATION',
        label: 'Momentum Continuation',
        description: 'High relative strength continuation setup following a shallow consolidation',
      },
      {
        type: 'REVERSAL',
        label: 'Selling Exhaustion Reversal',
        description: 'Capitulation volume spike near multi-month support with immediate reclaim',
      },
    ];
  }
};

