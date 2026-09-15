/**
 * Volatility Indicators Calculation Suite
 * Implements: True Range, ATR, ATR %, Bollinger Bands, Keltner Channels,
 * Donchian Channels, Rolling Standard Deviation, Historical Volatility, Chaikin Volatility
 * Calculation Version: v1.0
 */

import { OHLCVBar } from '../../types/technicalIndicators';
import {
  calculateEMA,
  calculateRMA,
  calculateRollingStdDev,
  calculateSMA,
  calculateTrueRange,
  safeDivide
} from './common';

export const VOLATILITY_INDICATOR_VERSION = 'v1.0';

/**
 * ATR & ATR Percentage Output
 */
export interface ATROutput {
  tr: number;
  atr: number | null;
  atrPercent: number | null;
}

export function computeATR(bars: OHLCVBar[], period = 14): ATROutput[] {
  const len = bars.length;
  const result: ATROutput[] = [];
  if (len === 0) return result;

  const trValues = calculateTrueRange(bars);
  const atrValues = calculateRMA(trValues, period);

  for (let i = 0; i < len; i++) {
    const atr = atrValues[i];
    const atrPercent = atr !== null && bars[i].close > 0 ? (atr / bars[i].close) * 100 : null;

    result.push({
      tr: trValues[i],
      atr,
      atrPercent
    });
  }

  return result;
}

/**
 * Bollinger Bands Output
 */
export interface BollingerBandsOutput {
  middle: number | null;
  upper: number | null;
  lower: number | null;
  bandwidth: number | null;
  percentB: number | null;
  stdDev: number | null;
}

export function computeBollingerBands(
  bars: OHLCVBar[],
  period = 20,
  stdDevMultiplier = 2.0
): BollingerBandsOutput[] {
  const closes = bars.map(b => b.close);
  const len = bars.length;
  const result: BollingerBandsOutput[] = new Array(len).fill(null).map(() => ({
    middle: null,
    upper: null,
    lower: null,
    bandwidth: null,
    percentB: null,
    stdDev: null
  }));

  if (len < period) return result;

  const sma = calculateSMA(closes, period);
  const std = calculateRollingStdDev(closes, period);

  for (let i = period - 1; i < len; i++) {
    const mid = sma[i];
    const dev = std[i];
    if (mid !== null && dev !== null) {
      const up = mid + stdDevMultiplier * dev;
      const low = mid - stdDevMultiplier * dev;
      const width = mid > 0 ? ((up - low) / mid) * 100 : 0;
      const denom = up - low;
      const pB = denom > 0 ? (closes[i] - low) / denom : 0.5;

      result[i] = {
        middle: mid,
        upper: up,
        lower: low,
        bandwidth: width,
        percentB: pB,
        stdDev: dev
      };
    }
  }

  return result;
}

/**
 * Keltner Channels Output
 */
export interface KeltnerChannelsOutput {
  middle: number | null;
  upper: number | null;
  lower: number | null;
}

export function computeKeltnerChannels(
  bars: OHLCVBar[],
  emaPeriod = 20,
  atrPeriod = 10,
  multiplier = 2.0
): KeltnerChannelsOutput[] {
  const closes = bars.map(b => b.close);
  const len = bars.length;
  const result: KeltnerChannelsOutput[] = new Array(len).fill(null).map(() => ({
    middle: null,
    upper: null,
    lower: null
  }));

  if (len < Math.max(emaPeriod, atrPeriod)) return result;

  const ema = calculateEMA(closes, emaPeriod);
  const tr = calculateTrueRange(bars);
  const atr = calculateRMA(tr, atrPeriod);

  for (let i = 0; i < len; i++) {
    const m = ema[i];
    const a = atr[i];
    if (m !== null && a !== null) {
      result[i] = {
        middle: m,
        upper: m + multiplier * a,
        lower: m - multiplier * a
      };
    }
  }

  return result;
}

/**
 * Donchian Channels Output
 */
export interface DonchianChannelsOutput {
  upper: number | null;
  lower: number | null;
  middle: number | null;
}

export function computeDonchianChannels(bars: OHLCVBar[], period = 20): DonchianChannelsOutput[] {
  const len = bars.length;
  const result: DonchianChannelsOutput[] = new Array(len).fill(null).map(() => ({
    upper: null,
    lower: null,
    middle: null
  }));

  if (len < period) return result;

  for (let i = period - 1; i < len; i++) {
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (bars[j].high > highest) highest = bars[j].high;
      if (bars[j].low < lowest) lowest = bars[j].low;
    }
    result[i] = {
      upper: highest,
      lower: lowest,
      middle: (highest + lowest) / 2
    };
  }

  return result;
}

/**
 * Historical Volatility (Annualized Standard Deviation of Log Returns)
 * In NEPSE, roughly 245 trading days per year.
 */
export function computeHistoricalVolatility(bars: OHLCVBar[], period = 20, annualTradingDays = 245): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len <= period) return result;

  const logReturns: number[] = [0];
  for (let i = 1; i < len; i++) {
    if (bars[i - 1].close > 0 && bars[i].close > 0) {
      logReturns.push(Math.log(bars[i].close / bars[i - 1].close));
    } else {
      logReturns.push(0);
    }
  }

  const rollingStd = calculateRollingStdDev(logReturns, period);
  const annualFactor = Math.sqrt(annualTradingDays) * 100;

  for (let i = period; i < len; i++) {
    const s = rollingStd[i];
    if (s !== null) {
      result[i] = s * annualFactor;
    }
  }

  return result;
}

/**
 * Chaikin Volatility
 * Measures difference between high and low prices over time.
 */
export function computeChaikinVolatility(
  bars: OHLCVBar[],
  emaPeriod = 10,
  rocPeriod = 10
): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len < emaPeriod + rocPeriod) return result;

  const spreads = bars.map(b => b.high - b.low);
  const emaSpread = calculateEMA(spreads, emaPeriod);

  for (let i = emaPeriod + rocPeriod - 1; i < len; i++) {
    const curr = emaSpread[i];
    const prev = emaSpread[i - rocPeriod];
    if (curr !== null && prev !== null && prev > 0) {
      result[i] = ((curr - prev) / prev) * 100;
    }
  }

  return result;
}
