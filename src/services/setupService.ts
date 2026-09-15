import { SetupDetection, SetupType } from '../types';
import { mockDetectedSetups } from '../data/mockData';
import { scoringService } from './scoringService';

class SetupService {
  public async getDetectedSetups(): Promise<SetupDetection[]> {
    // Dynamically recalculate overall setup scores based on the current scoring weights
    const weights = scoringService.getWeights();
    return mockDetectedSetups.map(setup => {
      const calculated = scoringService.calculateOpportunityScore({
        technicalScore: setup.scores.technical,
        fundamentalScore: setup.scores.fundamental,
        brokerScore: setup.scores.broker,
        marketScore: setup.scores.market,
        riskScore: setup.riskLevel === 'LOW' ? 85 : setup.riskLevel === 'MODERATE' ? 70 : 50,
      }, weights);

      return {
        ...setup,
        scores: {
          ...setup.scores,
          overall: calculated.overallScore,
        }
      };
    });
  }

  public async getSetupsForStock(symbol: string): Promise<SetupDetection[]> {
    const all = await this.getDetectedSetups();
    return all.filter(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  }

  public async getSetupTypes(): Promise<{ type: SetupType; label: string; description: string }[]> {
    return [
      { type: 'BREAKOUT', label: 'Price Breakout', description: 'Price penetrates multi-week horizontal resistance or consolidation boundary' },
      { type: 'BREAKOUT_VOLUME', label: 'Breakout + Volume Expansion', description: 'Resistance breakout backed by turnover > 1.5x 20-day moving average' },
      { type: 'PULLBACK_EMA', label: 'EMA Pullback & Retest', description: 'Controlled retracement towards rising 20 EMA in an established trend' },
      { type: 'TREND_CONTINUATION', label: 'Trend Continuation', description: 'Flag or pennant consolidation resolving in primary trend direction' },
      { type: 'SUPPORT_BOUNCE', label: 'Key Support Bounce', description: 'Rejection wick and reversal print at major demand level or 200 SMA' },
      { type: 'OVERSOLD_RECOVERY', label: 'Oversold Recovery', description: 'RSI < 35 with bullish divergence on daily timeframe' },
      { type: 'MOMENTUM_CONTINUATION', label: 'Momentum Continuation', description: 'MACD positive expansion and ADX > 25' },
      { type: 'MA_CROSSOVER', label: 'Moving Average Crossover', description: 'Golden cross or 20 EMA crossing above 50 SMA' },
      { type: 'ACCUMULATION_BASE', label: 'Institutional Base Accumulation', description: 'Tight price contraction range with net buyer broker concentration' },
      { type: 'REVERSAL', label: 'Exhaustion Reversal', description: 'Climactic selling volume rejected with hammer or double bottom' },
    ];
  }
}

export const setupService = new SetupService();
