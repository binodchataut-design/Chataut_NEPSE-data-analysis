/**
 * Central Technical Indicator Registry
 * Single authoritative directory and dispatcher for all implemented indicators.
 * Provides metadata discovery, parameter schemas, warmup tracking, versioning,
 * and unified execution without hardcoded UI logic.
 */

import {
  IndicatorCategory,
  IndicatorDefinition,
  IndicatorResult,
  IndicatorSeriesResult,
  OHLCVBar,
  Timeframe
} from '../../types/technicalIndicators';

// Engines
import {
  computeSMA,
  computeEMA,
  computeWMA,
  computeRMA,
  computeSMMA,
  computeHMA,
  computeDEMA,
  computeTEMA,
  computeKAMA,
  computeVWMA
} from './movingAverages';

import {
  computeMACD,
  computeADX,
  computeAroon,
  computeParabolicSAR,
  computeSupertrend,
  computeIchimoku,
  computeTRIX,
  computeVortex,
  computeDPO,
  computeLinearRegression,
  computeMassIndex
} from './trendIndicators';

import {
  computeRSI,
  computeStochastic,
  computeStochRSI,
  computeWilliamsR,
  computeCCI,
  computeROC,
  computeMomentum,
  computeUltimateOscillator,
  computeAwesomeOscillator,
  computePPO,
  computeTSI,
  computeRVI,
  computeFisherTransform,
  computeCMO,
  computeConnorsRSI
} from './momentumIndicators';

import {
  computeATR,
  computeBollingerBands,
  computeKeltnerChannels,
  computeDonchianChannels,
  computeHistoricalVolatility,
  computeChaikinVolatility
} from './volatilityIndicators';

import {
  computeVolumeMA,
  computeOBV,
  computeMFI,
  computeCMF,
  computeAccumulationDistribution,
  computeVolumeOscillator,
  computeForceIndex,
  computeEMV,
  computeNVIandPVI,
  computeVWAP,
  computeAnchoredVWAP
} from './volumeIndicators';

import { analyzePriceStructure } from './priceStructure';
import { calculateSupportResistance } from './supportResistance';
import { calculatePivotPoints } from './pivotPoints';
import { autoCalculateFibonacci } from './fibonacci';
import { detectCandlestickPatterns } from './candlestickPatterns';
import { scanChartPatterns } from './chartPatterns';
import { computeStatisticalFeatures } from './statisticalFeatures';
import { calculateRollingStdDev } from './common';

export class IndicatorRegistry {
  private indicators: Map<string, IndicatorDefinition> = new Map();

  constructor() {
    this.registerAll();
  }

  private register(def: IndicatorDefinition) {
    this.indicators.set(def.id.toUpperCase(), def);
  }

  public get(id: string): IndicatorDefinition | undefined {
    return this.indicators.get(id.toUpperCase());
  }

  public getAll(): IndicatorDefinition[] {
    return Array.from(this.indicators.values());
  }

  public getByCategory(category: IndicatorCategory): IndicatorDefinition[] {
    return this.getAll().filter(i => i.category === category);
  }

  public getCategories(): IndicatorCategory[] {
    return [
      'Moving Averages',
      'Trend',
      'Momentum',
      'Oscillators',
      'Volatility',
      'Volume',
      'Price Structure',
      'Support/Resistance',
      'Candlestick Patterns',
      'Chart Patterns',
      'Statistical/Quantitative',
      'Market Breadth'
    ];
  }

  public search(query: string): IndicatorDefinition[] {
    const q = query.toLowerCase();
    return this.getAll().filter(
      i =>
        i.id.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
    );
  }

  /**
   * Universal Dispatcher: executes any indicator by ID over OHLCV bars
   */
  public execute(
    indicatorId: string,
    bars: OHLCVBar[],
    params: Record<string, any> = {},
    symbol = 'NEPSE',
    timeframe: Timeframe = 'DAILY'
  ): IndicatorSeriesResult {
    const def = this.get(indicatorId);
    if (!def) {
      throw new Error(`Indicator with ID '${indicatorId}' not found in registry.`);
    }

    const mergedParams: Record<string, any> = {};
    for (const [key, paramDef] of Object.entries(def.parameters)) {
      mergedParams[key] = params[key] !== undefined ? params[key] : paramDef.default;
    }

    const warmup = typeof def.warmupPeriod === 'function' ? def.warmupPeriod(mergedParams) : def.warmupPeriod;
    const len = bars.length;
    const series: IndicatorResult[] = [];

    // Helper to produce standard normalized series
    const makeScalarSeries = (values: (number | null)[], fieldKey = 'value') => {
      for (let i = 0; i < len; i++) {
        const isReady = i >= warmup - 1 && values[i] !== null;
        series.push({
          symbol,
          timeframe,
          timestamp: bars[i].date,
          indicatorId: def.id,
          parameters: mergedParams,
          values: { [fieldKey]: values[i] },
          isReady,
          warmupRemaining: Math.max(0, warmup - 1 - i),
          calculationVersion: def.calculationVersion
        });
      }
    };

    switch (def.id) {
      // 1. Moving Averages
      case 'SMA':
        makeScalarSeries(computeSMA(bars, mergedParams.period), 'sma');
        break;
      case 'EMA':
        makeScalarSeries(computeEMA(bars, mergedParams.period), 'ema');
        break;
      case 'WMA':
        makeScalarSeries(computeWMA(bars, mergedParams.period), 'wma');
        break;
      case 'RMA':
        makeScalarSeries(computeRMA(bars, mergedParams.period), 'rma');
        break;
      case 'SMMA':
        makeScalarSeries(computeSMMA(bars, mergedParams.period), 'smma');
        break;
      case 'HMA':
        makeScalarSeries(computeHMA(bars, mergedParams.period), 'hma');
        break;
      case 'DEMA':
        makeScalarSeries(computeDEMA(bars, mergedParams.period), 'dema');
        break;
      case 'TEMA':
        makeScalarSeries(computeTEMA(bars, mergedParams.period), 'tema');
        break;
      case 'KAMA':
        makeScalarSeries(computeKAMA(bars, mergedParams.period, mergedParams.fastPeriod, mergedParams.slowPeriod), 'kama');
        break;
      case 'VWMA':
        makeScalarSeries(computeVWMA(bars, mergedParams.period), 'vwma');
        break;

      // 2. Trend Indicators
      case 'MACD': {
        const out = computeMACD(bars, mergedParams.fastPeriod, mergedParams.slowPeriod, mergedParams.signalPeriod);
        for (let i = 0; i < len; i++) {
          const isReady = i >= warmup - 1 && out[i].signal !== null;
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { macd: out[i].macd, signal: out[i].signal, histogram: out[i].histogram },
            isReady,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'ADX': {
        const out = computeADX(bars, mergedParams.period);
        for (let i = 0; i < len; i++) {
          const isReady = i >= warmup - 1 && out[i].adx !== null;
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { adx: out[i].adx, plusDI: out[i].plusDI, minusDI: out[i].minusDI },
            isReady,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'AROON': {
        const out = computeAroon(bars, mergedParams.period);
        for (let i = 0; i < len; i++) {
          const isReady = i >= warmup - 1 && out[i].aroonUp !== null;
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { aroonUp: out[i].aroonUp, aroonDown: out[i].aroonDown, aroonOscillator: out[i].aroonOscillator },
            isReady,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'PARABOLIC_SAR': {
        const out = computeParabolicSAR(bars, mergedParams.step, mergedParams.maxStep);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { sar: out[i].sar, isLong: out[i].isLong },
            isReady: out[i].sar !== null,
            warmupRemaining: 0,
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'SUPERTREND': {
        const out = computeSupertrend(bars, mergedParams.period, mergedParams.multiplier);
        for (let i = 0; i < len; i++) {
          const isReady = i >= warmup - 1 && out[i].supertrend !== null;
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: {
              supertrend: out[i].supertrend,
              direction: out[i].direction,
              upperBand: out[i].upperBand,
              lowerBand: out[i].lowerBand
            },
            isReady,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'ICHIMOKU': {
        const out = computeIchimoku(bars, mergedParams.tenkanPeriod, mergedParams.kijunPeriod, mergedParams.senkouBPeriod);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: {
              tenkan: out[i].tenkan,
              kijun: out[i].kijun,
              senkouA: out[i].senkouA,
              senkouB: out[i].senkouB,
              chikou: out[i].chikou
            },
            isReady: i >= warmup - 1,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'TRIX':
        makeScalarSeries(computeTRIX(bars, mergedParams.period), 'trix');
        break;
      case 'VORTEX': {
        const out = computeVortex(bars, mergedParams.period);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { plusVI: out[i].plusVI, minusVI: out[i].minusVI },
            isReady: i >= warmup - 1,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'DPO':
        makeScalarSeries(computeDPO(bars, mergedParams.period), 'dpo');
        break;
      case 'LINEAR_REGRESSION': {
        const out = computeLinearRegression(bars, mergedParams.period);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: {
              regressionLine: out[i].regressionLine,
              slope: out[i].slope,
              intercept: out[i].intercept,
              rSquared: out[i].rSquared
            },
            isReady: i >= warmup - 1,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'MASS_INDEX':
        makeScalarSeries(computeMassIndex(bars, mergedParams.emaPeriod, mergedParams.sumPeriod), 'massIndex');
        break;

      // 3. Momentum & Oscillators
      case 'RSI':
        makeScalarSeries(computeRSI(bars, mergedParams.period), 'rsi');
        break;
      case 'STOCHASTIC': {
        const out = computeStochastic(bars, mergedParams.kPeriod, mergedParams.kSmoothing, mergedParams.dPeriod);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { k: out[i].k, d: out[i].d },
            isReady: out[i].k !== null,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'STOCH_RSI': {
        const out = computeStochRSI(bars, mergedParams.rsiPeriod, mergedParams.stochPeriod, mergedParams.kPeriod, mergedParams.dPeriod);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { k: out[i].k, d: out[i].d },
            isReady: out[i].k !== null,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'WILLIAMS_R':
        makeScalarSeries(computeWilliamsR(bars, mergedParams.period), 'williamsR');
        break;
      case 'CCI':
        makeScalarSeries(computeCCI(bars, mergedParams.period), 'cci');
        break;
      case 'ROC':
        makeScalarSeries(computeROC(bars, mergedParams.period), 'roc');
        break;
      case 'MOMENTUM':
        makeScalarSeries(computeMomentum(bars, mergedParams.period), 'momentum');
        break;
      case 'ULTIMATE_OSC':
        makeScalarSeries(computeUltimateOscillator(bars, mergedParams.period1, mergedParams.period2, mergedParams.period3), 'ultimateOsc');
        break;
      case 'AWESOME_OSC':
        makeScalarSeries(computeAwesomeOscillator(bars), 'ao');
        break;
      case 'PPO': {
        const out = computePPO(bars, mergedParams.fastPeriod, mergedParams.slowPeriod, mergedParams.signalPeriod);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { ppo: out[i].ppo, signal: out[i].signal, histogram: out[i].histogram },
            isReady: out[i].signal !== null,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'TSI': {
        const out = computeTSI(bars, mergedParams.longPeriod, mergedParams.shortPeriod, mergedParams.signalPeriod);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { tsi: out[i].tsi, signal: out[i].signal },
            isReady: out[i].tsi !== null,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'RVI': {
        const out = computeRVI(bars, mergedParams.period);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { rvi: out[i].rvi, signal: out[i].signal },
            isReady: out[i].rvi !== null,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'FISHER': {
        const out = computeFisherTransform(bars, mergedParams.period);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { fisher: out[i].fisher, trigger: out[i].trigger },
            isReady: out[i].fisher !== null,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'CMO':
        makeScalarSeries(computeCMO(bars, mergedParams.period), 'cmo');
        break;
      case 'CONNORS_RSI':
        makeScalarSeries(computeConnorsRSI(bars, mergedParams.rsiPeriod, mergedParams.streakPeriod, mergedParams.rankPeriod), 'connorsRsi');
        break;

      // 4. Volatility Indicators
      case 'ATR': {
        const out = computeATR(bars, mergedParams.period);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { tr: out[i].tr, atr: out[i].atr, atrPercent: out[i].atrPercent },
            isReady: out[i].atr !== null,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'BOLLINGER': {
        const out = computeBollingerBands(bars, mergedParams.period, mergedParams.stdDevMultiplier);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: {
              middle: out[i].middle,
              upper: out[i].upper,
              lower: out[i].lower,
              bandwidth: out[i].bandwidth,
              percentB: out[i].percentB,
              stdDev: out[i].stdDev
            },
            isReady: out[i].middle !== null,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'KELTNER': {
        const out = computeKeltnerChannels(bars, mergedParams.emaPeriod, mergedParams.atrPeriod, mergedParams.multiplier);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { middle: out[i].middle, upper: out[i].upper, lower: out[i].lower },
            isReady: out[i].middle !== null,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'DONCHIAN': {
        const out = computeDonchianChannels(bars, mergedParams.period);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { upper: out[i].upper, middle: out[i].middle, lower: out[i].lower },
            isReady: out[i].middle !== null,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'HISTORICAL_VOL':
        makeScalarSeries(computeHistoricalVolatility(bars, mergedParams.period, mergedParams.annualTradingDays), 'historicalVol');
        break;
      case 'CHAIKIN_VOL':
        makeScalarSeries(computeChaikinVolatility(bars, mergedParams.emaPeriod, mergedParams.rocPeriod), 'chaikinVol');
        break;

      // 5. Volume Indicators
      case 'VOLUME_MA': {
        const out = computeVolumeMA(bars, mergedParams.period);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { volumeSMA: out.volumeSMA[i], volumeEMA: out.volumeEMA[i] },
            isReady: out.volumeSMA[i] !== null,
            warmupRemaining: Math.max(0, warmup - 1 - i),
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'OBV': {
        const obv = computeOBV(bars);
        makeScalarSeries(obv, 'obv');
        break;
      }
      case 'MFI':
        makeScalarSeries(computeMFI(bars, mergedParams.period), 'mfi');
        break;
      case 'CMF':
        makeScalarSeries(computeCMF(bars, mergedParams.period), 'cmf');
        break;
      case 'AD_LINE': {
        const ad = computeAccumulationDistribution(bars);
        makeScalarSeries(ad, 'ad');
        break;
      }
      case 'VOLUME_OSC':
        makeScalarSeries(computeVolumeOscillator(bars, mergedParams.shortPeriod, mergedParams.longPeriod), 'volumeOsc');
        break;
      case 'FORCE_INDEX':
        makeScalarSeries(computeForceIndex(bars, mergedParams.period), 'forceIndex');
        break;
      case 'EMV':
        makeScalarSeries(computeEMV(bars, mergedParams.period, mergedParams.divisor), 'emv');
        break;
      case 'NVI_PVI': {
        const out = computeNVIandPVI(bars);
        for (let i = 0; i < len; i++) {
          series.push({
            symbol,
            timeframe,
            timestamp: bars[i].date,
            indicatorId: def.id,
            parameters: mergedParams,
            values: { nvi: out.nvi[i], pvi: out.pvi[i] },
            isReady: true,
            warmupRemaining: 0,
            calculationVersion: def.calculationVersion
          });
        }
        break;
      }
      case 'VWAP': {
        const vwap = computeVWAP(bars);
        makeScalarSeries(vwap, 'vwap');
        break;
      }
      case 'ANCHORED_VWAP':
        makeScalarSeries(computeAnchoredVWAP(bars, mergedParams.anchorDate || bars[0]?.date || '2026-01-01'), 'anchoredVwap');
        break;

      default:
        throw new Error(`Indicator calculation for '${def.id}' not yet implemented in dispatcher.`);
    }

    return {
      symbol,
      timeframe,
      indicatorId: def.id,
      parameters: mergedParams,
      calculationVersion: def.calculationVersion,
      series
    };
  }

  /**
   * Helper queries for Price Structure, Support & Resistance, Candlestick Patterns, and Quant features
   */
  public getPriceStructure(bars: OHLCVBar[], left = 5, right = 5) {
    return analyzePriceStructure(bars, left, right);
  }

  public getSupportResistance(bars: OHLCVBar[], tolerance = 1.5) {
    return calculateSupportResistance(bars, tolerance);
  }

  public getPivotPoints(bar: OHLCVBar, system = 'STANDARD' as const) {
    return calculatePivotPoints(bar, system);
  }

  public getFibonacci(bars: OHLCVBar[]) {
    return autoCalculateFibonacci(bars);
  }

  public getCandlestickPatterns(bars: OHLCVBar[]) {
    return detectCandlestickPatterns(bars);
  }

  public getChartPatterns(bars: OHLCVBar[]) {
    return scanChartPatterns(bars);
  }

  public getStatisticalFeatures(bars: OHLCVBar[], window = 20) {
    return computeStatisticalFeatures(bars, window);
  }

  private registerAll() {
    // ----------------------------------------------------
    // Category 1: Moving Averages
    // ----------------------------------------------------
    this.register({
      id: 'SMA',
      name: 'Simple Moving Average',
      category: 'Moving Averages',
      description: 'Arithmetic mean of closing prices over a sliding window.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 2, max: 500, description: 'Calculation window' }
      },
      outputFields: [{ key: 'sma', label: 'SMA', type: 'number', format: 'price' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Standard sliding window mean.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'EMA',
      name: 'Exponential Moving Average',
      category: 'Moving Averages',
      description: 'Weighted moving average giving exponentially higher weight to recent prices.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 2, max: 500, description: 'Decay period' }
      },
      outputFields: [{ key: 'ema', label: 'EMA', type: 'number', format: 'price' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Multiplier k = 2 / (period + 1), seeded with initial SMA.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'WMA',
      name: 'Weighted Moving Average',
      category: 'Moving Averages',
      description: 'Linear weighting from 1 to N over the lookback period.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 2, max: 200, description: 'Period' }
      },
      outputFields: [{ key: 'wma', label: 'WMA', type: 'number', format: 'price' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Weight factor w_j = j + 1.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'RMA',
      name: "Wilder's Smoothing (RMA)",
      category: 'Moving Averages',
      description: 'Running Moving Average with alpha = 1 / period.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 14, min: 2, max: 200, description: 'Period' }
      },
      outputFields: [{ key: 'rma', label: 'RMA', type: 'number', format: 'price' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Used extensively in RSI, ATR, and ADX.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'SMMA',
      name: 'Smoothed Moving Average',
      category: 'Moving Averages',
      description: 'Equivalent to Wilder RMA, offering long memory smoothing.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 2, max: 200, description: 'Period' }
      },
      outputFields: [{ key: 'smma', label: 'SMMA', type: 'number', format: 'price' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'SMMA[i] = (prev * (p-1) + price) / p.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'HMA',
      name: 'Hull Moving Average',
      category: 'Moving Averages',
      description: 'Reduces lag significantly while maintaining smoothness.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 4, max: 200, description: 'Period' }
      },
      outputFields: [{ key: 'hma', label: 'HMA', type: 'number', format: 'price' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period + Math.round(Math.sqrt(p.period)),
      calculationVersion: 'v1.0',
      sourceNotes: 'Alan Hull HMA algorithm.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'DEMA',
      name: 'Double Exponential Moving Average',
      category: 'Moving Averages',
      description: 'Double EMA compensating for inherent lag: 2*EMA - EMA(EMA).',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 2, max: 200, description: 'Period' }
      },
      outputFields: [{ key: 'dema', label: 'DEMA', type: 'number', format: 'price' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period * 2,
      calculationVersion: 'v1.0',
      sourceNotes: 'Patrick Mulloy DEMA.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'TEMA',
      name: 'Triple Exponential Moving Average',
      category: 'Moving Averages',
      description: 'Triple EMA removing first, second, and third degree lag.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 2, max: 200, description: 'Period' }
      },
      outputFields: [{ key: 'tema', label: 'TEMA', type: 'number', format: 'price' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period * 3,
      calculationVersion: 'v1.0',
      sourceNotes: 'Patrick Mulloy TEMA.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'KAMA',
      name: 'Kaufman Adaptive Moving Average',
      category: 'Moving Averages',
      description: 'Dynamically adapts smoothing speed based on market efficiency ratio.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Efficiency Period', type: 'number', default: 10, min: 2, max: 100, description: 'ER Window' },
        fastPeriod: { name: 'Fast EMA', type: 'number', default: 2, min: 1, max: 20, description: 'Fast SC' },
        slowPeriod: { name: 'Slow EMA', type: 'number', default: 30, min: 10, max: 100, description: 'Slow SC' }
      },
      outputFields: [{ key: 'kama', label: 'KAMA', type: 'number', format: 'price' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period + 1,
      calculationVersion: 'v1.0',
      sourceNotes: 'Perry Kaufman quantitative adaptive smoothing.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'VWMA',
      name: 'Volume Weighted Moving Average',
      category: 'Moving Averages',
      description: 'Weights closing prices by volume within the sliding window.',
      inputs: ['close', 'volume'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 2, max: 200, description: 'Period' }
      },
      outputFields: [{ key: 'vwma', label: 'VWMA', type: 'number', format: 'price' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'sum(Close * Vol) / sum(Vol).',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    // ----------------------------------------------------
    // Category 2: Trend Indicators
    // ----------------------------------------------------
    this.register({
      id: 'MACD',
      name: 'Moving Average Convergence Divergence',
      category: 'Trend',
      description: 'Trend-following momentum indicator displaying relationship between two EMAs.',
      inputs: ['close'],
      parameters: {
        fastPeriod: { name: 'Fast Period', type: 'number', default: 12, min: 2, max: 50, description: 'Fast EMA' },
        slowPeriod: { name: 'Slow Period', type: 'number', default: 26, min: 5, max: 100, description: 'Slow EMA' },
        signalPeriod: { name: 'Signal Period', type: 'number', default: 9, min: 2, max: 50, description: 'Signal EMA' }
      },
      outputFields: [
        { key: 'macd', label: 'MACD Line', type: 'number', format: 'decimal' },
        { key: 'signal', label: 'Signal Line', type: 'number', format: 'decimal' },
        { key: 'histogram', label: 'Histogram', type: 'number', format: 'decimal' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.slowPeriod + p.signalPeriod,
      calculationVersion: 'v1.0',
      sourceNotes: 'Gerald Appel standard MACD.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'ADX',
      name: 'Average Directional Index (ADX / DMI)',
      category: 'Trend',
      description: 'Quantifies trend strength regardless of trend direction.',
      inputs: ['high', 'low', 'close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 14, min: 3, max: 50, description: 'Lookback' }
      },
      outputFields: [
        { key: 'adx', label: 'ADX', type: 'number', format: 'decimal' },
        { key: 'plusDI', label: '+DI', type: 'number', format: 'decimal' },
        { key: 'minusDI', label: '-DI', type: 'number', format: 'decimal' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period * 2,
      calculationVersion: 'v1.0',
      sourceNotes: 'J. Welles Wilder directional movement index.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'AROON',
      name: 'Aroon & Aroon Oscillator',
      category: 'Trend',
      description: 'Measures time elapsed between highs and lows to detect trend initiation and strength.',
      inputs: ['high', 'low'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 25, min: 5, max: 100, description: 'Lookback' }
      },
      outputFields: [
        { key: 'aroonUp', label: 'Aroon Up', type: 'number', format: 'decimal' },
        { key: 'aroonDown', label: 'Aroon Down', type: 'number', format: 'decimal' },
        { key: 'aroonOscillator', label: 'Oscillator', type: 'number', format: 'decimal' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Tushar Chande Aroon system.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'PARABOLIC_SAR',
      name: 'Parabolic Stop and Reverse',
      category: 'Trend',
      description: 'Trailing stop price overlay based on accelerating trend continuation.',
      inputs: ['high', 'low', 'close'],
      parameters: {
        step: { name: 'Acceleration Step', type: 'number', default: 0.02, min: 0.005, max: 0.1, description: 'AF Increment' },
        maxStep: { name: 'Max Acceleration', type: 'number', default: 0.2, min: 0.05, max: 0.5, description: 'AF Cap' }
      },
      outputFields: [
        { key: 'sar', label: 'SAR Price', type: 'number', format: 'price' },
        { key: 'isLong', label: 'Long State', type: 'boolean' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: 2,
      calculationVersion: 'v1.0',
      sourceNotes: 'J. Welles Wilder Parabolic SAR.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'SUPERTREND',
      name: 'Supertrend',
      category: 'Trend',
      description: 'Volatility-adjusted trailing trend stop based on ATR multiplier.',
      inputs: ['high', 'low', 'close'],
      parameters: {
        period: { name: 'ATR Period', type: 'number', default: 10, min: 2, max: 50, description: 'ATR Lookback' },
        multiplier: { name: 'Multiplier', type: 'number', default: 3.0, min: 0.5, max: 10, description: 'ATR Multiplier' }
      },
      outputFields: [
        { key: 'supertrend', label: 'Supertrend', type: 'number', format: 'price' },
        { key: 'direction', label: 'Trend Direction', type: 'string', format: 'status' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Olivier Seban Supertrend implementation.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'ICHIMOKU',
      name: 'Ichimoku Kinko Hyo',
      category: 'Trend',
      description: 'Comprehensive equilibrium chart displaying support, resistance, and momentum.',
      inputs: ['high', 'low', 'close'],
      parameters: {
        tenkanPeriod: { name: 'Tenkan Period', type: 'number', default: 9, min: 3, max: 30, description: 'Conversion line' },
        kijunPeriod: { name: 'Kijun Period', type: 'number', default: 26, min: 10, max: 60, description: 'Base line' },
        senkouBPeriod: { name: 'Senkou B Period', type: 'number', default: 52, min: 20, max: 120, description: 'Leading span B' }
      },
      outputFields: [
        { key: 'tenkan', label: 'Tenkan-sen', type: 'number', format: 'price' },
        { key: 'kijun', label: 'Kijun-sen', type: 'number', format: 'price' },
        { key: 'senkouA', label: 'Senkou Span A', type: 'number', format: 'price' },
        { key: 'senkouB', label: 'Senkou Span B', type: 'number', format: 'price' },
        { key: 'chikou', label: 'Chikou Span', type: 'number', format: 'price' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.senkouBPeriod,
      calculationVersion: 'v1.0',
      sourceNotes: 'Goichi Hosoda equilibrium chart system.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'TRIX',
      name: 'TRIX',
      category: 'Trend',
      description: 'Triple smoothed exponential moving average 1-bar percent rate of change.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 15, min: 3, max: 50, description: 'Period' }
      },
      outputFields: [{ key: 'trix', label: 'TRIX', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period * 3,
      calculationVersion: 'v1.0',
      sourceNotes: 'Jack Hutson TRIX oscillator.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'VORTEX',
      name: 'Vortex Indicator',
      category: 'Trend',
      description: 'Captures the vortex flow of positive and negative price movement.',
      inputs: ['high', 'low', 'close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 14, min: 3, max: 50, description: 'Lookback' }
      },
      outputFields: [
        { key: 'plusVI', label: '+VI', type: 'number', format: 'decimal' },
        { key: 'minusVI', label: '-VI', type: 'number', format: 'decimal' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period + 1,
      calculationVersion: 'v1.0',
      sourceNotes: 'Etienne Botes & Douglas Siepman.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'DPO',
      name: 'Detrended Price Oscillator',
      category: 'Trend',
      description: 'Removes longer-term trend by comparing close to a displaced moving average.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 5, max: 100, description: 'SMA Period' }
      },
      outputFields: [{ key: 'dpo', label: 'DPO', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Detrending cyclical filter.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'LINEAR_REGRESSION',
      name: 'Linear Regression & Slope',
      category: 'Trend',
      description: 'Best-fit linear line over sliding window, with slope and R-squared fit.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 14, min: 3, max: 100, description: 'Window' }
      },
      outputFields: [
        { key: 'regressionLine', label: 'Endpoint', type: 'number', format: 'price' },
        { key: 'slope', label: 'Slope', type: 'number', format: 'decimal' },
        { key: 'rSquared', label: 'R²', type: 'number', format: 'decimal' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Least-squares linear regression.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'MASS_INDEX',
      name: 'Mass Index',
      category: 'Trend',
      description: 'Examines narrowing and widening between high and low prices to detect reversals.',
      inputs: ['high', 'low'],
      parameters: {
        emaPeriod: { name: 'EMA Period', type: 'number', default: 9, min: 2, max: 20, description: 'Smoothing' },
        sumPeriod: { name: 'Sum Period', type: 'number', default: 25, min: 10, max: 50, description: 'Sum Window' }
      },
      outputFields: [{ key: 'massIndex', label: 'Mass Index', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.emaPeriod * 2 + p.sumPeriod,
      calculationVersion: 'v1.0',
      sourceNotes: 'Donald Dorsey Mass Index.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    // ----------------------------------------------------
    // Category 3: Momentum & Oscillators
    // ----------------------------------------------------
    this.register({
      id: 'RSI',
      name: 'Relative Strength Index',
      category: 'Momentum',
      description: 'Measures the speed and magnitude of directional price momentum on a 0-100 scale.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 14, min: 2, max: 100, description: 'Lookback' }
      },
      outputFields: [{ key: 'rsi', label: 'RSI', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period + 1,
      calculationVersion: 'v1.0',
      sourceNotes: 'J. Welles Wilder standard RSI using RMA smoothing.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'STOCHASTIC',
      name: 'Stochastic Oscillator',
      category: 'Oscillators',
      description: 'Compares a security close to its price range over a given time period.',
      inputs: ['high', 'low', 'close'],
      parameters: {
        kPeriod: { name: '%K Period', type: 'number', default: 14, min: 2, max: 50, description: '%K Lookback' },
        kSmoothing: { name: '%K Smoothing', type: 'number', default: 3, min: 1, max: 10, description: '%K SMA' },
        dPeriod: { name: '%D Period', type: 'number', default: 3, min: 1, max: 10, description: '%D SMA' }
      },
      outputFields: [
        { key: 'k', label: '%K', type: 'number', format: 'decimal' },
        { key: 'd', label: '%D', type: 'number', format: 'decimal' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.kPeriod + p.kSmoothing + p.dPeriod,
      calculationVersion: 'v1.0',
      sourceNotes: 'George Lane Stochastic Oscillator.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'STOCH_RSI',
      name: 'Stochastic RSI',
      category: 'Oscillators',
      description: 'Applies the Stochastic formula to RSI values rather than standard price data.',
      inputs: ['close'],
      parameters: {
        rsiPeriod: { name: 'RSI Period', type: 'number', default: 14, min: 2, max: 50, description: 'RSI Period' },
        stochPeriod: { name: 'Stoch Period', type: 'number', default: 14, min: 2, max: 50, description: 'Stoch Period' },
        kPeriod: { name: '%K Smoothing', type: 'number', default: 3, min: 1, max: 10, description: '%K SMA' },
        dPeriod: { name: '%D Period', type: 'number', default: 3, min: 1, max: 10, description: '%D SMA' }
      },
      outputFields: [
        { key: 'k', label: 'StochRSI %K', type: 'number', format: 'decimal' },
        { key: 'd', label: 'StochRSI %D', type: 'number', format: 'decimal' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.rsiPeriod + p.stochPeriod + p.kPeriod + p.dPeriod,
      calculationVersion: 'v1.0',
      sourceNotes: 'Tushar Chande and Stanley Kroll StochRSI.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'WILLIAMS_R',
      name: 'Williams %R',
      category: 'Oscillators',
      description: 'Momentum indicator reflecting the level of the close relative to highest high (-100 to 0).',
      inputs: ['high', 'low', 'close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 14, min: 2, max: 100, description: 'Lookback' }
      },
      outputFields: [{ key: 'williamsR', label: '%R', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Larry Williams %R indicator.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'CCI',
      name: 'Commodity Channel Index',
      category: 'Oscillators',
      description: 'Evaluates current price level relative to an average price level over a specified period.',
      inputs: ['high', 'low', 'close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 2, max: 100, description: 'Lookback' }
      },
      outputFields: [{ key: 'cci', label: 'CCI', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Donald Lambert CCI with 0.015 mean deviation constant.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'ROC',
      name: 'Rate of Change',
      category: 'Momentum',
      description: 'Percentage difference between current close and close N bars ago.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 12, min: 1, max: 100, description: 'Lookback' }
      },
      outputFields: [{ key: 'roc', label: 'ROC (%)', type: 'number', format: 'percent' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Standard percentage change.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'MOMENTUM',
      name: 'Price Momentum',
      category: 'Momentum',
      description: 'Absolute points difference between current close and close N periods ago.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 10, min: 1, max: 100, description: 'Lookback' }
      },
      outputFields: [{ key: 'momentum', label: 'Momentum', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Absolute difference price metric.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'ULTIMATE_OSC',
      name: 'Ultimate Oscillator',
      category: 'Oscillators',
      description: 'Multi-timeframe oscillator incorporating 7, 14, and 28-period buying pressures.',
      inputs: ['high', 'low', 'close'],
      parameters: {
        period1: { name: 'Short Period', type: 'number', default: 7, min: 2, max: 20, description: 'Short' },
        period2: { name: 'Medium Period', type: 'number', default: 14, min: 5, max: 40, description: 'Medium' },
        period3: { name: 'Long Period', type: 'number', default: 28, min: 10, max: 80, description: 'Long' }
      },
      outputFields: [{ key: 'ultimateOsc', label: 'Ultimate Osc', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period3,
      calculationVersion: 'v1.0',
      sourceNotes: 'Larry Williams Ultimate Oscillator.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'AWESOME_OSC',
      name: 'Awesome Oscillator (AO)',
      category: 'Oscillators',
      description: 'Difference between a 5-period and 34-period simple moving average of median prices.',
      inputs: ['high', 'low'],
      parameters: {},
      outputFields: [{ key: 'ao', label: 'AO', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: 34,
      calculationVersion: 'v1.0',
      sourceNotes: 'Bill Williams Awesome Oscillator.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'PPO',
      name: 'Percentage Price Oscillator',
      category: 'Oscillators',
      description: 'Percentage-normalized MACD oscillator suitable for cross-asset comparison.',
      inputs: ['close'],
      parameters: {
        fastPeriod: { name: 'Fast Period', type: 'number', default: 12, min: 2, max: 50, description: 'Fast' },
        slowPeriod: { name: 'Slow Period', type: 'number', default: 26, min: 5, max: 100, description: 'Slow' },
        signalPeriod: { name: 'Signal Period', type: 'number', default: 9, min: 2, max: 50, description: 'Signal' }
      },
      outputFields: [
        { key: 'ppo', label: 'PPO (%)', type: 'number', format: 'decimal' },
        { key: 'signal', label: 'Signal', type: 'number', format: 'decimal' },
        { key: 'histogram', label: 'Histogram', type: 'number', format: 'decimal' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.slowPeriod + p.signalPeriod,
      calculationVersion: 'v1.0',
      sourceNotes: 'Normalized percentage MACD.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'TSI',
      name: 'True Strength Index',
      category: 'Oscillators',
      description: 'Double-smoothed momentum indicator isolating primary cyclical trends.',
      inputs: ['close'],
      parameters: {
        longPeriod: { name: 'Long Period', type: 'number', default: 25, min: 5, max: 50, description: 'First EMA' },
        shortPeriod: { name: 'Short Period', type: 'number', default: 13, min: 2, max: 30, description: 'Second EMA' },
        signalPeriod: { name: 'Signal Period', type: 'number', default: 7, min: 2, max: 20, description: 'Signal EMA' }
      },
      outputFields: [
        { key: 'tsi', label: 'TSI', type: 'number', format: 'decimal' },
        { key: 'signal', label: 'Signal', type: 'number', format: 'decimal' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.longPeriod + p.shortPeriod + p.signalPeriod,
      calculationVersion: 'v1.0',
      sourceNotes: 'William Blau True Strength Index.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'RVI',
      name: 'Relative Vigor Index',
      category: 'Oscillators',
      description: 'Measures conviction of recent price moves based on closing price location.',
      inputs: ['open', 'high', 'low', 'close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 10, min: 3, max: 50, description: 'Smoothing' }
      },
      outputFields: [
        { key: 'rvi', label: 'RVI', type: 'number', format: 'decimal' },
        { key: 'signal', label: 'Signal', type: 'number', format: 'decimal' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period + 6,
      calculationVersion: 'v1.0',
      sourceNotes: 'John Ehlers Relative Vigor Index.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'FISHER',
      name: 'Fisher Transform',
      category: 'Oscillators',
      description: 'Transforms prices into Gaussian normal distribution with sharp inflection peaks.',
      inputs: ['high', 'low'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 9, min: 3, max: 50, description: 'Lookback' }
      },
      outputFields: [
        { key: 'fisher', label: 'Fisher', type: 'number', format: 'decimal' },
        { key: 'trigger', label: 'Trigger', type: 'number', format: 'decimal' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'John Ehlers Fisher Transform algorithm.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'CMO',
      name: 'Chande Momentum Oscillator',
      category: 'Momentum',
      description: 'Calculates momentum on both up and down days, bounded between -100 and +100.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 14, min: 2, max: 50, description: 'Lookback' }
      },
      outputFields: [{ key: 'cmo', label: 'CMO', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Tushar Chande Momentum Oscillator.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'CONNORS_RSI',
      name: 'Connors RSI',
      category: 'Momentum',
      description: 'Composite momentum oscillator combining 3-period RSI, streak length, and ROC rank.',
      inputs: ['close'],
      parameters: {
        rsiPeriod: { name: 'RSI Period', type: 'number', default: 3, min: 2, max: 10, description: 'RSI' },
        streakPeriod: { name: 'Streak Period', type: 'number', default: 2, min: 2, max: 10, description: 'Streak' },
        rankPeriod: { name: 'Rank Period', type: 'number', default: 100, min: 20, max: 200, description: 'Rank' }
      },
      outputFields: [{ key: 'connorsRsi', label: 'Connors RSI', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.rankPeriod,
      calculationVersion: 'v1.0',
      sourceNotes: 'Larry Connors mean-reversion oscillator.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    // ----------------------------------------------------
    // Category 4: Volatility Indicators
    // ----------------------------------------------------
    this.register({
      id: 'ATR',
      name: 'Average True Range (ATR)',
      category: 'Volatility',
      description: 'Measures historical price volatility across gaps and intraday spreads.',
      inputs: ['high', 'low', 'close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 14, min: 2, max: 50, description: 'Lookback' }
      },
      outputFields: [
        { key: 'tr', label: 'True Range', type: 'number', format: 'decimal' },
        { key: 'atr', label: 'ATR', type: 'number', format: 'price' },
        { key: 'atrPercent', label: 'ATR (%)', type: 'number', format: 'percent' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'J. Welles Wilder standard ATR.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'BOLLINGER',
      name: 'Bollinger Bands',
      category: 'Volatility',
      description: 'Moving average envelope with upper and lower bands scaled by rolling standard deviations.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 3, max: 100, description: 'SMA window' },
        stdDevMultiplier: { name: 'Std Dev Multiplier', type: 'number', default: 2.0, min: 0.5, max: 5, description: 'Multiplier' }
      },
      outputFields: [
        { key: 'middle', label: 'Middle Band', type: 'number', format: 'price' },
        { key: 'upper', label: 'Upper Band', type: 'number', format: 'price' },
        { key: 'lower', label: 'Lower Band', type: 'number', format: 'price' },
        { key: 'bandwidth', label: 'Bandwidth (%)', type: 'number', format: 'percent' },
        { key: 'percentB', label: '%B', type: 'number', format: 'decimal' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'John Bollinger standard formulation.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'KELTNER',
      name: 'Keltner Channels',
      category: 'Volatility',
      description: 'Volatility-based envelope set above and below an EMA using ATR bands.',
      inputs: ['high', 'low', 'close'],
      parameters: {
        emaPeriod: { name: 'EMA Period', type: 'number', default: 20, min: 5, max: 100, description: 'Center EMA' },
        atrPeriod: { name: 'ATR Period', type: 'number', default: 10, min: 3, max: 50, description: 'ATR Lookback' },
        multiplier: { name: 'Multiplier', type: 'number', default: 2.0, min: 0.5, max: 5, description: 'ATR Multiplier' }
      },
      outputFields: [
        { key: 'middle', label: 'Middle (EMA)', type: 'number', format: 'price' },
        { key: 'upper', label: 'Upper Channel', type: 'number', format: 'price' },
        { key: 'lower', label: 'Lower Channel', type: 'number', format: 'price' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => Math.max(p.emaPeriod, p.atrPeriod),
      calculationVersion: 'v1.0',
      sourceNotes: 'Chester Keltner & Linda Raschke channel specification.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'DONCHIAN',
      name: 'Donchian Channels',
      category: 'Volatility',
      description: 'Envelope formed by the highest high and lowest low of the prior N periods.',
      inputs: ['high', 'low'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 2, max: 100, description: 'Lookback' }
      },
      outputFields: [
        { key: 'upper', label: 'Upper Band', type: 'number', format: 'price' },
        { key: 'middle', label: 'Median', type: 'number', format: 'price' },
        { key: 'lower', label: 'Lower Band', type: 'number', format: 'price' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Richard Donchian Turtle trading channel baseline.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'HISTORICAL_VOL',
      name: 'Historical Volatility',
      category: 'Volatility',
      description: 'Annualized standard deviation of daily logarithmic returns.',
      inputs: ['close'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 5, max: 100, description: 'Window' },
        annualTradingDays: { name: 'Annual Days', type: 'number', default: 245, min: 200, max: 365, description: 'NEPSE days' }
      },
      outputFields: [{ key: 'historicalVol', label: 'Hist Vol (%)', type: 'number', format: 'percent' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period + 1,
      calculationVersion: 'v1.0',
      sourceNotes: 'Annualized return dispersion model.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'CHAIKIN_VOL',
      name: 'Chaikin Volatility',
      category: 'Volatility',
      description: 'Measures percentage rate of change in the spread between high and low prices.',
      inputs: ['high', 'low'],
      parameters: {
        emaPeriod: { name: 'EMA Period', type: 'number', default: 10, min: 3, max: 30, description: 'Spread EMA' },
        rocPeriod: { name: 'ROC Period', type: 'number', default: 10, min: 3, max: 30, description: 'Rate of Change' }
      },
      outputFields: [{ key: 'chaikinVol', label: 'Chaikin Vol (%)', type: 'number', format: 'percent' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.emaPeriod + p.rocPeriod,
      calculationVersion: 'v1.0',
      sourceNotes: 'Marc Chaikin volatility index.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    // ----------------------------------------------------
    // Category 5: Volume Indicators
    // ----------------------------------------------------
    this.register({
      id: 'VOLUME_MA',
      name: 'Volume Moving Average (SMA/EMA)',
      category: 'Volume',
      description: 'Moving averages applied directly to trading volume.',
      inputs: ['volume'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 2, max: 100, description: 'Period' }
      },
      outputFields: [
        { key: 'volumeSMA', label: 'Vol SMA', type: 'number', format: 'integer' },
        { key: 'volumeEMA', label: 'Vol EMA', type: 'number', format: 'integer' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Standard volume smoothing.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'OBV',
      name: 'On-Balance Volume',
      category: 'Volume',
      description: 'Cumulative total volume added on up days and subtracted on down days.',
      inputs: ['close', 'volume'],
      parameters: {},
      outputFields: [{ key: 'obv', label: 'OBV', type: 'number', format: 'integer' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: 1,
      calculationVersion: 'v1.0',
      sourceNotes: 'Joe Granville standard OBV.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'MFI',
      name: 'Money Flow Index',
      category: 'Volume',
      description: 'Volume-weighted RSI measuring buying and selling pressure based on typical price.',
      inputs: ['high', 'low', 'close', 'volume'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 14, min: 2, max: 50, description: 'Period' }
      },
      outputFields: [{ key: 'mfi', label: 'MFI', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period + 1,
      calculationVersion: 'v1.0',
      sourceNotes: 'Gene Quong and Avrum Soudack volume-weighted RSI.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'CMF',
      name: 'Chaikin Money Flow',
      category: 'Volume',
      description: 'Calculates the accumulation and distribution volume over a designated lookback window.',
      inputs: ['high', 'low', 'close', 'volume'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 20, min: 3, max: 100, description: 'Period' }
      },
      outputFields: [{ key: 'cmf', label: 'CMF', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period,
      calculationVersion: 'v1.0',
      sourceNotes: 'Marc Chaikin money flow.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'AD_LINE',
      name: 'Accumulation/Distribution Line',
      category: 'Volume',
      description: 'Cumulative measure of each period volume flow based on closing location value.',
      inputs: ['high', 'low', 'close', 'volume'],
      parameters: {},
      outputFields: [{ key: 'ad', label: 'A/D Line', type: 'number', format: 'integer' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: 1,
      calculationVersion: 'v1.0',
      sourceNotes: 'Marc Chaikin Accumulation/Distribution formulation.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'VOLUME_OSC',
      name: 'Volume Oscillator',
      category: 'Volume',
      description: 'Percentage difference between fast and slow volume exponential moving averages.',
      inputs: ['volume'],
      parameters: {
        shortPeriod: { name: 'Short Period', type: 'number', default: 5, min: 2, max: 20, description: 'Short' },
        longPeriod: { name: 'Long Period', type: 'number', default: 10, min: 5, max: 50, description: 'Long' }
      },
      outputFields: [{ key: 'volumeOsc', label: 'Volume Osc (%)', type: 'number', format: 'percent' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.longPeriod,
      calculationVersion: 'v1.0',
      sourceNotes: 'Percentage difference between two Volume EMAs.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'FORCE_INDEX',
      name: 'Force Index',
      category: 'Volume',
      description: 'Uses price and volume to assess the power behind moves and identify turning points.',
      inputs: ['close', 'volume'],
      parameters: {
        period: { name: 'EMA Period', type: 'number', default: 13, min: 2, max: 50, description: 'Period' }
      },
      outputFields: [{ key: 'forceIndex', label: 'Force Index', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period + 1,
      calculationVersion: 'v1.0',
      sourceNotes: 'Alexander Elder Force Index.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'EMV',
      name: 'Ease of Movement',
      category: 'Volume',
      description: 'Relates price change to volume, quantifying the ease with which prices move.',
      inputs: ['high', 'low', 'volume'],
      parameters: {
        period: { name: 'Period', type: 'number', default: 14, min: 2, max: 50, description: 'Period' },
        divisor: { name: 'Divisor', type: 'number', default: 1000000, min: 1000, max: 100000000, description: 'Volume scale' }
      },
      outputFields: [{ key: 'emv', label: 'EMV', type: 'number', format: 'decimal' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: p => p.period + 1,
      calculationVersion: 'v1.0',
      sourceNotes: 'Richard Arms Ease of Movement.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'NVI_PVI',
      name: 'Negative & Positive Volume Index',
      category: 'Volume',
      description: 'Separates price moves on contracting volume (smart money) vs expanding volume (crowd).',
      inputs: ['close', 'volume'],
      parameters: {},
      outputFields: [
        { key: 'nvi', label: 'NVI', type: 'number', format: 'decimal' },
        { key: 'pvi', label: 'PVI', type: 'number', format: 'decimal' }
      ],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: 2,
      calculationVersion: 'v1.0',
      sourceNotes: 'Paul Dysart & Norman Fosback Volume Indexes.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: false
    });

    this.register({
      id: 'VWAP',
      name: 'Volume-Weighted Average Price (Cumulative)',
      category: 'Volume',
      description: 'True cumulative volume-weighted execution benchmark from series inception.',
      inputs: ['high', 'low', 'close', 'volume'],
      parameters: {},
      outputFields: [{ key: 'vwap', label: 'VWAP', type: 'number', format: 'price' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: 1,
      calculationVersion: 'v1.0',
      sourceNotes: 'Cumulative sum(TypicalPrice * Vol) / sum(Vol). Daily data caveat documented.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });

    this.register({
      id: 'ANCHORED_VWAP',
      name: 'Anchored VWAP',
      category: 'Volume',
      description: 'Volume-weighted average price accumulating strictly from an explicit anchor date.',
      inputs: ['high', 'low', 'close', 'volume'],
      parameters: {
        anchorDate: { name: 'Anchor Date', type: 'string', default: '2026-01-01', description: 'YYYY-MM-DD anchor date' }
      },
      outputFields: [{ key: 'anchoredVwap', label: 'Anchored VWAP', type: 'number', format: 'price' }],
      timeframeCompatibility: ['INTRADAY', 'DAILY', 'WEEKLY', 'MONTHLY'],
      warmupPeriod: 1,
      calculationVersion: 'v1.0',
      sourceNotes: 'Brian Shannon Anchored VWAP methodology.',
      implementationStatus: 'IMPLEMENTED',
      overlayOnPrice: true
    });
  }
}

export const indicatorRegistry = new IndicatorRegistry();
