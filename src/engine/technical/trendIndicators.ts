/**
 * Trend Indicators Calculation Suite
 * Implements: MACD, ADX (+DI, -DI), Aroon, Parabolic SAR, Supertrend,
 * Ichimoku Cloud, TRIX, Vortex Indicator, DPO, Linear Regression & Slope, Mass Index
 * Calculation Version: v1.0
 */

import { OHLCVBar } from '../../types/technicalIndicators';
import {
  calculateEMA,
  calculateRMA,
  calculateSMA,
  calculateTrueRange,
  safeDivide
} from './common';

export const TREND_INDICATOR_VERSION = 'v1.0';

/**
 * MACD Output structure
 */
export interface MACDOutput {
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

export function computeMACD(
  bars: OHLCVBar[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDOutput[] {
  const closes = bars.map(b => b.close);
  const len = bars.length;
  const result: MACDOutput[] = new Array(len).fill(null).map(() => ({
    macd: null,
    signal: null,
    histogram: null
  }));

  if (len < slowPeriod) return result;

  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdValues: (number | null)[] = new Array(len).fill(null);
  for (let i = 0; i < len; i++) {
    const f = fastEMA[i];
    const s = slowEMA[i];
    if (f !== null && s !== null) {
      macdValues[i] = f - s;
    }
  }

  // Calculate signal EMA over non-null macd values
  const validMacd: number[] = [];
  const validIndices: number[] = [];
  for (let i = 0; i < len; i++) {
    if (macdValues[i] !== null) {
      validMacd.push(macdValues[i]!);
      validIndices.push(i);
    }
  }

  if (validMacd.length < signalPeriod) return result;

  const signalEMA = calculateEMA(validMacd, signalPeriod);

  for (let k = 0; k < validIndices.length; k++) {
    const origIndex = validIndices[k];
    const m = validMacd[k];
    const s = signalEMA[k];
    result[origIndex].macd = m;
    result[origIndex].signal = s;
    if (s !== null) {
      result[origIndex].histogram = m - s;
    }
  }

  return result;
}

/**
 * ADX (+DI, -DI) Output structure
 */
export interface ADXOutput {
  adx: number | null;
  plusDI: number | null;
  minusDI: number | null;
}

export function computeADX(bars: OHLCVBar[], period = 14): ADXOutput[] {
  const len = bars.length;
  const result: ADXOutput[] = new Array(len).fill(null).map(() => ({
    adx: null,
    plusDI: null,
    minusDI: null
  }));

  if (len < period * 2) return result;

  const tr = calculateTrueRange(bars);
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];

  for (let i = 1; i < len; i++) {
    const upMove = bars[i].high - bars[i - 1].high;
    const downMove = bars[i - 1].low - bars[i].low;

    if (upMove > downMove && upMove > 0) {
      plusDM.push(upMove);
    } else {
      plusDM.push(0);
    }

    if (downMove > upMove && downMove > 0) {
      minusDM.push(downMove);
    } else {
      minusDM.push(0);
    }
  }

  const smoothedTR = calculateRMA(tr, period);
  const smoothedPlusDM = calculateRMA(plusDM, period);
  const smoothedMinusDM = calculateRMA(minusDM, period);

  const dxValues: (number | null)[] = new Array(len).fill(null);

  for (let i = 0; i < len; i++) {
    const sTR = smoothedTR[i];
    const sPDM = smoothedPlusDM[i];
    const sMDM = smoothedMinusDM[i];

    if (sTR !== null && sPDM !== null && sMDM !== null && sTR > 0) {
      const pDI = (sPDM / sTR) * 100;
      const mDI = (sMDM / sTR) * 100;
      result[i].plusDI = pDI;
      result[i].minusDI = mDI;

      const diSum = pDI + mDI;
      if (diSum > 0) {
        dxValues[i] = (Math.abs(pDI - mDI) / diSum) * 100;
      }
    }
  }

  // Smooth DX using RMA over period to get ADX
  const validDX: number[] = [];
  const validIndices: number[] = [];
  for (let i = 0; i < len; i++) {
    if (dxValues[i] !== null) {
      validDX.push(dxValues[i]!);
      validIndices.push(i);
    }
  }

  if (validDX.length >= period) {
    const smoothedDX = calculateRMA(validDX, period);
    for (let k = 0; k < validIndices.length; k++) {
      const origIndex = validIndices[k];
      result[origIndex].adx = smoothedDX[k];
    }
  }

  return result;
}

/**
 * Aroon Indicator Output
 */
export interface AroonOutput {
  aroonUp: number | null;
  aroonDown: number | null;
  aroonOscillator: number | null;
}

export function computeAroon(bars: OHLCVBar[], period = 25): AroonOutput[] {
  const len = bars.length;
  const result: AroonOutput[] = new Array(len).fill(null).map(() => ({
    aroonUp: null,
    aroonDown: null,
    aroonOscillator: null
  }));

  if (len < period) return result;

  for (let i = period - 1; i < len; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    let highestIndex = -1;
    let lowestIndex = -1;

    for (let j = i - period + 1; j <= i; j++) {
      if (bars[j].high >= highestHigh) {
        highestHigh = bars[j].high;
        highestIndex = j;
      }
      if (bars[j].low <= lowestLow) {
        lowestLow = bars[j].low;
        lowestIndex = j;
      }
    }

    const barsSinceHigh = i - highestIndex;
    const barsSinceLow = i - lowestIndex;

    const up = ((period - barsSinceHigh) / period) * 100;
    const down = ((period - barsSinceLow) / period) * 100;

    result[i] = {
      aroonUp: up,
      aroonDown: down,
      aroonOscillator: up - down
    };
  }

  return result;
}

/**
 * Parabolic SAR (Stop and Reverse)
 */
export interface ParabolicSAROutput {
  sar: number | null;
  isLong: boolean | null;
}

export function computeParabolicSAR(
  bars: OHLCVBar[],
  step = 0.02,
  maxStep = 0.2
): ParabolicSAROutput[] {
  const len = bars.length;
  const result: ParabolicSAROutput[] = new Array(len).fill(null).map(() => ({
    sar: null,
    isLong: null
  }));

  if (len < 2) return result;

  let isLong = bars[1].close >= bars[0].close;
  let af = step;
  let ep = isLong ? Math.max(bars[0].high, bars[1].high) : Math.min(bars[0].low, bars[1].low);
  let sar = isLong ? Math.min(bars[0].low, bars[1].low) : Math.max(bars[0].high, bars[1].high);

  result[0] = { sar, isLong };

  for (let i = 1; i < len; i++) {
    let newSar = sar + af * (ep - sar);

    if (isLong) {
      // SAR cannot be higher than low of previous two bars
      if (i >= 1) newSar = Math.min(newSar, bars[i - 1].low);
      if (i >= 2) newSar = Math.min(newSar, bars[i - 2].low);

      if (bars[i].low < newSar) {
        // Reverse to Short
        isLong = false;
        sar = ep;
        af = step;
        ep = bars[i].low;
      } else {
        sar = newSar;
        if (bars[i].high > ep) {
          ep = bars[i].high;
          af = Math.min(af + step, maxStep);
        }
      }
    } else {
      // Short: SAR cannot be lower than high of previous two bars
      if (i >= 1) newSar = Math.max(newSar, bars[i - 1].high);
      if (i >= 2) newSar = Math.max(newSar, bars[i - 2].high);

      if (bars[i].high > newSar) {
        // Reverse to Long
        isLong = true;
        sar = ep;
        af = step;
        ep = bars[i].high;
      } else {
        sar = newSar;
        if (bars[i].low < ep) {
          ep = bars[i].low;
          af = Math.min(af + step, maxStep);
        }
      }
    }

    result[i] = { sar, isLong };
  }

  return result;
}

/**
 * Supertrend Indicator
 */
export interface SupertrendOutput {
  supertrend: number | null;
  direction: 'BULLISH' | 'BEARISH' | null;
  upperBand: number | null;
  lowerBand: number | null;
}

export function computeSupertrend(
  bars: OHLCVBar[],
  period = 10,
  multiplier = 3.0
): SupertrendOutput[] {
  const len = bars.length;
  const result: SupertrendOutput[] = new Array(len).fill(null).map(() => ({
    supertrend: null,
    direction: null,
    upperBand: null,
    lowerBand: null
  }));

  if (len < period) return result;

  const tr = calculateTrueRange(bars);
  const atr = calculateRMA(tr, period);

  const basicUpper: (number | null)[] = new Array(len).fill(null);
  const basicLower: (number | null)[] = new Array(len).fill(null);
  const finalUpper: (number | null)[] = new Array(len).fill(null);
  const finalLower: (number | null)[] = new Array(len).fill(null);

  for (let i = period - 1; i < len; i++) {
    const a = atr[i];
    if (a === null) continue;

    const hl2 = (bars[i].high + bars[i].low) / 2;
    basicUpper[i] = hl2 + multiplier * a;
    basicLower[i] = hl2 - multiplier * a;

    if (i === period - 1) {
      finalUpper[i] = basicUpper[i];
      finalLower[i] = basicLower[i];
      result[i] = {
        supertrend: basicLower[i],
        direction: 'BULLISH',
        upperBand: basicUpper[i],
        lowerBand: basicLower[i]
      };
      continue;
    }

    // Final upper band logic
    const prevFinalUpper = finalUpper[i - 1]!;
    if (basicUpper[i]! < prevFinalUpper || bars[i - 1].close > prevFinalUpper) {
      finalUpper[i] = basicUpper[i];
    } else {
      finalUpper[i] = prevFinalUpper;
    }

    // Final lower band logic
    const prevFinalLower = finalLower[i - 1]!;
    if (basicLower[i]! > prevFinalLower || bars[i - 1].close < prevFinalLower) {
      finalLower[i] = basicLower[i];
    } else {
      finalLower[i] = prevFinalLower;
    }

    // Determine current trend direction
    const prevTrend = result[i - 1].direction;
    let currTrend: 'BULLISH' | 'BEARISH' = prevTrend || 'BULLISH';
    let currVal: number;

    if (currTrend === 'BULLISH') {
      if (bars[i].close < finalLower[i]!) {
        currTrend = 'BEARISH';
        currVal = finalUpper[i]!;
      } else {
        currVal = finalLower[i]!;
      }
    } else {
      if (bars[i].close > finalUpper[i]!) {
        currTrend = 'BULLISH';
        currVal = finalLower[i]!;
      } else {
        currVal = finalUpper[i]!;
      }
    }

    result[i] = {
      supertrend: currVal,
      direction: currTrend,
      upperBand: finalUpper[i],
      lowerBand: finalLower[i]
    };
  }

  return result;
}

/**
 * Ichimoku Cloud Output
 */
export interface IchimokuOutput {
  tenkan: number | null; // Conversion line (9)
  kijun: number | null; // Base line (26)
  senkouA: number | null; // Leading Span A (26 ahead)
  senkouB: number | null; // Leading Span B (52, 26 ahead)
  chikou: number | null; // Lagging Span (26 behind)
}

export function computeIchimoku(
  bars: OHLCVBar[],
  tenkanPeriod = 9,
  kijunPeriod = 26,
  senkouBPeriod = 52
): IchimokuOutput[] {
  const len = bars.length;
  const result: IchimokuOutput[] = new Array(len).fill(null).map(() => ({
    tenkan: null,
    kijun: null,
    senkouA: null,
    senkouB: null,
    chikou: null
  }));

  const getHL2 = (start: number, end: number) => {
    let maxH = -Infinity;
    let minL = Infinity;
    for (let i = start; i <= end; i++) {
      if (bars[i].high > maxH) maxH = bars[i].high;
      if (bars[i].low < minL) minL = bars[i].low;
    }
    return (maxH + minL) / 2;
  };

  for (let i = 0; i < len; i++) {
    // Tenkan
    if (i >= tenkanPeriod - 1) {
      result[i].tenkan = getHL2(i - tenkanPeriod + 1, i);
    }
    // Kijun
    if (i >= kijunPeriod - 1) {
      result[i].kijun = getHL2(i - kijunPeriod + 1, i);
    }
    // Senkou Span A current calculated point
    if (result[i].tenkan !== null && result[i].kijun !== null) {
      result[i].senkouA = (result[i].tenkan! + result[i].kijun!) / 2;
    }
    // Senkou Span B
    if (i >= senkouBPeriod - 1) {
      result[i].senkouB = getHL2(i - senkouBPeriod + 1, i);
    }
    // Chikou Span
    result[i].chikou = bars[i].close;
  }

  return result;
}

/**
 * TRIX - Triple Smoothed EMA Rate of Change
 */
export function computeTRIX(bars: OHLCVBar[], period = 15): (number | null)[] {
  const closes = bars.map(b => b.close);
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);

  if (len < period * 3) return result;

  const ema1 = calculateEMA(closes, period);
  const nonNull1 = ema1.filter((v): v is number => v !== null);
  if (nonNull1.length < period) return result;

  const ema2 = calculateEMA(nonNull1, period);
  const nonNull2 = ema2.filter((v): v is number => v !== null);
  if (nonNull2.length < period) return result;

  const ema3 = calculateEMA(nonNull2, period);

  // Map ema3 back to original indices
  const offset = len - ema3.length;
  for (let i = 1; i < ema3.length; i++) {
    const prev = ema3[i - 1];
    const curr = ema3[i];
    if (prev !== null && curr !== null && prev !== 0) {
      result[offset + i] = ((curr - prev) / prev) * 100;
    }
  }

  return result;
}

/**
 * Vortex Indicator (+VI, -VI)
 */
export interface VortexOutput {
  plusVI: number | null;
  minusVI: number | null;
}

export function computeVortex(bars: OHLCVBar[], period = 14): VortexOutput[] {
  const len = bars.length;
  const result: VortexOutput[] = new Array(len).fill(null).map(() => ({
    plusVI: null,
    minusVI: null
  }));

  if (len <= period) return result;

  const tr = calculateTrueRange(bars);
  const vmPlus: number[] = [0];
  const vmMinus: number[] = [0];

  for (let i = 1; i < len; i++) {
    vmPlus.push(Math.abs(bars[i].high - bars[i - 1].low));
    vmMinus.push(Math.abs(bars[i].low - bars[i - 1].high));
  }

  for (let i = period; i < len; i++) {
    let sumTR = 0;
    let sumVMPlus = 0;
    let sumVMMinus = 0;

    for (let j = i - period + 1; j <= i; j++) {
      sumTR += tr[j];
      sumVMPlus += vmPlus[j];
      sumVMMinus += vmMinus[j];
    }

    if (sumTR > 0) {
      result[i] = {
        plusVI: sumVMPlus / sumTR,
        minusVI: sumVMMinus / sumTR
      };
    }
  }

  return result;
}

/**
 * DPO - Detrended Price Oscillator
 * Removes long-term cycles to reveal short-term cycles
 */
export function computeDPO(bars: OHLCVBar[], period = 20): (number | null)[] {
  const closes = bars.map(b => b.close);
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);

  const shift = Math.floor(period / 2) + 1;
  const sma = calculateSMA(closes, period);

  for (let i = 0; i < len; i++) {
    const smaIndex = i - shift;
    if (smaIndex >= 0 && sma[smaIndex] !== null) {
      result[i] = closes[i] - sma[smaIndex]!;
    }
  }

  return result;
}

/**
 * Linear Regression & Slope
 */
export interface LinearRegressionOutput {
  regressionLine: number | null;
  slope: number | null;
  intercept: number | null;
  rSquared: number | null;
}

export function computeLinearRegression(bars: OHLCVBar[], period = 14): LinearRegressionOutput[] {
  const closes = bars.map(b => b.close);
  const len = bars.length;
  const result: LinearRegressionOutput[] = new Array(len).fill(null).map(() => ({
    regressionLine: null,
    slope: null,
    intercept: null,
    rSquared: null
  }));

  if (len < period) return result;

  // Pre-calculate x sums for x = 1..period
  let sumX = 0;
  let sumX2 = 0;
  for (let x = 1; x <= period; x++) {
    sumX += x;
    sumX2 += x * x;
  }
  const xMean = sumX / period;

  for (let i = period - 1; i < len; i++) {
    let sumY = 0;
    let sumXY = 0;
    let sumY2 = 0;

    for (let j = 0; j < period; j++) {
      const x = j + 1;
      const y = closes[i - period + 1 + j];
      sumY += y;
      sumXY += x * y;
      sumY2 += y * y;
    }

    const yMean = sumY / period;
    const numerator = sumXY - (sumX * sumY) / period;
    const denominator = sumX2 - (sumX * sumX) / period;

    const slope = safeDivide(numerator, denominator, 0);
    const intercept = yMean - slope * xMean;
    const regValue = intercept + slope * period;

    // R-squared
    let ssTot = 0;
    let ssRes = 0;
    for (let j = 0; j < period; j++) {
      const x = j + 1;
      const y = closes[i - period + 1 + j];
      const yPred = intercept + slope * x;
      ssRes += Math.pow(y - yPred, 2);
      ssTot += Math.pow(y - yMean, 2);
    }
    const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

    result[i] = {
      regressionLine: regValue,
      slope,
      intercept,
      rSquared
    };
  }

  return result;
}

/**
 * Mass Index - identifies trend reversals by measuring band widening
 */
export function computeMassIndex(bars: OHLCVBar[], emaPeriod = 9, sumPeriod = 25): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);

  if (len < emaPeriod * 2 + sumPeriod) return result;

  const hlDiff = bars.map(b => b.high - b.low);
  const ema1 = calculateEMA(hlDiff, emaPeriod);

  const nonNullEma1 = ema1.filter((v): v is number => v !== null);
  if (nonNullEma1.length < emaPeriod) return result;

  const ema2Sub = calculateEMA(nonNullEma1, emaPeriod);

  const ratios: (number | null)[] = new Array(len).fill(null);
  let subIndex = 0;
  for (let i = 0; i < len; i++) {
    if (ema1[i] !== null) {
      const e2 = ema2Sub[subIndex];
      if (e2 !== null && e2 !== undefined && e2 > 0) {
        ratios[i] = ema1[i]! / e2;
      }
      subIndex++;
    }
  }

  for (let i = sumPeriod - 1; i < len; i++) {
    let sum = 0;
    let valid = true;
    for (let j = i - sumPeriod + 1; j <= i; j++) {
      if (ratios[j] === null) {
        valid = false;
        break;
      }
      sum += ratios[j]!;
    }
    if (valid) {
      result[i] = sum;
    }
  }

  return result;
}
