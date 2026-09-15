/**
 * Volume Indicators Calculation Suite
 * Implements: Volume SMA/EMA, OBV, MFI, Chaikin Money Flow (CMF),
 * Accumulation/Distribution (A/D), Volume Oscillator, Force Index,
 * Ease of Movement (EMV), NVI, PVI, VWAP & Anchored VWAP
 * Calculation Version: v1.0
 */

import { OHLCVBar } from '../../types/technicalIndicators';
import {
  calculateEMA,
  calculateSMA,
  safeDivide
} from './common';

export const VOLUME_INDICATOR_VERSION = 'v1.0';

/**
 * Volume Moving Averages (SMA & EMA)
 */
export function computeVolumeMA(
  bars: OHLCVBar[],
  period = 20
): { volumeSMA: (number | null)[]; volumeEMA: (number | null)[] } {
  const volumes = bars.map(b => b.volume);
  return {
    volumeSMA: calculateSMA(volumes, period),
    volumeEMA: calculateEMA(volumes, period)
  };
}

/**
 * OBV - On-Balance Volume
 */
export function computeOBV(bars: OHLCVBar[]): number[] {
  const len = bars.length;
  if (len === 0) return [];

  const obv: number[] = [bars[0].volume];

  for (let i = 1; i < len; i++) {
    const prevClose = bars[i - 1].close;
    const currClose = bars[i].close;
    const vol = bars[i].volume;
    const prevOBV = obv[i - 1];

    if (currClose > prevClose) {
      obv.push(prevOBV + vol);
    } else if (currClose < prevClose) {
      obv.push(prevOBV - vol);
    } else {
      obv.push(prevOBV);
    }
  }

  return obv;
}

/**
 * MFI - Money Flow Index (Volume-weighted RSI)
 */
export function computeMFI(bars: OHLCVBar[], period = 14): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len <= period) return result;

  const typicalPrices = bars.map(b => (b.high + b.low + b.close) / 3);
  const posFlow: number[] = [0];
  const negFlow: number[] = [0];

  for (let i = 1; i < len; i++) {
    const rawMoneyFlow = typicalPrices[i] * bars[i].volume;
    if (typicalPrices[i] > typicalPrices[i - 1]) {
      posFlow.push(rawMoneyFlow);
      negFlow.push(0);
    } else if (typicalPrices[i] < typicalPrices[i - 1]) {
      posFlow.push(0);
      negFlow.push(rawMoneyFlow);
    } else {
      posFlow.push(0);
      negFlow.push(0);
    }
  }

  for (let i = period; i < len; i++) {
    let sumPos = 0;
    let sumNeg = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumPos += posFlow[j];
      sumNeg += negFlow[j];
    }

    if (sumNeg === 0) {
      result[i] = 100;
    } else if (sumPos === 0) {
      result[i] = 0;
    } else {
      const moneyRatio = sumPos / sumNeg;
      result[i] = 100 - 100 / (1 + moneyRatio);
    }
  }

  return result;
}

/**
 * Chaikin Money Flow (CMF)
 */
export function computeCMF(bars: OHLCVBar[], period = 20): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len < period) return result;

  const mfv: number[] = [];
  for (let i = 0; i < len; i++) {
    const hl = bars[i].high - bars[i].low;
    if (hl > 0) {
      const multiplier = (bars[i].close - bars[i].low - (bars[i].high - bars[i].close)) / hl;
      mfv.push(multiplier * bars[i].volume);
    } else {
      mfv.push(0);
    }
  }

  for (let i = period - 1; i < len; i++) {
    let sumMFV = 0;
    let sumVol = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumMFV += mfv[j];
      sumVol += bars[j].volume;
    }
    result[i] = sumVol > 0 ? sumMFV / sumVol : 0;
  }

  return result;
}

/**
 * Accumulation/Distribution Line (A/D)
 */
export function computeAccumulationDistribution(bars: OHLCVBar[]): number[] {
  const len = bars.length;
  if (len === 0) return [];

  const ad: number[] = [];
  let currentAD = 0;

  for (let i = 0; i < len; i++) {
    const hl = bars[i].high - bars[i].low;
    let mfm = 0;
    if (hl > 0) {
      mfm = (bars[i].close - bars[i].low - (bars[i].high - bars[i].close)) / hl;
    }
    const mfv = mfm * bars[i].volume;
    currentAD += mfv;
    ad.push(currentAD);
  }

  return ad;
}

/**
 * Volume Oscillator
 * Percentage difference between two Volume EMAs
 */
export function computeVolumeOscillator(
  bars: OHLCVBar[],
  shortPeriod = 5,
  longPeriod = 10
): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len < longPeriod) return result;

  const volumes = bars.map(b => b.volume);
  const fastEMA = calculateEMA(volumes, shortPeriod);
  const slowEMA = calculateEMA(volumes, longPeriod);

  for (let i = longPeriod - 1; i < len; i++) {
    const f = fastEMA[i];
    const s = slowEMA[i];
    if (f !== null && s !== null && s > 0) {
      result[i] = ((f - s) / s) * 100;
    }
  }

  return result;
}

/**
 * Force Index
 * Measures the power behind price movements: (Close - Close_prev) * Volume
 */
export function computeForceIndex(bars: OHLCVBar[], period = 13): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len < period + 1) return result;

  const rawFI: number[] = [0];
  for (let i = 1; i < len; i++) {
    rawFI.push((bars[i].close - bars[i - 1].close) * bars[i].volume);
  }

  const smoothed = calculateEMA(rawFI, period);
  return smoothed;
}

/**
 * Ease of Movement (EMV)
 */
export function computeEMV(bars: OHLCVBar[], period = 14, divisor = 1000000): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);
  if (len <= period) return result;

  const rawEMV: number[] = [0];
  for (let i = 1; i < len; i++) {
    const midCurr = (bars[i].high + bars[i].low) / 2;
    const midPrev = (bars[i - 1].high + bars[i - 1].low) / 2;
    const distance = midCurr - midPrev;
    const hl = bars[i].high - bars[i].low;

    if (hl > 0 && bars[i].volume > 0) {
      const boxRatio = (bars[i].volume / divisor) / hl;
      rawEMV.push(distance / boxRatio);
    } else {
      rawEMV.push(0);
    }
  }

  const sma = calculateSMA(rawEMV, period);
  return sma;
}

/**
 * Negative Volume Index (NVI) & Positive Volume Index (PVI)
 * NVI moves only on days when volume decreases.
 * PVI moves only on days when volume increases.
 */
export function computeNVIandPVI(bars: OHLCVBar[]): { nvi: number[]; pvi: number[] } {
  const len = bars.length;
  if (len === 0) return { nvi: [], pvi: [] };

  const nvi: number[] = [1000];
  const pvi: number[] = [1000];

  for (let i = 1; i < len; i++) {
    const prevNVI = nvi[i - 1];
    const prevPVI = pvi[i - 1];
    const prevClose = bars[i - 1].close;
    const pctChange = prevClose > 0 ? (bars[i].close - prevClose) / prevClose : 0;

    // NVI
    if (bars[i].volume < bars[i - 1].volume) {
      nvi.push(prevNVI + pctChange * prevNVI);
    } else {
      nvi.push(prevNVI);
    }

    // PVI
    if (bars[i].volume > bars[i - 1].volume) {
      pvi.push(prevPVI + pctChange * prevPVI);
    } else {
      pvi.push(prevPVI);
    }
  }

  return { nvi, pvi };
}

/**
 * VWAP - Volume Weighted Average Price
 *
 * IMPORTANT ARCHITECTURAL & DATA ASSUMPTION NOTE:
 * True intraday VWAP accumulates tick/minute bars and resets daily at session open.
 * When applied to historical DAILY OHLCV bars (as in daily NEPSE data), this calculation
 * computes the Cumulative VWAP from series inception (or from a configurable anchor date).
 * This provides the true volume-weighted benchmark price of the historical window without
 * faking intraday tick distributions.
 */
export function computeVWAP(bars: OHLCVBar[]): number[] {
  const len = bars.length;
  if (len === 0) return [];

  const vwap: number[] = [];
  let cumPV = 0;
  let cumVol = 0;

  for (let i = 0; i < len; i++) {
    const tp = (bars[i].high + bars[i].low + bars[i].close) / 3;
    const vol = bars[i].volume;
    cumPV += tp * vol;
    cumVol += vol;
    vwap.push(cumVol > 0 ? cumPV / cumVol : bars[i].close);
  }

  return vwap;
}

/**
 * Anchored VWAP
 * Resets cumulative volume and price-volume sum at a specific anchor date (e.g. quarterly earnings, swing pivot, year start)
 */
export function computeAnchoredVWAP(bars: OHLCVBar[], anchorDate: string): (number | null)[] {
  const len = bars.length;
  const result: (number | null)[] = new Array(len).fill(null);

  let cumPV = 0;
  let cumVol = 0;
  let isAnchored = false;

  for (let i = 0; i < len; i++) {
    if (bars[i].date >= anchorDate) {
      isAnchored = true;
    }

    if (isAnchored) {
      const tp = (bars[i].high + bars[i].low + bars[i].close) / 3;
      const vol = bars[i].volume;
      cumPV += tp * vol;
      cumVol += vol;
      result[i] = cumVol > 0 ? cumPV / cumVol : bars[i].close;
    }
  }

  return result;
}
