/**
 * Signal Condition Engine
 * Evaluates feature conditions at historical bar index t strictly using causal indicators.
 * Supports:
 * - Single condition templates (RSI, Moving Averages, MACD, Volume expansion, Bollinger, ADX, Candlesticks)
 * - Threshold sweeps for exploring empirical parameter landscapes
 * - Combinations using explicit AND / OR logic trees
 */

import { OHLCVBar } from '../../types/technicalIndicators';
import {
  SingleCondition,
  ConditionGroup,
  ParameterSweepResult,
  HoldingHorizon
} from '../../types/historicalResearch';
import { indicatorRegistry } from '../technical/indicatorRegistry';
import { ResearchCausalityGuard } from './researchCausalityGuard';

export interface PrecomputedIndicators {
  bars: OHLCVBar[];
  rsi14: (number | null)[];
  sma20: (number | null)[];
  sma50: (number | null)[];
  sma200: (number | null)[];
  ema20: (number | null)[];
  atr14: (number | null)[];
  macd: { macd: (number | null)[]; signal: (number | null)[]; hist: (number | null)[] };
  bb: { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] };
  adx14: (number | null)[];
  volumeSMA20: (number | null)[];
  supertrend: { value: (number | null)[]; direction: string[] };
  cmf20: (number | null)[];
}

export class SignalConditionEngine {
  /**
   * Precomputes indicator vectors once for a given bar series to ensure high performance
   * during multi-condition sweeps (Section 38: Avoid recalculating identical indicator series).
   */
  public static precomputeIndicators(bars: OHLCVBar[], symbol: string): PrecomputedIndicators {
    const len = bars.length;

    const rsiRes = indicatorRegistry.execute('RSI', bars, { period: 14 }, symbol, 'DAILY');
    const sma20Res = indicatorRegistry.execute('SMA', bars, { period: 20 }, symbol, 'DAILY');
    const sma50Res = indicatorRegistry.execute('SMA', bars, { period: 50 }, symbol, 'DAILY');
    const sma200Res = indicatorRegistry.execute('SMA', bars, { period: 200 }, symbol, 'DAILY');
    const ema20Res = indicatorRegistry.execute('EMA', bars, { period: 20 }, symbol, 'DAILY');
    const macdRes = indicatorRegistry.execute('MACD', bars, {}, symbol, 'DAILY');
    const bbRes = indicatorRegistry.execute('BOLLINGER', bars, { period: 20, stdDevMultiplier: 2.0 }, symbol, 'DAILY');
    const adxRes = indicatorRegistry.execute('ADX', bars, { period: 14 }, symbol, 'DAILY');
    const atrRes = indicatorRegistry.execute('ATR', bars, { period: 14 }, symbol, 'DAILY');
    const stRes = indicatorRegistry.execute('SUPERTREND', bars, {}, symbol, 'DAILY');
    const cmfRes = indicatorRegistry.execute('CMF', bars, { period: 20 }, symbol, 'DAILY');

    // 20-period Volume SMA
    const volumes = bars.map(b => b.volume);
    const volumeSMA20: (number | null)[] = [];
    for (let i = 0; i < len; i++) {
      if (i < 19) {
        volumeSMA20.push(null);
      } else {
        let sum = 0;
        for (let j = i - 19; j <= i; j++) {
          sum += volumes[j];
        }
        volumeSMA20.push(sum / 20);
      }
    }

    const rsi14 = rsiRes.series.map(s => (s.values.rsi as number) ?? null);
    const sma20 = sma20Res.series.map(s => (s.values.sma as number) ?? null);
    const sma50 = sma50Res.series.map(s => (s.values.sma as number) ?? null);
    const sma200 = sma200Res.series.map(s => (s.values.sma as number) ?? null);
    const ema20 = ema20Res.series.map(s => (s.values.ema as number) ?? null);
    const atr14 = atrRes.series.map(s => (s.values.atr as number) ?? null);

    const macd = {
      macd: macdRes.series.map(s => (s.values.macd as number) ?? null),
      signal: macdRes.series.map(s => (s.values.signal as number) ?? null),
      hist: macdRes.series.map(s => (s.values.histogram as number) ?? null)
    };

    const bb = {
      upper: bbRes.series.map(s => (s.values.upper as number) ?? null),
      middle: bbRes.series.map(s => (s.values.middle as number) ?? null),
      lower: bbRes.series.map(s => (s.values.lower as number) ?? null)
    };

    const adx14 = adxRes.series.map(s => (s.values.adx as number) ?? null);
    const supertrend = {
      value: stRes.series.map(s => (s.values.supertrend as number) ?? null),
      direction: stRes.series.map(s => String(s.values.direction || 'NEUTRAL'))
    };

    const cmf20 = cmfRes.series.map(s => (s.values.cmf as number) ?? null);

    return {
      bars,
      rsi14,
      sma20,
      sma50,
      sma200,
      ema20,
      atr14,
      macd,
      bb,
      adx14,
      volumeSMA20,
      supertrend,
      cmf20
    };
  }

  /**
   * Evaluate whether a single condition holds at bar index t
   */
  public static evaluateSingleCondition(
    condition: SingleCondition,
    indicators: PrecomputedIndicators,
    t: number
  ): boolean {
    if (t < 1 || t >= indicators.bars.length) return false;

    // Guard: causality assert
    ResearchCausalityGuard.assertTemporalCausality(t, t, condition.description);

    const getFieldValue = (ind: string, field: string, idx: number): number | null => {
      switch (ind.toUpperCase()) {
        case 'CLOSE':
        case 'PRICE':
          return indicators.bars[idx]?.close ?? null;
        case 'VOLUME':
          return indicators.bars[idx]?.volume ?? null;
        case 'RSI':
          return indicators.rsi14[idx] ?? null;
        case 'SMA20':
          return indicators.sma20[idx] ?? null;
        case 'SMA50':
          return indicators.sma50[idx] ?? null;
        case 'SMA200':
          return indicators.sma200[idx] ?? null;
        case 'EMA20':
          return indicators.ema20[idx] ?? null;
        case 'MACD':
          if (field === 'histogram' || field === 'hist') return indicators.macd.hist[idx] ?? null;
          if (field === 'signal') return indicators.macd.signal[idx] ?? null;
          return indicators.macd.macd[idx] ?? null;
        case 'BOLLINGER':
          if (field === 'upper') return indicators.bb.upper[idx] ?? null;
          if (field === 'lower') return indicators.bb.lower[idx] ?? null;
          return indicators.bb.middle[idx] ?? null;
        case 'ADX':
          return indicators.adx14[idx] ?? null;
        case 'VOLUMESMA20':
        case 'VOL_SMA20':
          return indicators.volumeSMA20[idx] ?? null;
        case 'CMF':
          return indicators.cmf20[idx] ?? null;
        default:
          return null;
      }
    };

    const currentVal = getFieldValue(condition.indicator, condition.field, t);
    const prevVal = getFieldValue(condition.indicator, condition.field, t - 1);

    if (currentVal === null) return false;

    // Determine target comparison value
    let targetVal = 0;
    if (condition.thresholdType === 'VALUE') {
      targetVal = condition.thresholdValue ?? 0;
    } else if (condition.thresholdType === 'INDICATOR_FIELD' && condition.targetIndicator) {
      const fieldVal = getFieldValue(condition.targetIndicator, condition.targetField || 'value', t);
      if (fieldVal === null) return false;
      targetVal = fieldVal * (condition.multiplier ?? 1.0);
    }

    switch (condition.comparator) {
      case '>':
        return currentVal > targetVal;
      case '<':
        return currentVal < targetVal;
      case '>=':
        return currentVal >= targetVal;
      case '<=':
        return currentVal <= targetVal;
      case '==':
        return Math.abs(currentVal - targetVal) < 0.0001;
      case 'INCREASING':
        return prevVal !== null && currentVal > prevVal;
      case 'DECREASING':
        return prevVal !== null && currentVal < prevVal;
      case 'CROSSES_ABOVE': {
        if (prevVal === null) return false;
        let prevTarget = targetVal;
        if (condition.thresholdType === 'INDICATOR_FIELD' && condition.targetIndicator) {
          const pt = getFieldValue(condition.targetIndicator, condition.targetField || 'value', t - 1);
          if (pt === null) return false;
          prevTarget = pt * (condition.multiplier ?? 1.0);
        }
        return prevVal <= prevTarget && currentVal > targetVal;
      }
      case 'CROSSES_BELOW': {
        if (prevVal === null) return false;
        let prevTarget = targetVal;
        if (condition.thresholdType === 'INDICATOR_FIELD' && condition.targetIndicator) {
          const pt = getFieldValue(condition.targetIndicator, condition.targetField || 'value', t - 1);
          if (pt === null) return false;
          prevTarget = pt * (condition.multiplier ?? 1.0);
        }
        return prevVal >= prevTarget && currentVal < targetVal;
      }
      default:
        return false;
    }
  }

  /**
   * Evaluate a recursive condition tree at bar index t
   */
  public static evaluateConditionTree(
    node: ConditionGroup | SingleCondition,
    indicators: PrecomputedIndicators,
    t: number
  ): boolean {
    if ('operator' in node) {
      if (node.conditions.length === 0) return false;

      if (node.operator === 'AND') {
        return node.conditions.every(c => this.evaluateConditionTree(c, indicators, t));
      } else {
        return node.conditions.some(c => this.evaluateConditionTree(c, indicators, t));
      }
    } else {
      return this.evaluateSingleCondition(node, indicators, t);
    }
  }

  /**
   * Library of standard research condition presets
   */
  public static getStandardConditionPresets(): Array<{
    id: string;
    label: string;
    description: string;
    tree: ConditionGroup;
  }> {
    return [
      {
        id: 'RSI_OVERSOLD_REBOUND',
        label: 'RSI(14) < 30 (Oversold Area)',
        description: 'Historical condition where 14-period RSI is strictly below 30',
        tree: {
          operator: 'AND',
          conditions: [
            {
              id: 'c1',
              indicator: 'RSI',
              field: 'rsi',
              comparator: '<',
              thresholdType: 'VALUE',
              thresholdValue: 30,
              description: 'RSI(14) < 30'
            }
          ]
        }
      },
      {
        id: 'RSI_BULLISH_RECOVERY',
        label: 'RSI(14) Crosses Above 50',
        description: 'Historical condition where RSI crosses from bearish half to bullish half',
        tree: {
          operator: 'AND',
          conditions: [
            {
              id: 'c1',
              indicator: 'RSI',
              field: 'rsi',
              comparator: 'CROSSES_ABOVE',
              thresholdType: 'VALUE',
              thresholdValue: 50,
              description: 'RSI(14) crosses above 50'
            }
          ]
        }
      },
      {
        id: 'PRICE_ABOVE_SMA50_BULLISH_VOLUME',
        label: 'Price > SMA50 AND Volume > 1.5x SMA20',
        description: 'Trend alignment combined with unusual trading volume expansion',
        tree: {
          operator: 'AND',
          conditions: [
            {
              id: 'c1',
              indicator: 'CLOSE',
              field: 'close',
              comparator: '>',
              thresholdType: 'INDICATOR_FIELD',
              targetIndicator: 'SMA50',
              targetField: 'sma',
              multiplier: 1.0,
              description: 'Close > SMA(50)'
            },
            {
              id: 'c2',
              indicator: 'VOLUME',
              field: 'volume',
              comparator: '>',
              thresholdType: 'INDICATOR_FIELD',
              targetIndicator: 'VOLUMESMA20',
              targetField: 'value',
              multiplier: 1.5,
              description: 'Volume > 1.5 * VolumeSMA(20)'
            }
          ]
        }
      },
      {
        id: 'GOLDEN_CROSS_SMA20_SMA50',
        label: 'SMA(20) Crosses Above SMA(50)',
        description: 'Medium-term moving average bullish crossover',
        tree: {
          operator: 'AND',
          conditions: [
            {
              id: 'c1',
              indicator: 'SMA20',
              field: 'sma',
              comparator: 'CROSSES_ABOVE',
              thresholdType: 'INDICATOR_FIELD',
              targetIndicator: 'SMA50',
              targetField: 'sma',
              multiplier: 1.0,
              description: 'SMA(20) crosses above SMA(50)'
            }
          ]
        }
      },
      {
        id: 'MACD_BULLISH_CROSSOVER',
        label: 'MACD Line Crosses Above Signal Line',
        description: 'MACD momentum crossover event',
        tree: {
          operator: 'AND',
          conditions: [
            {
              id: 'c1',
              indicator: 'MACD',
              field: 'macd',
              comparator: 'CROSSES_ABOVE',
              thresholdType: 'INDICATOR_FIELD',
              targetIndicator: 'MACD',
              targetField: 'signal',
              multiplier: 1.0,
              description: 'MACD line crosses above Signal line'
            }
          ]
        }
      },
      {
        id: 'MACD_HISTOGRAM_EXPANDING',
        label: 'MACD Histogram Increasing (> 0)',
        description: 'Positive and accelerating MACD momentum',
        tree: {
          operator: 'AND',
          conditions: [
            {
              id: 'c1',
              indicator: 'MACD',
              field: 'histogram',
              comparator: '>',
              thresholdType: 'VALUE',
              thresholdValue: 0,
              description: 'MACD Histogram > 0'
            },
            {
              id: 'c2',
              indicator: 'MACD',
              field: 'histogram',
              comparator: 'INCREASING',
              thresholdType: 'VALUE',
              description: 'MACD Histogram is increasing'
            }
          ]
        }
      },
      {
        id: 'BOLLINGER_UPPER_BREAKOUT',
        label: 'Bollinger Band Upper Breakout',
        description: 'Price breaks above 20-period upper Bollinger Band',
        tree: {
          operator: 'AND',
          conditions: [
            {
              id: 'c1',
              indicator: 'CLOSE',
              field: 'close',
              comparator: 'CROSSES_ABOVE',
              thresholdType: 'INDICATOR_FIELD',
              targetIndicator: 'BOLLINGER',
              targetField: 'upper',
              multiplier: 1.0,
              description: 'Close crosses above Bollinger Upper Band'
            }
          ]
        }
      },
      {
        id: 'ADX_STRONG_TREND_MOMENTUM',
        label: 'ADX > 25 AND Price > EMA20',
        description: 'Strong directional trend regime with short-term moving average support',
        tree: {
          operator: 'AND',
          conditions: [
            {
              id: 'c1',
              indicator: 'ADX',
              field: 'adx',
              comparator: '>',
              thresholdType: 'VALUE',
              thresholdValue: 25,
              description: 'ADX(14) > 25'
            },
            {
              id: 'c2',
              indicator: 'CLOSE',
              field: 'close',
              comparator: '>',
              thresholdType: 'INDICATOR_FIELD',
              targetIndicator: 'EMA20',
              targetField: 'ema',
              multiplier: 1.0,
              description: 'Close > EMA(20)'
            }
          ]
        }
      }
    ];
  }
}
