import { SampleSizeTier } from '../../types/historicalResearch';

export interface DistributionStats {
  mean: number;
  median: number;
  stdDev: number;
  winRate: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  count: number;
}

export interface ExpectancyStats {
  expectancy: number;
  expectancyRatio: number | null;
  profitFactor: number | null;
  grossProfits: number;
  grossLosses: number;
}

export interface WilsonInterval {
  lower: number;
  upper: number;
}

export interface SampleSizeAudit {
  tier: SampleSizeTier;
  isWarning: boolean;
  warningText?: string;
}

export interface EquityCurvePoint {
  date: string;
  equity: number;
  peakEquity: number;
  drawdownPercent: number;
  tradeReturnPercent: number;
}

export interface DrawdownResult {
  equityCurve: EquityCurvePoint[];
  maxDrawdown: number;
  maxDrawdownPercent: number;
  maxDrawdownDate?: string;
}

export interface SubgroupBreakdownItem {
  category: string;
  observations: number;
  winRate: number;
  meanReturn: number;
  medianReturn: number;
}

export class ResearchStatisticsEngine {
  static classifySampleSize(count: number): SampleSizeAudit {
    if (count < 20) return { tier: 'VERY_LOW', isWarning: true, warningText: `Only ${count} observations — statistically unreliable, treat as anecdotal.` };
    if (count < 50) return { tier: 'LOW', isWarning: true, warningText: `${count} observations is a small sample — confidence intervals will be wide.` };
    if (count < 100) return { tier: 'LIMITED', isWarning: true, warningText: `${count} observations gives limited statistical power.` };
    if (count < 250) return { tier: 'MODERATE', isWarning: false };
    return { tier: 'LARGER', isWarning: false };
  }

  static calculateDistribution(values: number[]): DistributionStats {
    const n = values.length;
    if (n === 0) {
      return { mean: 0, median: 0, stdDev: 0, winRate: 0, p25: 0, p75: 0, min: 0, max: 0, count: 0 };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[(n - 1) / 2];
    const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);
    const percentile = (p: number) => {
      const idx = (p / 100) * (n - 1);
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      if (lo === hi) return sorted[lo];
      return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
    };
    const winRate = (sorted.filter(v => v > 0).length / n) * 100;
    return { mean, median, stdDev, winRate, p25: percentile(25), p75: percentile(75), min: sorted[0], max: sorted[n - 1], count: n };
  }

  static calculateExpectancy(values: number[]): ExpectancyStats {
    const n = values.length;
    if (n === 0) return { expectancy: 0, expectancyRatio: null, profitFactor: null, grossProfits: 0, grossLosses: 0 };
    const wins = values.filter(v => v > 0);
    const losses = values.filter(v => v < 0);
    const grossProfits = wins.reduce((a, b) => a + b, 0);
    const grossLosses = Math.abs(losses.reduce((a, b) => a + b, 0));
    const winRate = wins.length / n;
    const lossRate = losses.length / n;
    const avgWin = wins.length > 0 ? grossProfits / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLosses / losses.length : 0;
    const expectancy = (winRate * avgWin) - (lossRate * avgLoss);
    const expectancyRatio = avgLoss > 0 ? expectancy / avgLoss : null;
    const profitFactor = grossLosses > 0 ? grossProfits / grossLosses : null;
    return { expectancy, expectancyRatio, profitFactor, grossProfits, grossLosses };
  }

  static calculateWilsonScoreInterval(successes: number, total: number, z: number = 1.96): WilsonInterval {
    if (total === 0) return { lower: 0, upper: 0 };
    const p = successes / total;
    const denominator = 1 + (z * z) / total;
    const center = p + (z * z) / (2 * total);
    const margin = z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));
    return {
      lower: Math.max(0, (center - margin) / denominator) * 100,
      upper: Math.min(1, (center + margin) / denominator) * 100
    };
  }

  static calculateDrawdown(
    trades: { date: string; symbol?: string; returnPercent: number }[],
    startingEquity: number = 100000
  ): DrawdownResult {
    if (trades.length === 0) return { equityCurve: [], maxDrawdown: 0, maxDrawdownPercent: 0 };
    let equity = startingEquity;
    let peakEquity = startingEquity;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let maxDrawdownDate: string | undefined;
    const equityCurve: EquityCurvePoint[] = [];
    for (const trade of trades) {
      equity = equity * (1 + trade.returnPercent / 100);
      if (equity > peakEquity) peakEquity = equity;
      const drawdown = peakEquity - equity;
      const drawdownPercent = peakEquity > 0 ? (drawdown / peakEquity) * 100 : 0;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
        maxDrawdownDate = trade.date;
      }
      equityCurve.push({
        date: trade.date,
        equity: Math.round(equity * 100) / 100,
        peakEquity: Math.round(peakEquity * 100) / 100,
        drawdownPercent: Math.round(drawdownPercent * 100) / 100,
        tradeReturnPercent: trade.returnPercent
      });
    }
    return {
      equityCurve,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      maxDrawdownPercent: Math.round(maxDrawdownPercent * 100) / 100,
      maxDrawdownDate
    };
  }

  static calculateSubgroupBreakdown(items: { category: string; returnPercent: number }[]): SubgroupBreakdownItem[] {
    const groups = new Map<string, number[]>();
    for (const item of items) {
      const key = item.category ?? 'Unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item.returnPercent);
    }
    const results: SubgroupBreakdownItem[] = [];
    for (const [category, returns] of groups.entries()) {
      const dist = this.calculateDistribution(returns);
      results.push({
        category,
        observations: returns.length,
        winRate: Math.round(dist.winRate * 10) / 10,
        meanReturn: Math.round(dist.mean * 100) / 100,
        medianReturn: Math.round(dist.median * 100) / 100
      });
    }
    return results.sort((a, b) => b.observations - a.observations);
  }

  static calculateConfidenceInterval(values: number[], confidenceLevel: number = 0.95): WilsonInterval {
    const n = values.length;
    if (n === 0) return { lower: 0, upper: 0 };
    const dist = this.calculateDistribution(values);
    const z = confidenceLevel >= 0.99 ? 2.576 : confidenceLevel >= 0.95 ? 1.96 : 1.645;
    const margin = z * (dist.stdDev / Math.sqrt(n));
    return {
      lower: Math.round((dist.mean - margin) * 100) / 100,
      upper: Math.round((dist.mean + margin) * 100) / 100
    };
  }
}
