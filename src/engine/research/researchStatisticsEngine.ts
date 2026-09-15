/**
 * Research Statistics Engine
 * Computes statistically sound performance metrics without look-ahead bias:
 * 1. Wilson score binomial confidence intervals
 * 2. Return distributions (mean, median, 25th, 75th percentiles, std dev)
 * 3. Expectancy & Profit Factor with zero-loss guards
 * 4. Maximum & average drawdown with recovery periods and streak metrics
 * 5. Small-sample warning classifications
 */

import {
  DistributionStats,
  WilsonConfidenceInterval,
  SampleSizeTier,
  DrawdownMetrics,
  EquityCurvePoint,
  SubgroupAnalysis
} from '../../types/historicalResearch';

export class ResearchStatisticsEngine {
  /**
   * Wilson Score Interval for binomial proportion (win rate / positive rate)
   * Superior to naive normal approximation for small n and extreme p.
   */
  public static calculateWilsonScoreInterval(
    successes: number,
    total: number,
    confidence: number = 0.95
  ): WilsonConfidenceInterval {
    if (total <= 0) {
      return { rate: 0, lower: 0, upper: 0, confidenceLevel: confidence };
    }

    const p = successes / total;
    // z-score for two-tailed confidence: 1.96 for 95%
    const z = confidence === 0.99 ? 2.576 : confidence === 0.90 ? 1.645 : 1.96;
    const z2 = z * z;

    const denominator = 1 + z2 / total;
    const centerAdjusted = p + z2 / (2 * total);
    const rad = Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total));

    const lower = Math.max(0, (centerAdjusted - z * rad) / denominator);
    const upper = Math.min(1, (centerAdjusted + z * rad) / denominator);

    return {
      rate: p * 100,
      lower: lower * 100,
      upper: upper * 100,
      confidenceLevel: confidence
    };
  }

  /**
   * Classify sample size into statistical tiers
   */
  public static classifySampleSize(n: number): {
    tier: SampleSizeTier;
    isWarning: boolean;
    warningText: string;
  } {
    if (n < 20) {
      return {
        tier: 'VERY_LOW',
        isWarning: true,
        warningText: 'VERY LOW SAMPLE SIZE (<20 observations). Estimates are highly volatile and prone to random noise.'
      };
    }
    if (n < 50) {
      return {
        tier: 'LOW',
        isWarning: true,
        warningText: 'LOW SAMPLE SIZE (20-49 observations). Interpret win rates and returns with caution.'
      };
    }
    if (n < 100) {
      return {
        tier: 'LIMITED',
        isWarning: false,
        warningText: 'LIMITED SAMPLE (50-99 observations). Provides initial indications, but subject to regime clustering.'
      };
    }
    if (n < 200) {
      return {
        tier: 'MODERATE',
        isWarning: false,
        warningText: 'MODERATE SAMPLE (100-199 observations).'
      };
    }
    return {
      tier: 'LARGER',
      isWarning: false,
      warningText: 'LARGER SAMPLE (200+ observations).'
    };
  }

  /**
   * Calculate non-parametric return distribution metrics (percentiles, mean, median, min, max, std dev)
   */
  public static calculateDistribution(values: number[]): DistributionStats {
    const n = values.length;
    if (n === 0) {
      return { count: 0, mean: 0, median: 0, p25: 0, p50: 0, p75: 0, min: 0, max: 0, stdDev: 0, skewness: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    const percentile = (p: number) => {
      const idx = (p / 100) * (n - 1);
      const lower = Math.floor(idx);
      const upper = Math.ceil(idx);
      const weight = idx - lower;
      return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    };

    const p25 = percentile(25);
    const p50 = percentile(50);
    const p75 = percentile(75);
    const median = p50;
    const min = sorted[0];
    const max = sorted[n - 1];

    const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Math.sqrt(variance);

    // Pearson's skewness = 3 * (mean - median) / stdDev
    const skewness = stdDev > 0 ? (3 * (mean - median)) / stdDev : 0;

    return {
      count: n,
      mean,
      median,
      p25,
      p50,
      p75,
      min,
      max,
      stdDev,
      skewness
    };
  }

  /**
   * Calculate Mathematical Expectancy & Profit Factor
   * Expectancy Formula:
   * Expectancy = (Win Probability * Avg Win %) - (Loss Probability * Avg Loss %)
   */
  public static calculateExpectancy(returns: number[]): {
    expectancy: number;
    expectancyRatio: number | null;
    profitFactor: number | null;
    grossProfits: number;
    grossLosses: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
  } {
    if (returns.length === 0) {
      return {
        expectancy: 0,
        expectancyRatio: null,
        profitFactor: null,
        grossProfits: 0,
        grossLosses: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0
      };
    }

    const wins = returns.filter(r => r > 0);
    const losses = returns.filter(r => r < 0);

    const winRate = wins.length / returns.length;
    const lossRate = losses.length / returns.length;

    const grossProfits = wins.reduce((sum, r) => sum + r, 0);
    const grossLosses = Math.abs(losses.reduce((sum, r) => sum + r, 0));

    const avgWin = wins.length > 0 ? grossProfits / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLosses / losses.length : 0;

    // Mathematical expectancy in % per trade
    const expectancy = winRate * avgWin - lossRate * avgLoss;

    // Expectancy ratio: (winProb * avgWin) / (lossProb * avgLoss)
    const expectedLoss = lossRate * avgLoss;
    const expectancyRatio = expectedLoss > 0 ? (winRate * avgWin) / expectedLoss : null;

    // Profit Factor = Gross Profits / Gross Losses
    let profitFactor: number | null = null;
    if (grossLosses > 0) {
      profitFactor = grossProfits / grossLosses;
    } else if (grossProfits > 0) {
      // All trades were winners; avoid infinite score
      profitFactor = null;
    }

    return {
      expectancy,
      expectancyRatio,
      profitFactor,
      grossProfits,
      grossLosses,
      winRate: winRate * 100,
      avgWin,
      avgLoss
    };
  }

  /**
   * Chronological Drawdown and Equity Curve Simulation
   */
  public static calculateDrawdown(
    trades: Array<{ date: string; symbol: string; returnPercent: number }>,
    initialCapital: number = 100000
  ): DrawdownMetrics {
    if (trades.length === 0) {
      return {
        maxDrawdownPercent: 0,
        avgDrawdownPercent: 0,
        longestLosingStreak: 0,
        longestWinningStreak: 0,
        currentStreak: { type: 'WIN', count: 0 },
        recoveryBarsMax: 0,
        equityCurve: []
      };
    }

    let equity = initialCapital;
    let peakEquity = initialCapital;
    let maxDrawdown = 0;
    const drawdowns: number[] = [];
    const equityCurve: EquityCurvePoint[] = [];

    let winStreak = 0;
    let maxWinStreak = 0;
    let lossStreak = 0;
    let maxLossStreak = 0;
    let barsUnderWater = 0;
    let maxRecoveryBars = 0;

    trades.forEach((trade, idx) => {
      // Compounded equity transition: equity * (1 + returnPercent / 100)
      equity = equity * (1 + trade.returnPercent / 100);

      if (equity > peakEquity) {
        peakEquity = equity;
        barsUnderWater = 0;
      } else {
        barsUnderWater++;
        if (barsUnderWater > maxRecoveryBars) {
          maxRecoveryBars = barsUnderWater;
        }
      }

      const dd = peakEquity > 0 ? ((peakEquity - equity) / peakEquity) * 100 : 0;
      drawdowns.push(dd);

      if (dd > maxDrawdown) {
        maxDrawdown = dd;
      }

      // Streaks
      if (trade.returnPercent > 0) {
        winStreak++;
        lossStreak = 0;
        if (winStreak > maxWinStreak) maxWinStreak = winStreak;
      } else if (trade.returnPercent < 0) {
        lossStreak++;
        winStreak = 0;
        if (lossStreak > maxLossStreak) maxLossStreak = lossStreak;
      }

      equityCurve.push({
        index: idx,
        date: trade.date,
        symbol: trade.symbol,
        equity: Math.round(equity),
        peakEquity: Math.round(peakEquity),
        drawdownPercent: Math.round(dd * 10) / 10,
        tradeReturnPercent: trade.returnPercent
      });
    });

    const avgDrawdown =
      drawdowns.length > 0 ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length : 0;

    return {
      maxDrawdownPercent: Math.round(maxDrawdown * 10) / 10,
      avgDrawdownPercent: Math.round(avgDrawdown * 10) / 10,
      longestLosingStreak: maxLossStreak,
      longestWinningStreak: maxWinStreak,
      currentStreak: {
        type: winStreak > 0 ? 'WIN' : 'LOSS',
        count: winStreak > 0 ? winStreak : lossStreak
      },
      recoveryBarsMax: maxRecoveryBars,
      equityCurve
    };
  }

  /**
   * Group and summarize observations by category (regime, sector, year)
   */
  public static calculateSubgroupBreakdown(
    items: Array<{ category: string; returnPercent: number }>
  ): SubgroupAnalysis[] {
    const groups: Record<string, number[]> = {};

    items.forEach(item => {
      const cat = item.category || 'UNKNOWN';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item.returnPercent);
    });

    return Object.entries(groups).map(([category, rets]) => {
      const dist = this.calculateDistribution(rets);
      const exp = this.calculateExpectancy(rets);

      return {
        category,
        observations: rets.length,
        winRate: Math.round(exp.winRate * 10) / 10,
        meanReturn: Math.round(dist.mean * 100) / 100,
        medianReturn: Math.round(dist.median * 100) / 100,
        profitFactor: exp.profitFactor !== null ? Math.round(exp.profitFactor * 100) / 100 : null
      };
    });
  }
}
