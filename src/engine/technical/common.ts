/**
 * Core Mathematical Primitives & Low-Level Helpers for Technical Analysis
 *
 * STRICT ARCHITECTURAL PRINCIPLE: ZERO LOOK-AHEAD BIAS
 * Every function operating on an array at index i MUST only inspect elements
 * from index 0 up to index i. Future values (i+1, i+2, ...) are strictly inaccessible.
 */

import { OHLCVBar } from '../../types/technicalIndicators';

/**
 * Safe division preventing NaN or Infinity
 */
export function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  if (denominator === 0 || !Number.isFinite(denominator) || !Number.isFinite(numerator)) {
    return fallback;
  }
  return numerator / denominator;
}

/**
 * Simple Moving Average (SMA) of an array slice
 */
export function calculateSMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return result;

  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i >= period - 1) {
      result[i] = sum / period;
    }
  }
  return result;
}

/**
 * Exponential Moving Average (EMA)
 * Multiplier = 2 / (period + 1)
 * Initial seed is the SMA of the first 'period' values
 */
export function calculateEMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return result;

  const k = 2 / (period + 1);

  // Seed with SMA
  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    initialSum += values[i];
  }
  let prevEMA = initialSum / period;
  result[period - 1] = prevEMA;

  for (let i = period; i < values.length; i++) {
    const current = (values[i] - prevEMA) * k + prevEMA;
    result[i] = current;
    prevEMA = current;
  }

  return result;
}

/**
 * Wilder's Smoothing / RMA (Running Moving Average)
 * Multiplier = 1 / period
 * Equivalent to EMA with alpha = 1/period. Used in RSI, ATR, ADX.
 */
export function calculateRMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return result;

  const alpha = 1 / period;

  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    initialSum += values[i];
  }
  let prevRMA = initialSum / period;
  result[period - 1] = prevRMA;

  for (let i = period; i < values.length; i++) {
    const current = alpha * values[i] + (1 - alpha) * prevRMA;
    result[i] = current;
    prevRMA = current;
  }

  return result;
}

/**
 * Weighted Moving Average (WMA)
 * Weights: 1, 2, 3, ... N
 * Denominator: N * (N + 1) / 2
 */
export function calculateWMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return result;

  const denominator = (period * (period + 1)) / 2;

  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      const weight = j + 1;
      sum += values[i - period + 1 + j] * weight;
    }
    result[i] = sum / denominator;
  }

  return result;
}

/**
 * True Range (TR) calculation across an OHLCV series
 * TR = max(High - Low, |High - Close_prev|, |Low - Close_prev|)
 * For first bar, TR = High - Low
 */
export function calculateTrueRange(bars: OHLCVBar[]): number[] {
  const tr: number[] = [];
  if (bars.length === 0) return tr;

  for (let i = 0; i < bars.length; i++) {
    const curr = bars[i];
    if (i === 0) {
      tr.push(curr.high - curr.low);
    } else {
      const prevClose = bars[i - 1].close;
      const hl = curr.high - curr.low;
      const hc = Math.abs(curr.high - prevClose);
      const lc = Math.abs(curr.low - prevClose);
      tr.push(Math.max(hl, hc, lc));
    }
  }
  return tr;
}

/**
 * Rolling Standard Deviation
 */
export function calculateRollingStdDev(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 1 || values.length < period) return result;

  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += values[j];
    }
    const mean = sum / period;

    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(values[j] - mean, 2);
    }
    // Sample variance uses (period - 1), population variance uses period. Standard trading uses population.
    result[i] = Math.sqrt(varianceSum / period);
  }

  return result;
}

/**
 * Typical Price: (High + Low + Close) / 3
 */
export function getTypicalPrices(bars: OHLCVBar[]): number[] {
  return bars.map(b => (b.high + b.low + b.close) / 3);
}

/**
 * Median Price: (High + Low) / 2
 */
export function getMedianPrices(bars: OHLCVBar[]): number[] {
  return bars.map(b => (b.high + b.low) / 2);
}

/**
 * Weighted Close: (High + Low + 2 * Close) / 4
 */
export function getWeightedCloses(bars: OHLCVBar[]): number[] {
  return bars.map(b => (b.high + b.low + 2 * b.close) / 4);
}
