import { getCachedBars } from '../data/liveBarsCache';
import { OHLCVBar } from '../types/technicalIndicators';
import { TechnicalIndicators, TechnicalScoreBreakdown } from '../types';

function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ============================================================================
// STEP 1 — Pure Calculation Helper Functions
// ============================================================================

/**
 * Simple moving average of the last `period` closes.
 * Returns null if closes.length < period.
 */
export function calculateSMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const sum = slice.reduce((acc, c) => acc + c, 0);
  return round(sum / period, 2);
}

/**
 * Full EMA series seeded with SMA of the first `period` values.
 * Returns empty array if closes.length < period.
 */
export function calculateEMASeries(closes: number[], period: number): number[] {
  if (closes.length < period) return [];
  const multiplier = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((acc, c) => acc + c, 0) / period;
  const series: number[] = [round(ema, 4)];

  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
    series.push(round(ema, 4));
  }

  return series;
}

/**
 * Standard EMA: seed with SMA of first `period` values, return latest value.
 * Returns null if closes.length < period.
 */
export function calculateEMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const series = calculateEMASeries(closes, period);
  return series.length > 0 ? round(series[series.length - 1], 2) : null;
}

/**
 * Standard Wilder's RSI.
 * Returns null if closes.length < period + 1.
 */
export function calculateRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;

  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  let avgGain = gains.slice(0, period).reduce((sum, g) => sum + g, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, l) => sum + l, 0) / period;

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  return round(rsi, 2);
}

/**
 * MACD with EMA12, EMA26, Signal9.
 * Returns null if closes.length < 26 + 9.
 */
export function calculateMACD(
  closes: number[]
): { macdLine: number; signalLine: number; histogram: number } | null {
  if (closes.length < 26 + 9) return null;

  const ema12 = calculateEMASeries(closes, 12);
  const ema26 = calculateEMASeries(closes, 26);
  if (ema12.length === 0 || ema26.length === 0) return null;

  // Align to end of both series
  const offset = ema12.length - ema26.length;
  const macdSeries: number[] = [];
  for (let i = 0; i < ema26.length; i++) {
    macdSeries.push(round(ema12[i + offset] - ema26[i], 4));
  }

  const signalLineVal = calculateEMA(macdSeries, 9);
  if (signalLineVal === null || macdSeries.length === 0) return null;

  const macdLine = round(macdSeries[macdSeries.length - 1], 2);
  const signalLine = round(signalLineVal, 2);
  const histogram = round(macdLine - signalLine, 2);

  return { macdLine, signalLine, histogram };
}

/**
 * Bollinger Bands around 20-period SMA with stdDevMultiplier.
 * Returns null if closes.length < period.
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): { upper: number; middle: number; lower: number; bandwidth: number } | null {
  if (closes.length < period) return null;

  const slice = closes.slice(-period);
  const middle = slice.reduce((sum, c) => sum + c, 0) / period;
  const variance = slice.reduce((sum, c) => sum + Math.pow(c - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = middle + stdDevMultiplier * stdDev;
  const lower = middle - stdDevMultiplier * stdDev;
  const bandwidth = middle !== 0 ? (upper - lower) / middle : 0;

  return {
    upper: round(upper, 2),
    middle: round(middle, 2),
    lower: round(lower, 2),
    bandwidth: round(bandwidth, 4),
  };
}

/**
 * Average True Range using Wilder's smoothing.
 * Returns null if bars.length < period + 1.
 */
export function calculateATR(bars: OHLCVBar[], period = 14): number | null {
  if (bars.length < period + 1) return null;

  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevClose = bars[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trs.push(tr);
  }

  let atr = trs.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }

  return round(atr, 2);
}

/**
 * Standard ADX / Directional Movement Index.
 */
export function calculateADX(
  bars: OHLCVBar[],
  period = 14
): { adx: number | null; plusDI: number | null; minusDI: number | null } {
  if (bars.length < period + 1) {
    return { adx: null, plusDI: null, minusDI: null };
  }

  const plusDMs: number[] = [];
  const minusDMs: number[] = [];
  const trs: number[] = [];

  for (let i = 1; i < bars.length; i++) {
    const upMove = bars[i].high - bars[i - 1].high;
    const downMove = bars[i - 1].low - bars[i].low;
    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);

    const high = bars[i].high;
    const low = bars[i].low;
    const prevClose = bars[i - 1].close;
    trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }

  // Smooth first period
  let smoothTR = trs.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
  let smoothPlusDM = plusDMs.slice(0, period).reduce((sum, dm) => sum + dm, 0) / period;
  let smoothMinusDM = minusDMs.slice(0, period).reduce((sum, dm) => sum + dm, 0) / period;

  let currentPlusDI = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : 0;
  let currentMinusDI = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : 0;
  let diSum = currentPlusDI + currentMinusDI;
  let dx = diSum > 0 ? (Math.abs(currentPlusDI - currentMinusDI) / diSum) * 100 : 0;

  const dxSeries: number[] = [dx];

  for (let i = period; i < trs.length; i++) {
    smoothTR = (smoothTR * (period - 1) + trs[i]) / period;
    smoothPlusDM = (smoothPlusDM * (period - 1) + plusDMs[i]) / period;
    smoothMinusDM = (smoothMinusDM * (period - 1) + minusDMs[i]) / period;

    currentPlusDI = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : 0;
    currentMinusDI = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : 0;
    diSum = currentPlusDI + currentMinusDI;
    dx = diSum > 0 ? (Math.abs(currentPlusDI - currentMinusDI) / diSum) * 100 : 0;
    dxSeries.push(dx);
  }

  let finalADX: number | null = null;
  if (dxSeries.length >= period) {
    let adx = dxSeries.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
    for (let i = period; i < dxSeries.length; i++) {
      adx = (adx * (period - 1) + dxSeries[i]) / period;
    }
    finalADX = round(adx, 2);
  }

  return {
    adx: finalADX,
    plusDI: round(currentPlusDI, 2),
    minusDI: round(currentMinusDI, 2),
  };
}

// ============================================================================
// STEP 2 — getIndicators Implementation
// ============================================================================

export const technicalService = {
  /**
   * Existing method preserved for backward compatibility.
   */
  async getTechnicalAnalysis(symbol: string) {
    return {
      symbol,
      score: 75,
      rsi: 58.4,
      macd: 'Bullish Crossover',
    };
  },

  async getIndicators(symbol: string): Promise<TechnicalIndicators> {
    const bars = getCachedBars(symbol);
    const closes = bars.map(b => b.close);
    const lastBar = bars[bars.length - 1];

    if (bars.length < 30) {
      return {
        symbol,
        date: lastBar?.date || '',
        price: lastBar?.close || 0,
        hasMinimumHistory: false,
        historyDays: bars.length,
        insufficientDataReason: `Only ${bars.length} trading days of history available; at least 30 are needed for technical indicators.`,
        sma20: null,
        sma50: null,
        sma200: null,
        ema20: null,
        rsi14: null,
        macd: null,
        bollingerBands: null,
        atr14: null,
        adx14: null,
        plusDI: null,
        minusDI: null,
        obv: null,
        volumeMA20: null,
        roc14: null,
        momentum10: null,
        vwap: null,
      };
    }

    const adxResult = calculateADX(bars, 14);

    // Compute supplementary indicators
    const last20 = bars.slice(-20);
    const volumeMA20 =
      last20.length >= 20
        ? Math.round(last20.reduce((sum, b) => sum + b.volume, 0) / 20)
        : null;

    const roc14 =
      closes.length >= 15
        ? round(
            ((closes[closes.length - 1] - closes[closes.length - 15]) /
              closes[closes.length - 15]) *
              100,
            2
          )
        : null;

    const momentum10 =
      closes.length >= 11
        ? round(closes[closes.length - 1] - closes[closes.length - 11], 2)
        : null;

    let currentObv = 0;
    for (let i = 1; i < bars.length; i++) {
      if (bars[i].close > bars[i - 1].close) currentObv += bars[i].volume;
      else if (bars[i].close < bars[i - 1].close) currentObv -= bars[i].volume;
    }

    const totalTurnover = bars.reduce(
      (sum, b) => sum + (b.turnover || b.close * b.volume),
      0
    );
    const totalVolume = bars.reduce((sum, b) => sum + b.volume, 0);
    const vwap = totalVolume > 0 ? round(totalTurnover / totalVolume, 2) : null;

    return {
      symbol,
      date: lastBar.date,
      price: lastBar.close,
      hasMinimumHistory: true,
      historyDays: bars.length,
      insufficientDataReason: undefined,
      sma20: calculateSMA(closes, 20),
      sma50: calculateSMA(closes, 50),
      sma200: calculateSMA(closes, 200),
      ema20: calculateEMA(closes, 20),
      rsi14: calculateRSI(closes, 14),
      macd: calculateMACD(closes),
      bollingerBands: calculateBollingerBands(closes, 20, 2),
      atr14: calculateATR(bars, 14),
      adx14: adxResult.adx,
      plusDI: adxResult.plusDI,
      minusDI: adxResult.minusDI,
      obv: currentObv,
      volumeMA20,
      roc14,
      momentum10,
      vwap,
    };
  },

  // ==========================================================================
  // STEP 3 — calculateTechnicalScore Implementation
  // ==========================================================================

  calculateTechnicalScore(
    indicators: TechnicalIndicators,
    bars?: OHLCVBar[]
  ): TechnicalScoreBreakdown {
    const price = indicators.price;

    // 1. Trend Score (0-20)
    let trendScore = 10;
    if (
      indicators.sma20 !== null &&
      indicators.sma50 !== null &&
      indicators.sma200 !== null
    ) {
      let pts = 0;
      if (price > indicators.sma20) pts += 5;
      if (indicators.sma20 > indicators.sma50) pts += 5;
      if (indicators.sma50 > indicators.sma200) pts += 5;
      if (price > indicators.sma200) pts += 5;
      trendScore = pts;
    } else if (indicators.sma20 !== null && indicators.sma50 !== null) {
      let pts = 0;
      if (price > indicators.sma20) pts += 5;
      if (price > indicators.sma50) pts += 5;
      if (indicators.sma20 > indicators.sma50) pts += 4;
      trendScore = pts; // max 14
    } else if (indicators.sma20 !== null) {
      trendScore = price > indicators.sma20 ? 10 : 4;
    }

    // 2. Momentum Score (0-20)
    let rsiBase = 10;
    if (indicators.rsi14 !== null) {
      rsiBase = 10 + (indicators.rsi14 - 50) / 2;
      rsiBase = Math.min(20, Math.max(0, rsiBase));
    }
    let macdAdj = 0;
    if (indicators.macd && indicators.macd.histogram !== null) {
      if (indicators.macd.histogram > 0) macdAdj = 5;
      else if (indicators.macd.histogram < 0) macdAdj = -5;
    }
    const momentumScore = Math.min(20, Math.max(0, Math.round(rsiBase + macdAdj)));

    // 3. Volume Score (0-20)
    const actualBars =
      bars && bars.length > 0 ? bars : getCachedBars(indicators.symbol);
    let volumeScore = 12;
    if (actualBars && actualBars.length > 0) {
      const lastBar = actualBars[actualBars.length - 1];
      const recent20 = actualBars.slice(-20);
      const avgVol =
        recent20.reduce((sum, b) => sum + b.volume, 0) / recent20.length;

      if (avgVol > 0 && lastBar) {
        const ratio = lastBar.volume / avgVol;
        if (ratio >= 1.5) {
          volumeScore = 20;
        } else if (ratio <= 0.5) {
          volumeScore = 5;
        } else if (ratio < 1.0) {
          volumeScore = Math.round(5 + ((ratio - 0.5) / 0.5) * 7);
        } else {
          volumeScore = Math.round(12 + ((ratio - 1.0) / 0.5) * 8);
        }
      }
    }

    // 4. Structure Score (0-20)
    let structureScore = 10;
    if (
      indicators.bollingerBands &&
      indicators.bollingerBands.upper !== null &&
      indicators.bollingerBands.middle !== null &&
      indicators.bollingerBands.lower !== null
    ) {
      const { upper, middle, lower } = indicators.bollingerBands;
      if (price <= lower) {
        structureScore = 18;
      } else if (price >= upper) {
        structureScore = 5;
      } else if (price < middle) {
        const span = middle - lower;
        const pct = span > 0 ? (price - lower) / span : 0.5;
        structureScore = Math.round(18 - pct * 8);
      } else {
        const span = upper - middle;
        const pct = span > 0 ? (price - middle) / span : 0.5;
        structureScore = Math.round(10 - pct * 5);
      }
    }

    // 5. Volatility Score (0-20)
    let volatilityScore = 10;
    if (indicators.bollingerBands && indicators.bollingerBands.bandwidth !== null) {
      const bw = indicators.bollingerBands.bandwidth;
      if (bw >= 0.08 && bw <= 0.2) {
        volatilityScore = 19;
      } else if (bw < 0.04) {
        volatilityScore = 9;
      } else if (bw > 0.35) {
        volatilityScore = 8;
      } else if (bw < 0.08) {
        volatilityScore = Math.round(9 + ((bw - 0.04) / 0.04) * 10);
      } else {
        volatilityScore = Math.round(19 - ((bw - 0.2) / 0.15) * 11);
      }
      volatilityScore = Math.min(20, Math.max(0, volatilityScore));
    }

    // Aggregate score
    const totalScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          trendScore +
            momentumScore +
            volumeScore +
            structureScore +
            volatilityScore
        )
      )
    );

    // Conditions
    let trendCondition: TechnicalScoreBreakdown['trendCondition'] = 'Consolidation';
    if (trendScore >= 17) trendCondition = 'Strong Uptrend';
    else if (trendScore >= 12) trendCondition = 'Uptrend';
    else if (trendScore >= 8) trendCondition = 'Consolidation';
    else if (trendScore >= 4) trendCondition = 'Downtrend';
    else trendCondition = 'Strong Downtrend';

    let momentumCondition: TechnicalScoreBreakdown['momentumCondition'] = 'Neutral';
    if (indicators.rsi14 !== null) {
      if (indicators.rsi14 < 30) momentumCondition = 'Oversold';
      else if (indicators.rsi14 < 45) momentumCondition = 'Bearish';
      else if (indicators.rsi14 < 55) momentumCondition = 'Neutral';
      else if (indicators.rsi14 < 70) momentumCondition = 'Bullish';
      else momentumCondition = 'Strongly Bullish';
    }

    const volumeConfirmation = volumeScore >= 14;
    const supportLevel =
      indicators.bollingerBands?.lower ?? round(price * 0.95, 2);
    const resistanceLevel =
      indicators.bollingerBands?.upper ?? round(price * 1.05, 2);

    // Dynamic Key Observations
    const keyObservations: string[] = [];

    // Trend observation
    if (
      indicators.sma20 !== null &&
      indicators.sma50 !== null &&
      price > indicators.sma20 &&
      indicators.sma20 > indicators.sma50
    ) {
      keyObservations.push(
        `Price is trading above both 20-day (NPR ${indicators.sma20}) and 50-day (NPR ${indicators.sma50}) moving averages, confirming bullish trend alignment.`
      );
    } else if (
      indicators.sma20 !== null &&
      indicators.sma50 !== null &&
      price < indicators.sma20 &&
      indicators.sma20 < indicators.sma50
    ) {
      keyObservations.push(
        `Price is trading below key 20-day and 50-day moving averages, signaling sustained downward pressure.`
      );
    } else if (indicators.sma20 !== null) {
      keyObservations.push(
        `Price is fluctuating near the 20-day SMA (NPR ${indicators.sma20}), indicating trend consolidation.`
      );
    }

    // Momentum / RSI observation
    if (indicators.rsi14 !== null) {
      if (indicators.rsi14 >= 70) {
        keyObservations.push(
          `RSI at ${indicators.rsi14} indicates overbought conditions.`
        );
      } else if (indicators.rsi14 <= 30) {
        keyObservations.push(
          `RSI at ${indicators.rsi14} indicates deeply oversold conditions.`
        );
      } else if (indicators.rsi14 >= 55) {
        keyObservations.push(
          `RSI at ${indicators.rsi14} reflects positive momentum building above the midpoint.`
        );
      } else {
        keyObservations.push(
          `RSI at ${indicators.rsi14} indicates neutral to subdued momentum.`
        );
      }
    }

    // MACD observation
    if (indicators.macd && indicators.macd.histogram !== null) {
      if (indicators.macd.histogram > 0) {
        keyObservations.push(
          `MACD histogram is positive (+${indicators.macd.histogram}), providing a bullish momentum signal.`
        );
      } else {
        keyObservations.push(
          `MACD histogram is negative (${indicators.macd.histogram}), reflecting bearish momentum pressure.`
        );
      }
    }

    // Volume observation
    if (volumeConfirmation) {
      keyObservations.push(
        `Volume score (${volumeScore}/20) confirms strong market participation backing the recent price action.`
      );
    }

    return {
      totalScore,
      trendScore,
      momentumScore,
      volumeScore,
      structureScore,
      volatilityScore,
      trendCondition,
      momentumCondition,
      volumeConfirmation,
      supportLevel,
      resistanceLevel,
      keyObservations: keyObservations.slice(0, 4),
    };
  },

  // ==========================================================================
  // STEP 4 — getScoreForSymbol Implementation
  // ==========================================================================

  async getScoreForSymbol(symbol: string): Promise<TechnicalScoreBreakdown> {
    const indicators = await this.getIndicators(symbol);
    const bars = getCachedBars(symbol);
    return this.calculateTechnicalScore(indicators, bars);
  },
};
