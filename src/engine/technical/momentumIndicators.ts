/**
 * Momentum Indicators Calculation Suite
 * Implements: RSI, Stochastic, Stochastic RSI, Williams %R, CCI, ROC, Momentum,
 * Ultimate Oscillator, Awesome Oscillator, PPO, TSI, RVI, Fisher Transform, Connors RSI, CMO
 * Returns raw calculated values without arbitrary buy/sell thresholds.
 * Calculation Version: v1.0
 */

import { OHLCVBar } from '../../types/technicalIndicators';
import {
  calculateEMA,
  calculateRMA,
  calculateSMA,
  safeDivide
} from './common';

export const MOMENTUM_INDICATOR_VERSION = 'v1.0';

/**
 * RSI - Relative Strength Index (Wilder)
 */
export function computeRSI(bars: OHLCVBar[], period = 14): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len <= period) return result;

  const gains: number[] = [0];
  const losses: number[] = [0];

  for (let i = 1; i < len; i++) {
    const change = bars[i].close - bars[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  const avgGains = calculateRMA(gains, period);
  const avgLosses = calculateRMA(losses, period);

  for (let i = period; i < len; i++) {
    const g = avgGains[i];
    const l = avgLosses[i];
    if (g !== null && l !== null) {
      if (l === 0) {
        result[i] = 100;
      } else if (g === 0) {
        result[i] = 0;
      } else {
        const rs = g / l;
        result[i] = 100 - 100 / (1 + rs);
      }
    }
  }

  return result;
}

/**
 * Stochastic Oscillator (%K, %D)
 */
export interface StochasticOutput {
  k: number | null;
  d: number | null;
}

export function computeStochastic(
  bars: OHLCVBar[],
  kPeriod = 14,
  kSmoothing = 3,
  dPeriod = 3
): StochasticOutput[] {
  const len = bars.length;
  const result: StochasticOutput[] = new Array(len).fill(null).map(() => ({
    k: null,
    d: null
  }));

  if (len < kPeriod) return result;

  const rawK: (number | null)[] = new Array(len).fill(null);

  for (let i = kPeriod - 1; i < len; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (bars[j].high > highestHigh) highestHigh = bars[j].high;
      if (bars[j].low < lowestLow) lowestLow = bars[j].low;
    }

    const denom = highestHigh - lowestLow;
    if (denom === 0) {
      rawK[i] = 50;
    } else {
      rawK[i] = ((bars[i].close - lowestLow) / denom) * 100;
    }
  }

  // Smooth %K
  const smoothedK = calculateSMA(
    rawK.map(v => v ?? 0),
    kSmoothing
  );

  // Smooth %D from smoothed %K
  const validK: number[] = [];
  const validIndices: number[] = [];
  for (let i = 0; i < len; i++) {
    if (i >= kPeriod - 1 + kSmoothing - 1) {
      validK.push(smoothedK[i]!);
      validIndices.push(i);
    }
  }

  const smoothedD = calculateSMA(validK, dPeriod);

  for (let idx = 0; idx < validIndices.length; idx++) {
    const origIdx = validIndices[idx];
    result[origIdx].k = validK[idx];
    result[origIdx].d = smoothedD[idx];
  }

  return result;
}

/**
 * Stochastic RSI (%K, %D)
 */
export function computeStochRSI(
  bars: OHLCVBar[],
  rsiPeriod = 14,
  stochPeriod = 14,
  kPeriod = 3,
  dPeriod = 3
): StochasticOutput[] {
  const len = bars.length;
  const result: StochasticOutput[] = new Array(len).fill(null).map(() => ({
    k: null,
    d: null
  }));

  const rsi = computeRSI(bars, rsiPeriod);
  const rawStochRSI: (number | null)[] = new Array(len).fill(null);

  for (let i = 0; i < len; i++) {
    if (i >= rsiPeriod + stochPeriod - 1) {
      let minRSI = Infinity;
      let maxRSI = -Infinity;
      let valid = true;
      for (let j = i - stochPeriod + 1; j <= i; j++) {
        if (rsi[j] === null) {
          valid = false;
          break;
        }
        if (rsi[j]! < minRSI) minRSI = rsi[j]!;
        if (rsi[j]! > maxRSI) maxRSI = rsi[j]!;
      }

      if (valid) {
        const denom = maxRSI - minRSI;
        rawStochRSI[i] = denom === 0 ? 50 : ((rsi[i]! - minRSI) / denom) * 100;
      }
    }
  }

  // Smooth K
  const validStoch: number[] = [];
  const validIndices: number[] = [];
  for (let i = 0; i < len; i++) {
    if (rawStochRSI[i] !== null) {
      validStoch.push(rawStochRSI[i]!);
      validIndices.push(i);
    }
  }

  const smoothedK = calculateSMA(validStoch, kPeriod);
  const validK: number[] = [];
  const validKIndices: number[] = [];
  for (let i = 0; i < validStoch.length; i++) {
    if (smoothedK[i] !== null) {
      validK.push(smoothedK[i]!);
      validKIndices.push(validIndices[i]);
    }
  }

  const smoothedD = calculateSMA(validK, dPeriod);

  for (let i = 0; i < validKIndices.length; i++) {
    const origIdx = validKIndices[i];
    result[origIdx].k = validK[i];
    result[origIdx].d = smoothedD[i];
  }

  return result;
}

/**
 * Williams %R (-100 to 0)
 */
export function computeWilliamsR(bars: OHLCVBar[], period = 14): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len < period) return result;

  for (let i = period - 1; i < len; i++) {
    let high = -Infinity;
    let low = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (bars[j].high > high) high = bars[j].high;
      if (bars[j].low < low) low = bars[j].low;
    }
    const denom = high - low;
    result[i] = denom === 0 ? -50 : ((high - bars[i].close) / denom) * -100;
  }

  return result;
}

/**
 * CCI - Commodity Channel Index
 */
export function computeCCI(bars: OHLCVBar[], period = 20): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len < period) return result;

  const typicalPrices = bars.map(b => (b.high + b.low + b.close) / 3);
  const smaTP = calculateSMA(typicalPrices, period);

  for (let i = period - 1; i < len; i++) {
    const mean = smaTP[i];
    if (mean === null) continue;

    let meanDevSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      meanDevSum += Math.abs(typicalPrices[j] - mean);
    }
    const meanDev = meanDevSum / period;

    result[i] = meanDev === 0 ? 0 : (typicalPrices[i] - mean) / (0.015 * meanDev);
  }

  return result;
}

/**
 * ROC - Rate of Change
 */
export function computeROC(bars: OHLCVBar[], period = 12): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);

  for (let i = period; i < len; i++) {
    const prev = bars[i - period].close;
    if (prev > 0) {
      result[i] = ((bars[i].close - prev) / prev) * 100;
    }
  }

  return result;
}

/**
 * Momentum (Absolute Price Difference)
 */
export function computeMomentum(bars: OHLCVBar[], period = 10): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);

  for (let i = period; i < len; i++) {
    result[i] = bars[i].close - bars[i - period].close;
  }

  return result;
}

/**
 * Ultimate Oscillator (7, 14, 28)
 */
export function computeUltimateOscillator(
  bars: OHLCVBar[],
  period1 = 7,
  period2 = 14,
  period3 = 28
): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len <= period3) return result;

  const bp: number[] = [0];
  const tr: number[] = [bars[0].high - bars[0].low];

  for (let i = 1; i < len; i++) {
    const prevClose = bars[i - 1].close;
    const trueLow = Math.min(bars[i].low, prevClose);
    const trueHigh = Math.max(bars[i].high, prevClose);
    bp.push(bars[i].close - trueLow);
    tr.push(trueHigh - trueLow);
  }

  for (let i = period3; i < len; i++) {
    let bpSum1 = 0, trSum1 = 0;
    for (let j = i - period1 + 1; j <= i; j++) {
      bpSum1 += bp[j];
      trSum1 += tr[j];
    }
    const avg1 = trSum1 > 0 ? bpSum1 / trSum1 : 0;

    let bpSum2 = 0, trSum2 = 0;
    for (let j = i - period2 + 1; j <= i; j++) {
      bpSum2 += bp[j];
      trSum2 += tr[j];
    }
    const avg2 = trSum2 > 0 ? bpSum2 / trSum2 : 0;

    let bpSum3 = 0, trSum3 = 0;
    for (let j = i - period3 + 1; j <= i; j++) {
      bpSum3 += bp[j];
      trSum3 += tr[j];
    }
    const avg3 = trSum3 > 0 ? bpSum3 / trSum3 : 0;

    result[i] = 100 * ((4 * avg1 + 2 * avg2 + avg3) / 7);
  }

  return result;
}

/**
 * Awesome Oscillator (AO)
 * SMA(5, Median) - SMA(34, Median)
 */
export function computeAwesomeOscillator(bars: OHLCVBar[]): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len < 34) return result;

  const median = bars.map(b => (b.high + b.low) / 2);
  const sma5 = calculateSMA(median, 5);
  const sma34 = calculateSMA(median, 34);

  for (let i = 33; i < len; i++) {
    if (sma5[i] !== null && sma34[i] !== null) {
      result[i] = sma5[i]! - sma34[i]!;
    }
  }

  return result;
}

/**
 * PPO - Percentage Price Oscillator
 */
export interface PPOOutput {
  ppo: number | null;
  signal: number | null;
  histogram: number | null;
}

export function computePPO(
  bars: OHLCVBar[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): PPOOutput[] {
  const len = bars.length;
  const result: PPOOutput[] = new Array(len).fill(null).map(() => ({
    ppo: null,
    signal: null,
    histogram: null
  }));

  if (len < slowPeriod) return result;

  const closes = bars.map(b => b.close);
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const rawPPO: (number | null)[] = new Array(len).fill(null);
  for (let i = 0; i < len; i++) {
    const f = fastEMA[i];
    const s = slowEMA[i];
    if (f !== null && s !== null && s > 0) {
      rawPPO[i] = ((f - s) / s) * 100;
    }
  }

  const validPPO: number[] = [];
  const validIndices: number[] = [];
  for (let i = 0; i < len; i++) {
    if (rawPPO[i] !== null) {
      validPPO.push(rawPPO[i]!);
      validIndices.push(i);
    }
  }

  const signalEMA = calculateEMA(validPPO, signalPeriod);

  for (let k = 0; k < validIndices.length; k++) {
    const origIdx = validIndices[k];
    const p = validPPO[k];
    const s = signalEMA[k];
    result[origIdx].ppo = p;
    result[origIdx].signal = s;
    if (s !== null) {
      result[origIdx].histogram = p - s;
    }
  }

  return result;
}

/**
 * TSI - True Strength Index
 * Double smoothed momentum indicator
 */
export interface TSIOutput {
  tsi: number | null;
  signal: number | null;
}

export function computeTSI(
  bars: OHLCVBar[],
  longPeriod = 25,
  shortPeriod = 13,
  signalPeriod = 7
): TSIOutput[] {
  const len = bars.length;
  const result: TSIOutput[] = new Array(len).fill(null).map(() => ({
    tsi: null,
    signal: null
  }));

  if (len < longPeriod + shortPeriod) return result;

  const m: number[] = [0];
  const absM: number[] = [0];

  for (let i = 1; i < len; i++) {
    const diff = bars[i].close - bars[i - 1].close;
    m.push(diff);
    absM.push(Math.abs(diff));
  }

  const emaLongM = calculateEMA(m, longPeriod);
  const nonNullLongM = emaLongM.filter((v): v is number => v !== null);
  const emaDoubleM = calculateEMA(nonNullLongM, shortPeriod);

  const emaLongAbsM = calculateEMA(absM, longPeriod);
  const nonNullLongAbsM = emaLongAbsM.filter((v): v is number => v !== null);
  const emaDoubleAbsM = calculateEMA(nonNullLongAbsM, shortPeriod);

  const tsiValues: (number | null)[] = new Array(len).fill(null);
  const offset = len - emaDoubleM.length;

  for (let i = 0; i < emaDoubleM.length; i++) {
    const num = emaDoubleM[i];
    const den = emaDoubleAbsM[i];
    if (num !== null && den !== null && den > 0) {
      tsiValues[offset + i] = 100 * (num / den);
    }
  }

  const validTSI: number[] = [];
  const validIdx: number[] = [];
  for (let i = 0; i < len; i++) {
    if (tsiValues[i] !== null) {
      validTSI.push(tsiValues[i]!);
      validIdx.push(i);
    }
  }

  const signal = calculateEMA(validTSI, signalPeriod);

  for (let k = 0; k < validIdx.length; k++) {
    const origIdx = validIdx[k];
    result[origIdx].tsi = validTSI[k];
    result[origIdx].signal = signal[k];
  }

  return result;
}

/**
 * RVI - Relative Vigor Index
 */
export interface RVIOutput {
  rvi: number | null;
  signal: number | null;
}

export function computeRVI(bars: OHLCVBar[], period = 10): RVIOutput[] {
  const len = bars.length;
  const result: RVIOutput[] = new Array(len).fill(null).map(() => ({
    rvi: null,
    signal: null
  }));

  if (len < period + 3) return result;

  const num: number[] = new Array(len).fill(0);
  const den: number[] = new Array(len).fill(0);

  for (let i = 3; i < len; i++) {
    const c0 = bars[i].close - bars[i].open;
    const c1 = bars[i - 1].close - bars[i - 1].open;
    const c2 = bars[i - 2].close - bars[i - 2].open;
    const c3 = bars[i - 3].close - bars[i - 3].open;
    num[i] = (c0 + 2 * c1 + 2 * c2 + c3) / 6;

    const h0 = bars[i].high - bars[i].low;
    const h1 = bars[i - 1].high - bars[i - 1].low;
    const h2 = bars[i - 2].high - bars[i - 2].low;
    const h3 = bars[i - 3].high - bars[i - 3].low;
    den[i] = (h0 + 2 * h1 + 2 * h2 + h3) / 6;
  }

  const smaNum = calculateSMA(num, period);
  const smaDen = calculateSMA(den, period);
  const rviValues: (number | null)[] = new Array(len).fill(null);

  for (let i = period + 2; i < len; i++) {
    const n = smaNum[i];
    const d = smaDen[i];
    if (n !== null && d !== null && d > 0) {
      rviValues[i] = n / d;
    }
  }

  for (let i = period + 5; i < len; i++) {
    const r0 = rviValues[i];
    const r1 = rviValues[i - 1];
    const r2 = rviValues[i - 2];
    const r3 = rviValues[i - 3];
    if (r0 !== null && r1 !== null && r2 !== null && r3 !== null) {
      result[i].rvi = r0;
      result[i].signal = (r0 + 2 * r1 + 2 * r2 + r3) / 6;
    }
  }

  return result;
}

/**
 * Fisher Transform
 */
export interface FisherOutput {
  fisher: number | null;
  trigger: number | null;
}

export function computeFisherTransform(bars: OHLCVBar[], period = 9): FisherOutput[] {
  const len = bars.length;
  const result: FisherOutput[] = new Array(len).fill(null).map(() => ({
    fisher: null,
    trigger: null
  }));

  if (len < period) return result;

  const median = bars.map(b => (b.high + b.low) / 2);
  let prevValue = 0;
  let prevFisher = 0;

  for (let i = period - 1; i < len; i++) {
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (median[j] < minPrice) minPrice = median[j];
      if (median[j] > maxPrice) maxPrice = median[j];
    }

    const denom = maxPrice - minPrice;
    let raw = denom === 0 ? 0 : (median[i] - minPrice) / denom;
    raw = 2 * (raw - 0.5);

    let val = 0.33 * raw + 0.67 * prevValue;
    val = Math.max(-0.999, Math.min(0.999, val));
    prevValue = val;

    const fish = 0.5 * Math.log((1 + val) / (1 - val)) + 0.5 * prevFisher;
    result[i] = {
      fisher: fish,
      trigger: prevFisher
    };
    prevFisher = fish;
  }

  return result;
}

/**
 * CMO - Chande Momentum Oscillator
 */
export function computeCMO(bars: OHLCVBar[], period = 14): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len <= period) return result;

  const gains: number[] = [0];
  const losses: number[] = [0];

  for (let i = 1; i < len; i++) {
    const diff = bars[i].close - bars[i - 1].close;
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  for (let i = period; i < len; i++) {
    let sumG = 0;
    let sumL = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumG += gains[j];
      sumL += losses[j];
    }
    const sum = sumG + sumL;
    result[i] = sum === 0 ? 0 : 100 * ((sumG - sumL) / sum);
  }

  return result;
}

/**
 * Connors RSI (Composite: RSI(3), Streak RSI(2), Percentile Rank(100))
 */
export function computeConnorsRSI(
  bars: OHLCVBar[],
  rsiPeriod = 3,
  streakPeriod = 2,
  rankPeriod = 100
): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len < rankPeriod) return result;

  const rsi = computeRSI(bars, rsiPeriod);

  // Compute Streak series
  const streaks: number[] = new Array(len).fill(0);
  let currentStreak = 0;
  for (let i = 1; i < len; i++) {
    if (bars[i].close > bars[i - 1].close) {
      currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
    } else if (bars[i].close < bars[i - 1].close) {
      currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
    } else {
      currentStreak = 0;
    }
    streaks[i] = currentStreak;
  }

  // RSI of streak
  const streakBars: OHLCVBar[] = streaks.map((s, idx) => ({
    date: bars[idx].date,
    open: s,
    high: s,
    low: s,
    close: s,
    volume: 1
  }));
  const streakRSI = computeRSI(streakBars, streakPeriod);

  // 1-day return percentile rank over rankPeriod
  for (let i = rankPeriod; i < len; i++) {
    const todayROC = bars[i - 1].close > 0 ? (bars[i].close - bars[i - 1].close) / bars[i - 1].close : 0;
    let countLower = 0;
    for (let j = i - rankPeriod; j < i; j++) {
      const pastROC = bars[j - 1]?.close > 0 ? (bars[j].close - bars[j - 1].close) / bars[j - 1].close : 0;
      if (pastROC < todayROC) countLower++;
    }
    const rank = (countLower / rankPeriod) * 100;

    const r = rsi[i];
    const s = streakRSI[i];
    if (r !== null && s !== null) {
      result[i] = (r + s + rank) / 3;
    }
  }

  return result;
}
