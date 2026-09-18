/**
 * Feature Calculation Engine for Phase 3C
 * Calculates standardized research features with strict zero look-ahead bias,
 * robust normalization algorithms (rolling z-score, percentile rank, ATR-normalization),
 * and configurable bin discretization.
 */

import { OHLCVBar } from '../../types/technicalIndicators';
import { PrecomputedIndicators } from '../research/signalConditionEngine';
import {
  FeatureDefinition,
  FeatureObservation,
  FeatureBin,
  NormalizationMethod
} from '../../types/featureEngine';
import { FeatureRegistry } from './featureRegistry';

export class FeatureCalculationEngine {
  /**
   * Discretize a scalar value into a defined FeatureBin
   */
  public static discretizeValue(
    value: number | null,
    bins: FeatureBin[]
  ): { binId: string; binLabel: string } | undefined {
    if (value === null || isNaN(value)) return undefined;

    for (const bin of bins) {
      const minPass = bin.inclusiveMin ? value >= bin.min : value > bin.min;
      const maxPass = bin.inclusiveMax ? value <= bin.max : value < bin.max;
      if (minPass && maxPass) {
        return { binId: bin.id, binLabel: bin.label };
      }
    }
    return undefined;
  }

  /**
   * Calculate rolling percentile rank strictly using historical values in window [t - window + 1 ... t]
   * Zero look-ahead bias: future indices are NEVER inspected.
   */
  public static calculateRollingPercentile(
    series: (number | null)[],
    t: number,
    window: number = 100
  ): number | null {
    if (t < 0 || t >= series.length) return null;
    const currentVal = series[t];
    if (currentVal === null || isNaN(currentVal)) return null;

    const startIdx = Math.max(0, t - window + 1);
    const validPastValues: number[] = [];

    for (let i = startIdx; i <= t; i++) {
      const val = series[i];
      if (val !== null && !isNaN(val)) {
        validPastValues.push(val);
      }
    }

    if (validPastValues.length < 5) return null; // Minimum observations required for meaningful rank

    const countBelow = validPastValues.filter(v => v < currentVal).length;
    const countEqual = validPastValues.filter(v => v === currentVal).length;

    // Standard mid-rank percentile formula: (countBelow + 0.5 * countEqual) / N * 100
    const rankPercentile = ((countBelow + 0.5 * countEqual) / validPastValues.length) * 100;
    return Math.round(rankPercentile * 10) / 10;
  }

  /**
   * Calculate rolling Z-score strictly using past window [t - window + 1 ... t]
   */
  public static calculateRollingZScore(
    series: (number | null)[],
    t: number,
    window: number = 50
  ): number | null {
    if (t < 0 || t >= series.length) return null;
    const currentVal = series[t];
    if (currentVal === null || isNaN(currentVal)) return null;

    const startIdx = Math.max(0, t - window + 1);
    const validPastValues: number[] = [];

    for (let i = startIdx; i <= t; i++) {
      const val = series[i];
      if (val !== null && !isNaN(val)) {
        validPastValues.push(val);
      }
    }

    if (validPastValues.length < 10) return null;

    const mean = validPastValues.reduce((sum, v) => sum + v, 0) / validPastValues.length;
    const variance =
      validPastValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
      (validPastValues.length - 1);
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;
    const zScore = (currentVal - mean) / stdDev;
    return Math.round(zScore * 100) / 100;
  }

  /**
   * Evaluates ATR-normalized distance: (price - MA) / ATR
   */
  public static calculateAtrNormalizedDistance(
    price: number,
    ma: number | null,
    atr: number | null
  ): number | null {
    if (ma === null || atr === null || atr <= 0) return null;
    const dist = (price - ma) / atr;
    return Math.round(dist * 100) / 100;
  }

  /**
   * Calculates a specific research feature at bar index t for a stock
   * Enforces zero look-ahead bias strictly.
   */
  public static calculateFeatureObservation(
    def: FeatureDefinition,
    indicators: PrecomputedIndicators,
    t: number,
    symbol: string,
    crossSectionalRanks?: Map<string, number> // Optional cross-sectional map for the date
  ): FeatureObservation {
    const bars = indicators.bars;
    const bar = bars[t];
    const timestamp = bar?.date ?? '1970-01-01';

    let rawValue: number | null = null;
    let normalizedValue: number | null = null;

    switch (def.featureId) {
      case 'FEAT_PRICE_VS_SMA50_ATR': {
        const close = bar.close;
        const sma50 = indicators.sma50[t];
        const atr14 = indicators.atr14[t];
        rawValue = this.calculateAtrNormalizedDistance(close, sma50, atr14);
        normalizedValue = rawValue;
        break;
      }

      case 'FEAT_SMA20_SMA50_RATIO': {
        const sma20 = indicators.sma20[t];
        const sma50 = indicators.sma50[t];
        if (sma20 !== null && sma50 !== null && sma50 > 0) {
          rawValue = ((sma20 - sma50) / sma50) * 100;
          rawValue = Math.round(rawValue * 100) / 100;
          normalizedValue = rawValue;
        }
        break;
      }

      case 'FEAT_ADX_TREND_STRENGTH': {
        rawValue = indicators.adx14[t];
        normalizedValue = rawValue !== null ? Math.min(100, Math.max(0, rawValue)) : null;
        break;
      }

      case 'FEAT_RSI_14_ZONE': {
        rawValue = indicators.rsi14[t];
        normalizedValue = rawValue;
        break;
      }

      case 'FEAT_RSI_ROLLING_PERCENTILE': {
        rawValue = indicators.rsi14[t];
        normalizedValue = this.calculateRollingPercentile(indicators.rsi14, t, 100);
        break;
      }

      case 'FEAT_MACD_HIST_NORM': {
        const hist = indicators.macd.hist[t];
        const atr = indicators.atr14[t];
        if (hist !== null && atr !== null && atr > 0) {
          rawValue = hist / atr;
          rawValue = Math.round(rawValue * 100) / 100;
          normalizedValue = rawValue;
        }
        break;
      }

      case 'FEAT_STOCH_K_14': {
        // Stochastic %K calculated over rolling 14 bars [t-13 ... t]
        const period = 14;
        if (t >= period - 1) {
          let highestHigh = -Infinity;
          let lowestLow = Infinity;
          for (let i = t - period + 1; i <= t; i++) {
            if (bars[i].high > highestHigh) highestHigh = bars[i].high;
            if (bars[i].low < lowestLow) lowestLow = bars[i].low;
          }
          const range = highestHigh - lowestLow;
          if (range > 0) {
            rawValue = ((bar.close - lowestLow) / range) * 100;
            rawValue = Math.round(rawValue * 10) / 10;
            normalizedValue = rawValue;
          }
        }
        break;
      }

      case 'FEAT_VOLUME_MA20_RATIO': {
        const currentVol = bar.volume;
        // Volume SMA 20
        let sumVol = 0;
        const period = 20;
        if (t >= period - 1) {
          for (let i = t - period + 1; i <= t; i++) {
            sumVol += bars[i].volume;
          }
          const avgVol = sumVol / period;
          if (avgVol > 0) {
            rawValue = currentVol / avgVol;
            rawValue = Math.round(rawValue * 100) / 100;
            normalizedValue = rawValue;
          }
        }
        break;
      }

      case 'FEAT_CMF_20': {
        rawValue = indicators.cmf20[t];
        normalizedValue = rawValue;
        break;
      }

      case 'FEAT_ATR_PERCENTILE_100': {
        rawValue = indicators.atr14[t];
        normalizedValue = this.calculateRollingPercentile(indicators.atr14, t, 100);
        break;
      }

      case 'FEAT_BB_BANDWIDTH': {
        const upper = indicators.bb.upper[t];
        const lower = indicators.bb.lower[t];
        const middle = indicators.bb.middle[t];
        if (upper !== null && lower !== null && middle !== null && middle > 0) {
          rawValue = ((upper - lower) / middle) * 100;
          rawValue = Math.round(rawValue * 100) / 100;
          normalizedValue = rawValue;
        }
        break;
      }

      case 'FEAT_DIST_FROM_20D_HIGH': {
        const period = 20;
        if (t >= period - 1) {
          let highest = -Infinity;
          for (let i = t - period + 1; i <= t; i++) {
            if (bars[i].high > highest) highest = bars[i].high;
          }
          if (highest > 0) {
            rawValue = ((bar.close - highest) / highest) * 100;
            rawValue = Math.round(rawValue * 100) / 100;
            normalizedValue = rawValue;
          }
        }
        break;
      }

      case 'FEAT_RS_NEPSE_20D': {
        // Stock 20-day return vs estimated market baseline
        const period = 20;
        if (t >= period) {
          const stockReturn = ((bar.close - bars[t - period].close) / bars[t - period].close) * 100;
          // Approximate sector/market return from moving average trend
          const smaDiff = indicators.sma50[t] && indicators.sma50[t - period]
            ? ((indicators.sma50[t]! - indicators.sma50[t - period]!) / indicators.sma50[t - period]!) * 100
            : 0;
          rawValue = stockReturn - smaDiff;
          rawValue = Math.round(rawValue * 100) / 100;
          normalizedValue = rawValue;
        }
        break;
      }

      case 'FEAT_MARKET_REGIME_STATE': {
        const close = bar.close;
        const sma50 = indicators.sma50[t];
        const sma20 = indicators.sma20[t];
        if (sma20 !== null && sma50 !== null) {
          if (close > sma50 && sma20 > sma50) rawValue = 1; // Bull
          else if (close < sma50 && sma20 < sma50) rawValue = -1; // Bear
          else rawValue = 0; // Sideways
          normalizedValue = rawValue;
        }
        break;
      }

      case 'FEAT_SECTOR_TREND_STATE': {
        const close = bar.close;
        const sma20 = indicators.sma20[t];
        if (sma20 !== null) {
          if (close > sma20 * 1.01) rawValue = 1;
          else if (close < sma20 * 0.99) rawValue = -1;
          else rawValue = 0;
          normalizedValue = rawValue;
        }
        break;
      }

      case 'FEAT_TURNOVER_20D_AVG': {
        const period = 20;
        if (t >= period - 1) {
          let sumTurnover = 0;
          for (let i = t - period + 1; i <= t; i++) {
            sumTurnover += bars[i].close * bars[i].volume;
          }
          // In Lakhs NPR (1 Lakh = 100,000)
          rawValue = sumTurnover / period / 100000;
          rawValue = Math.round(rawValue * 10) / 10;
          normalizedValue = rawValue;
        }
        break;
      }

      case 'FEAT_ROLLING_Z_SCORE_50': {
        const closes = bars.map(b => b.close);
        rawValue = this.calculateRollingZScore(closes, t, 50);
        normalizedValue = rawValue;
        break;
      }

      case 'FEAT_CROSS_SECTIONAL_MOMENTUM_PCT': {
        if (crossSectionalRanks && crossSectionalRanks.has(symbol)) {
          rawValue = crossSectionalRanks.get(symbol)!;
          normalizedValue = rawValue;
        } else {
          // Fallback to stock's own 20d return percentile
          const period = 20;
          if (t >= period) {
            const ret = ((bar.close - bars[t - period].close) / bars[t - period].close) * 100;
            rawValue = Math.min(100, Math.max(0, Math.round((ret + 15) * (100 / 30))));
            normalizedValue = rawValue;
          }
        }
        break;
      }

      case 'FEAT_BULLISH_ALIGNMENT_SCORE': {
        let score = 0;
        const close = bar.close;
        if (indicators.sma50[t] !== null && close > indicators.sma50[t]!) score++;
        if (indicators.sma20[t] !== null && indicators.sma50[t] !== null && indicators.sma20[t]! > indicators.sma50[t]!) score++;
        if (indicators.rsi14[t] !== null && indicators.rsi14[t]! > 50) score++;
        if (indicators.adx14[t] !== null && indicators.adx14[t]! > 20) score++;
        if (indicators.macd.hist[t] !== null && indicators.macd.hist[t]! > 0) score++;
        rawValue = score;
        normalizedValue = score;
        break;
      }

      default:
        rawValue = null;
        normalizedValue = null;
    }

    // Discretize into bin
    const binAssignment = this.discretizeValue(
      def.normalizationMethod === 'PERCENTILE_RANK' || def.normalizationMethod === 'ROLLING_Z_SCORE'
        ? normalizedValue
        : rawValue,
      def.defaultBins
    );

    return {
      featureId: def.featureId,
      name: def.name,
      category: def.category,
      sourceIndicator: def.sourceIndicator,
      parameters: def.parameters,
      value: rawValue,
      normalizedValue,
      binId: binAssignment?.binId,
      binLabel: binAssignment?.binLabel,
      timestamp,
      symbol,
      timeframe: 'DAILY',
      barIndex: t,
      calculationVersion: def.calculationVersion
    };
  }

  /**
   * Precomputes full feature observation table for a symbol across all historical bars [warmup ... N-1]
   */
  public static computeAllFeaturesForStock(
    indicators: PrecomputedIndicators,
    symbol: string,
    warmupBars: number = 30
  ): Map<string, FeatureObservation[]> {
    const featureMap = new Map<string, FeatureObservation[]>();
    const allDefs = FeatureRegistry.getAllFeatures();

    allDefs.forEach(def => {
      featureMap.set(def.featureId, []);
    });

    const bars = indicators.bars;
    for (let t = warmupBars; t < bars.length; t++) {
      for (const def of allDefs) {
        const obs = this.calculateFeatureObservation(def, indicators, t, symbol);
        featureMap.get(def.featureId)!.push(obs);
      }
    }

    return featureMap;
  }
}
