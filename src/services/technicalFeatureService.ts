/**
 * Technical Feature Service
 * Bridges data repositories with the technical indicator calculation engine.
 * Computes unified feature matrices across multiple timeframes for historical research,
 * statistical scoring, and setup detection.
 */

import { OHLCVBar, Timeframe } from '../types/technicalIndicators';
import { indicatorRegistry } from '../engine/technical/indicatorRegistry';
import { timeframeService } from '../engine/technical/timeframeService';
import { getNormalizedStockBars } from '../data/normalizedMasterData';

export interface SymbolTechnicalSnapshot {
  symbol: string;
  timeframe: Timeframe;
  asOfDate: string;
  lastClose: number;
  indicators: {
    rsi14: number | null;
    macd: { macd: number | null; signal: number | null; hist: number | null };
    bollinger: { middle: number | null; upper: number | null; lower: number | null; percentB: number | null };
    atr14: number | null;
    atrPercent: number | null;
    adx14: number | null;
    supertrend: { value: number | null; direction: string };
    obv: number | null;
    cmf20: number | null;
    mfi14: number | null;
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
    ema20: number | null;
  };
  structure: {
    trend: string;
    higherHigh: boolean;
    higherLow: boolean;
    lowerHigh: boolean;
    lowerLow: boolean;
    isConsolidating: boolean;
    breakout?: { type: string; breakPrice: number; barDate: string };
  };
  candlestickPatterns: Array<{ pattern: string; direction: string; confidence: number }>;
  supportResistance: Array<{ price: number; type: string; strength: number; source: string }>;
  statistics: {
    zScore: number | null;
    percentileRank: number | null;
    annualizedVolatility: number | null;
    currentDrawdown: number;
    maxDrawdown: number;
  };
}

export class TechnicalFeatureService {
  /**
   * Produce comprehensive technical analysis snapshot for a symbol
   */
  public getSnapshot(symbol: string, timeframe: Timeframe = 'DAILY'): SymbolTechnicalSnapshot {
    const rawDaily = getNormalizedStockBars(symbol);
    const bars: OHLCVBar[] = rawDaily.map(b => ({
      date: b.date,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume,
      turnover: b.turnover
    }));

    const resampled = timeframeService.resample(bars, timeframe);
    const len = resampled.length;
    const lastBar = resampled[len - 1] || { close: 0, date: 'N/A' };

    // Indicators
    const rsiRes = indicatorRegistry.execute('RSI', resampled, { period: 14 }, symbol, timeframe);
    const macdRes = indicatorRegistry.execute('MACD', resampled, {}, symbol, timeframe);
    const bbRes = indicatorRegistry.execute('BOLLINGER', resampled, { period: 20 }, symbol, timeframe);
    const atrRes = indicatorRegistry.execute('ATR', resampled, { period: 14 }, symbol, timeframe);
    const adxRes = indicatorRegistry.execute('ADX', resampled, { period: 14 }, symbol, timeframe);
    const stRes = indicatorRegistry.execute('SUPERTREND', resampled, {}, symbol, timeframe);
    const obvRes = indicatorRegistry.execute('OBV', resampled, {}, symbol, timeframe);
    const cmfRes = indicatorRegistry.execute('CMF', resampled, { period: 20 }, symbol, timeframe);
    const mfiRes = indicatorRegistry.execute('MFI', resampled, { period: 14 }, symbol, timeframe);
    const sma20 = indicatorRegistry.execute('SMA', resampled, { period: 20 }, symbol, timeframe);
    const sma50 = indicatorRegistry.execute('SMA', resampled, { period: 50 }, symbol, timeframe);
    const sma200 = indicatorRegistry.execute('SMA', resampled, { period: 200 }, symbol, timeframe);
    const ema20 = indicatorRegistry.execute('EMA', resampled, { period: 20 }, symbol, timeframe);

    // Structure, S/R, Patterns & Stats
    const structure = indicatorRegistry.getPriceStructure(resampled, 4, 4);
    const srLevels = indicatorRegistry.getSupportResistance(resampled, 1.5);
    const candlePatterns = indicatorRegistry.getCandlestickPatterns(resampled);
    const recentCandlePatterns = candlePatterns.filter(cp => cp.barIndex >= len - 3);
    const stats = indicatorRegistry.getStatisticalFeatures(resampled, 20);

    const getVal = (seriesRes: typeof rsiRes, key: string) => {
      const last = seriesRes.series[seriesRes.series.length - 1];
      return last ? (last.values[key] as number) : null;
    };

    return {
      symbol,
      timeframe,
      asOfDate: lastBar.date,
      lastClose: lastBar.close,
      indicators: {
        rsi14: getVal(rsiRes, 'rsi'),
        macd: {
          macd: getVal(macdRes, 'macd'),
          signal: getVal(macdRes, 'signal'),
          hist: getVal(macdRes, 'histogram')
        },
        bollinger: {
          middle: getVal(bbRes, 'middle'),
          upper: getVal(bbRes, 'upper'),
          lower: getVal(bbRes, 'lower'),
          percentB: getVal(bbRes, 'percentB')
        },
        atr14: getVal(atrRes, 'atr'),
        atrPercent: getVal(atrRes, 'atrPercent'),
        adx14: getVal(adxRes, 'adx'),
        supertrend: {
          value: getVal(stRes, 'supertrend'),
          direction: String(stRes.series[stRes.series.length - 1]?.values.direction || 'NEUTRAL')
        },
        obv: getVal(obvRes, 'obv'),
        cmf20: getVal(cmfRes, 'cmf'),
        mfi14: getVal(mfiRes, 'mfi'),
        sma20: getVal(sma20, 'sma'),
        sma50: getVal(sma50, 'sma'),
        sma200: getVal(sma200, 'sma'),
        ema20: getVal(ema20, 'ema')
      },
      structure: {
        trend: structure.trend,
        higherHigh: structure.higherHigh,
        higherLow: structure.higherLow,
        lowerHigh: structure.lowerHigh,
        lowerLow: structure.lowerLow,
        isConsolidating: structure.isConsolidating,
        breakout: structure.recentBreakout
      },
      candlestickPatterns: recentCandlePatterns.map(p => ({
        pattern: p.pattern,
        direction: p.direction,
        confidence: p.confidence
      })),
      supportResistance: srLevels.slice(0, 6).map(l => ({
        price: l.price,
        type: l.type,
        strength: l.strength,
        source: l.source
      })),
      statistics: {
        zScore: stats.zScore[len - 1] ?? null,
        percentileRank: stats.percentileRank[len - 1] ?? null,
        annualizedVolatility: stats.annualizedVolatility,
        currentDrawdown: stats.currentDrawdown,
        maxDrawdown: stats.maxDrawdown
      }
    };
  }
}

export const technicalFeatureService = new TechnicalFeatureService();
