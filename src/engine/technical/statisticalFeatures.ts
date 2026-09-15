/**
 * Statistical & Quantitative Features Engine
 * Implements: Returns, Log Returns, Rolling Moments (Mean, Median, StdDev, Variance),
 * Z-score, Percentile Rank, Autocorrelation, Rolling Beta, Downside Deviation, Max Drawdown
 * Architecture stubs for Hurst Exponent, Entropy, and Market Regime.
 * Calculation Version: v1.0
 */

import { OHLCVBar, StatisticalFeaturesResult } from '../../types/technicalIndicators';
import { calculateRollingStdDev, calculateSMA, safeDivide } from './common';

export const STATISTICAL_FEATURES_VERSION = 'v1.0';

/**
 * Calculate basic returns and log returns
 */
export function computeReturns(bars: OHLCVBar[]): { returns: number[]; logReturns: number[] } {
  const len = bars.length;
  const returns: number[] = [0];
  const logReturns: number[] = [0];

  for (let i = 1; i < len; i++) {
    const prev = bars[i - 1].close;
    const curr = bars[i].close;
    if (prev > 0 && curr > 0) {
      returns.push((curr - prev) / prev);
      logReturns.push(Math.log(curr / prev));
    } else {
      returns.push(0);
      logReturns.push(0);
    }
  }

  return { returns, logReturns };
}

/**
 * Rolling Median calculation over window n
 */
export function computeRollingMedian(values: number[], window = 20): (number | null)[] {
  const len = values.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len < window) return result;

  for (let i = window - 1; i < len; i++) {
    const slice = values.slice(i - window + 1, i + 1).sort((a, b) => a - b);
    const mid = Math.floor(slice.length / 2);
    if (slice.length % 2 !== 0) {
      result[i] = slice[mid];
    } else {
      result[i] = (slice[mid - 1] + slice[mid]) / 2;
    }
  }

  return result;
}

/**
 * Autocorrelation at specified lag (default lag = 1)
 */
export function computeAutocorrelation(values: number[], lag = 1): number | null {
  const n = values.length;
  if (n <= lag + 2) return null;

  let sum = 0;
  for (let i = 0; i < n; i++) sum += values[i];
  const mean = sum / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const diff = values[i] - mean;
    denominator += diff * diff;
    if (i >= lag) {
      numerator += (values[i] - mean) * (values[i - lag] - mean);
    }
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Rolling Beta against a Benchmark index series (e.g. NEPSE index)
 * Beta = Covariance(stock, benchmark) / Variance(benchmark)
 */
export function computeRollingBeta(
  stockCloses: number[],
  benchCloses: number[],
  period = 30
): (number | null)[] {
  const len = Math.min(stockCloses.length, benchCloses.length);
  const result: (number | null)[] = new Array(len).fill(null);
  if (len < period + 1) return result;

  // Calculate percentage returns
  const stockRet: number[] = [0];
  const benchRet: number[] = [0];
  for (let i = 1; i < len; i++) {
    stockRet.push(stockCloses[i - 1] > 0 ? (stockCloses[i] - stockCloses[i - 1]) / stockCloses[i - 1] : 0);
    benchRet.push(benchCloses[i - 1] > 0 ? (benchCloses[i] - benchCloses[i - 1]) / benchCloses[i - 1] : 0);
  }

  for (let i = period; i < len; i++) {
    let sumStock = 0;
    let sumBench = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumStock += stockRet[j];
      sumBench += benchRet[j];
    }
    const meanStock = sumStock / period;
    const meanBench = sumBench / period;

    let cov = 0;
    let varBench = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const dStock = stockRet[j] - meanStock;
      const dBench = benchRet[j] - meanBench;
      cov += dStock * dBench;
      varBench += dBench * dBench;
    }

    result[i] = varBench > 0 ? cov / varBench : 1.0;
  }

  return result;
}

/**
 * Downside Deviation (Semi-deviation of returns below target, usually 0)
 */
export function computeDownsideDeviation(returns: number[], targetReturn = 0): number {
  let sumSquaredShortfall = 0;
  let count = 0;

  for (let i = 0; i < returns.length; i++) {
    if (returns[i] < targetReturn) {
      sumSquaredShortfall += Math.pow(returns[i] - targetReturn, 2);
      count++;
    }
  }

  return returns.length > 0 ? Math.sqrt(sumSquaredShortfall / returns.length) : 0;
}

/**
 * Maximum Drawdown & Current Drawdown
 */
export function computeDrawdown(closes: number[]): {
  maxDrawdown: number;
  currentDrawdown: number;
  drawdowns: number[];
} {
  let peak = -Infinity;
  let maxDD = 0;
  const drawdowns: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    const price = closes[i];
    if (price > peak) {
      peak = price;
    }
    const dd = peak > 0 ? ((peak - price) / peak) * 100 : 0;
    drawdowns.push(dd);
    if (dd > maxDD) {
      maxDD = dd;
    }
  }

  const currentDrawdown = drawdowns.length > 0 ? drawdowns[drawdowns.length - 1] : 0;
  return { maxDrawdown: maxDD, currentDrawdown, drawdowns };
}

/**
 * Comprehensive Statistical Features Calculation
 */
export function computeStatisticalFeatures(bars: OHLCVBar[], window = 20): StatisticalFeaturesResult {
  const closes = bars.map(b => b.close);
  const len = bars.length;

  const { returns, logReturns } = computeReturns(bars);
  const rollingMean = calculateSMA(closes, window);
  const rollingMedian = computeRollingMedian(closes, window);
  const rollingStdDev = calculateRollingStdDev(closes, window);

  const rollingVariance: (number | null)[] = rollingStdDev.map(s => (s !== null ? s * s : null));

  // Z-score: (Price - Mean) / StdDev
  const zScore: (number | null)[] = new Array(len).fill(null);
  for (let i = 0; i < len; i++) {
    const m = rollingMean[i];
    const s = rollingStdDev[i];
    if (m !== null && s !== null && s > 0) {
      zScore[i] = (closes[i] - m) / s;
    }
  }

  // Percentile Rank over window
  const percentileRank: (number | null)[] = new Array(len).fill(null);
  for (let i = window - 1; i < len; i++) {
    const currentPrice = closes[i];
    let count = 0;
    for (let j = i - window + 1; j <= i; j++) {
      if (closes[j] < currentPrice) count++;
    }
    percentileRank[i] = (count / window) * 100;
  }

  // Rate of Change over window
  const rateOfChange: (number | null)[] = new Array(len).fill(null);
  for (let i = window; i < len; i++) {
    const past = closes[i - window];
    if (past > 0) {
      rateOfChange[i] = ((closes[i] - past) / past) * 100;
    }
  }

  // Autocorrelation of returns at lag 1
  const autocorrelationLag1 = computeAutocorrelation(returns, 1);

  // Annualized Volatility
  const downsideDeviation = computeDownsideDeviation(returns, 0);
  const recentStd = rollingStdDev[len - 1];
  const annualizedVolatility = recentStd !== null && closes[len - 1] > 0
    ? (recentStd / closes[len - 1]) * Math.sqrt(245) * 100
    : null;

  const { maxDrawdown, currentDrawdown } = computeDrawdown(closes);

  return {
    returns,
    logReturns,
    rollingMean,
    rollingMedian,
    rollingStdDev,
    rollingVariance,
    zScore,
    percentileRank,
    rateOfChange,
    autocorrelationLag1,
    annualizedVolatility,
    downsideDeviation,
    maxDrawdown,
    currentDrawdown
  };
}

/**
 * Architectural Interfaces for Future Quantitative Additions
 * (Hurst Exponent, Shannon Entropy, Mean Reversion Half-Life, Regime Detection)
 */
export interface QuantitativeArchitectureStubs {
  hurstExponent: {
    status: 'PLANNED';
    description: 'Rescaled range analysis (R/S) to quantify long-term memory of price series (H > 0.5 trending, H < 0.5 mean-reverting)';
  };
  shannonEntropy: {
    status: 'PLANNED';
    description: 'Information entropy of return distribution to measure market uncertainty/efficiency';
  };
  regimeDetection: {
    status: 'PLANNED';
    description: 'Hidden Markov Model / GMM based multi-state volatility clustering';
  };
}
