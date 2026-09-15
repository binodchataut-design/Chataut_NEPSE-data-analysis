/**
 * Moving Average Calculation Suite
 * Implements: SMA, EMA, WMA, RMA, SMMA, HMA, DEMA, TEMA, KAMA, VWMA
 * Fully configurable periods with strict warmup period tracking and zero look-ahead bias.
 * Calculation Version: v1.0
 */

import { OHLCVBar } from '../../types/technicalIndicators';
import {
  calculateSMA,
  calculateEMA,
  calculateRMA,
  calculateWMA,
  safeDivide
} from './common';

export const MOVING_AVERAGE_VERSION = 'v1.0';

/**
 * SMA - Simple Moving Average
 */
export function computeSMA(bars: OHLCVBar[], period = 20): (number | null)[] {
  const closes = bars.map(b => b.close);
  return calculateSMA(closes, period);
}

/**
 * EMA - Exponential Moving Average
 */
export function computeEMA(bars: OHLCVBar[], period = 20): (number | null)[] {
  const closes = bars.map(b => b.close);
  return calculateEMA(closes, period);
}

/**
 * WMA - Weighted Moving Average
 */
export function computeWMA(bars: OHLCVBar[], period = 20): (number | null)[] {
  const closes = bars.map(b => b.close);
  return calculateWMA(closes, period);
}

/**
 * RMA - Wilder's Running Moving Average
 */
export function computeRMA(bars: OHLCVBar[], period = 14): (number | null)[] {
  const closes = bars.map(b => b.close);
  return calculateRMA(closes, period);
}

/**
 * SMMA - Smoothed Moving Average
 * Mathematically equivalent to RMA with alpha = 1 / period.
 */
export function computeSMMA(bars: OHLCVBar[], period = 20): (number | null)[] {
  return computeRMA(bars, period);
}

/**
 * HMA - Hull Moving Average
 * HMA = WMA(2 * WMA(n/2) - WMA(n), sqrt(n))
 */
export function computeHMA(bars: OHLCVBar[], period = 20): (number | null)[] {
  const closes = bars.map(b => b.close);
  const result: (number | null)[] = new Array(bars.length).fill(null);
  if (period <= 1 || bars.length < period) return result;

  const halfPeriod = Math.max(1, Math.floor(period / 2));
  const sqrtPeriod = Math.max(1, Math.round(Math.sqrt(period)));

  const wmaHalf = calculateWMA(closes, halfPeriod);
  const wmaFull = calculateWMA(closes, period);

  // intermediate series: 2 * WMA(n/2) - WMA(n)
  const diffSeries: (number | null)[] = new Array(bars.length).fill(null);
  for (let i = 0; i < bars.length; i++) {
    const h = wmaHalf[i];
    const f = wmaFull[i];
    if (h !== null && f !== null) {
      diffSeries[i] = 2 * h - f;
    }
  }

  // WMA of diffSeries over sqrtPeriod
  const denominator = (sqrtPeriod * (sqrtPeriod + 1)) / 2;
  for (let i = period - 1 + sqrtPeriod - 1; i < bars.length; i++) {
    let sum = 0;
    let valid = true;
    for (let j = 0; j < sqrtPeriod; j++) {
      const val = diffSeries[i - sqrtPeriod + 1 + j];
      if (val === null) {
        valid = false;
        break;
      }
      sum += val * (j + 1);
    }
    if (valid) {
      result[i] = sum / denominator;
    }
  }

  return result;
}

/**
 * DEMA - Double Exponential Moving Average
 * DEMA = 2 * EMA(n) - EMA(EMA(n))
 */
export function computeDEMA(bars: OHLCVBar[], period = 20): (number | null)[] {
  const closes = bars.map(b => b.close);
  const result: (number | null)[] = new Array(bars.length).fill(null);
  if (period <= 0 || bars.length < period * 2 - 1) return result;

  const ema1 = calculateEMA(closes, period);
  // Extract non-null ema1 to compute ema2
  const validEma1Values = ema1.filter((v): v is number => v !== null);
  if (validEma1Values.length < period) return result;

  const ema2Sub = calculateEMA(validEma1Values, period);

  // Map back to original indices
  let validIndex = 0;
  for (let i = 0; i < bars.length; i++) {
    if (ema1[i] !== null) {
      const e2 = ema2Sub[validIndex];
      const e1 = ema1[i];
      if (e2 !== null && e1 !== null) {
        result[i] = 2 * e1 - e2;
      }
      validIndex++;
    }
  }

  return result;
}

/**
 * TEMA - Triple Exponential Moving Average
 * TEMA = 3 * EMA1 - 3 * EMA2 + EMA3
 */
export function computeTEMA(bars: OHLCVBar[], period = 20): (number | null)[] {
  const closes = bars.map(b => b.close);
  const result: (number | null)[] = new Array(bars.length).fill(null);
  if (period <= 0 || bars.length < period * 3 - 2) return result;

  const ema1 = calculateEMA(closes, period);
  const valid1 = ema1.filter((v): v is number => v !== null);
  if (valid1.length < period) return result;

  const ema2Sub = calculateEMA(valid1, period);
  const valid2 = ema2Sub.filter((v): v is number => v !== null);
  if (valid2.length < period) return result;

  const ema3Sub = calculateEMA(valid2, period);

  let index1 = 0;
  let index2 = 0;
  for (let i = 0; i < bars.length; i++) {
    if (ema1[i] !== null) {
      if (ema2Sub[index1] !== null) {
        const e3 = ema3Sub[index2];
        if (e3 !== null && e3 !== undefined) {
          const e1 = ema1[i]!;
          const e2 = ema2Sub[index1]!;
          result[i] = 3 * e1 - 3 * e2 + e3;
          index2++;
        }
      }
      index1++;
    }
  }

  return result;
}

/**
 * KAMA - Kaufman Adaptive Moving Average
 * Measures market noise vs trend via Efficiency Ratio (ER)
 */
export function computeKAMA(
  bars: OHLCVBar[],
  period = 10,
  fastPeriod = 2,
  slowPeriod = 30
): (number | null)[] {
  const closes = bars.map(b => b.close);
  const result: (number | null)[] = new Array(bars.length).fill(null);
  if (period <= 0 || bars.length < period + 1) return result;

  const fastSC = 2 / (fastPeriod + 1);
  const slowSC = 2 / (slowPeriod + 1);

  // Initialize first KAMA with close at period index
  let prevKAMA = closes[period - 1];
  result[period - 1] = prevKAMA;

  for (let i = period; i < bars.length; i++) {
    const change = Math.abs(closes[i] - closes[i - period]);
    let volatility = 0;
    for (let j = i - period + 1; j <= i; j++) {
      volatility += Math.abs(closes[j] - closes[j - 1]);
    }

    const er = safeDivide(change, volatility, 0);
    const sc = Math.pow(er * (fastSC - slowSC) + slowSC, 2);
    const kama = prevKAMA + sc * (closes[i] - prevKAMA);
    result[i] = kama;
    prevKAMA = kama;
  }

  return result;
}

/**
 * VWMA - Volume Weighted Moving Average
 * Emphasizes prices on higher volume bars
 */
export function computeVWMA(bars: OHLCVBar[], period = 20): (number | null)[] {
  const result: (number | null)[] = new Array(bars.length).fill(null);
  if (period <= 0 || bars.length < period) return result;

  for (let i = period - 1; i < bars.length; i++) {
    let sumPV = 0;
    let sumV = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const vol = bars[j].volume;
      sumPV += bars[j].close * vol;
      sumV += vol;
    }
    result[i] = safeDivide(sumPV, sumV, bars[i].close);
  }

  return result;
}
