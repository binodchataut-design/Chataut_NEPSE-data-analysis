/**
 * Liquidity Validation Service (Phase 3D)
 * Calculates rolling turnover, volume, traded-day ratios, and cross-sectional liquidity percentiles.
 * Evaluates market participation realism (Position Value / ADT) and enforces liquidity research filters.
 */

import { OHLCVBar } from '../types/technicalIndicators';
import {
  LiquidityMetrics,
  LiquidityClassification,
  LiquidityFilterConfig,
  MarketParticipationDiagnostic
} from '../types/researchValidation';
import { getNormalizedStockBars } from '../data/normalizedMasterData';

export const DEFAULT_LIQUIDITY_FILTER: LiquidityFilterConfig = {
  enabled: true,
  minAvgTurnoverNpr: 1000000, // 10 Lakh NPR daily turnover minimum
  minAvgVolume: 2000, // 2,000 shares
  minTradedDaysRatio: 0.85, // 85% traded day ratio
  maxZeroVolumeRatio: 0.05, // Max 5% zero-volume days
  minLiquidityPercentile: 20.0 // Top 80% most liquid
};

export class LiquidityValidationService {
  /**
   * Computes liquidity metrics for an individual stock over its available history
   */
  public static computeLiquidityMetrics(
    symbol: string,
    bars: OHLCVBar[]
  ): LiquidityMetrics {
    if (!bars || bars.length === 0) {
      return {
        symbol,
        averageTurnover20: 0,
        averageTurnover60: 0,
        averageVolume20: 0,
        averageVolume60: 0,
        tradedDayRatio: 0,
        zeroVolumeRatio: 1.0,
        liquidityPercentile: 0,
        classification: 'VERY_LOW',
        assumedExecutionRealistic: false
      };
    }

    const n = bars.length;
    const slice20 = bars.slice(Math.max(0, n - 20));
    const slice60 = bars.slice(Math.max(0, n - 60));

    // Turnovers & Volumes
    const getTurnover = (b: OHLCVBar) => b.turnover || b.close * b.volume;

    const to20 = slice20.reduce((acc, b) => acc + getTurnover(b), 0) / (slice20.length || 1);
    const to60 = slice60.reduce((acc, b) => acc + getTurnover(b), 0) / (slice60.length || 1);

    const vol20 = slice20.reduce((acc, b) => acc + b.volume, 0) / (slice20.length || 1);
    const vol60 = slice60.reduce((acc, b) => acc + b.volume, 0) / (slice60.length || 1);

    // Traded day and zero volume ratios
    const zeroVolDays = bars.filter(b => b.volume <= 0).length;
    const zeroVolumeRatio = zeroVolDays / n;
    const tradedDayRatio = 1.0 - zeroVolumeRatio;

    // Classification based on Average Daily Turnover (ADT) in NPR:
    // VERY_HIGH: >= 20M NPR (2 Crore)
    // HIGH: 5M to 20M NPR (50 Lakh - 2 Crore)
    // MODERATE: 1.5M to 5M NPR (15 Lakh - 50 Lakh)
    // LOW: 300k to 1.5M NPR
    // VERY_LOW: < 300k NPR
    let classification: LiquidityClassification = 'MODERATE';
    if (to20 >= 20000000) classification = 'VERY_HIGH';
    else if (to20 >= 5000000) classification = 'HIGH';
    else if (to20 >= 1500000) classification = 'MODERATE';
    else if (to20 >= 300000) classification = 'LOW';
    else classification = 'VERY_LOW';

    // Liquidity percentile (approximated based on empirical NEPSE ADT distribution)
    let percentile = 50;
    if (to20 >= 30000000) percentile = 95;
    else if (to20 >= 15000000) percentile = 85;
    else if (to20 >= 7000000) percentile = 70;
    else if (to20 >= 2500000) percentile = 50;
    else if (to20 >= 1000000) percentile = 35;
    else if (to20 >= 400000) percentile = 20;
    else percentile = 10;

    const assumedRealistic = to20 >= 1000000 && zeroVolumeRatio <= 0.05 && tradedDayRatio >= 0.85;

    return {
      symbol: symbol.toUpperCase(),
      averageTurnover20: Math.round(to20),
      averageTurnover60: Math.round(to60),
      averageVolume20: Math.round(vol20),
      averageVolume60: Math.round(vol60),
      tradedDayRatio: Math.round(tradedDayRatio * 1000) / 1000,
      zeroVolumeRatio: Math.round(zeroVolumeRatio * 1000) / 1000,
      liquidityPercentile: percentile,
      classification,
      assumedExecutionRealistic: assumedRealistic
    };
  }

  /**
   * Tests whether a security passes configured liquidity filters
   */
  public static passesLiquidityFilter(
    metrics: LiquidityMetrics,
    config: LiquidityFilterConfig = DEFAULT_LIQUIDITY_FILTER
  ): { passes: boolean; reasons: string[] } {
    if (!config.enabled) {
      return { passes: true, reasons: [] };
    }

    const reasons: string[] = [];

    if (metrics.averageTurnover20 < config.minAvgTurnoverNpr) {
      reasons.push(
        `Turnover NPR ${metrics.averageTurnover20.toLocaleString()} is below threshold NPR ${config.minAvgTurnoverNpr.toLocaleString()}`
      );
    }

    if (metrics.averageVolume20 < config.minAvgVolume) {
      reasons.push(
        `Volume ${metrics.averageVolume20.toLocaleString()} is below threshold ${config.minAvgVolume.toLocaleString()} shares`
      );
    }

    if (metrics.tradedDayRatio < config.minTradedDaysRatio) {
      reasons.push(
        `Traded day ratio ${(metrics.tradedDayRatio * 100).toFixed(1)}% is below threshold ${(config.minTradedDaysRatio * 100).toFixed(1)}%`
      );
    }

    if (metrics.zeroVolumeRatio > config.maxZeroVolumeRatio) {
      reasons.push(
        `Zero volume ratio ${(metrics.zeroVolumeRatio * 100).toFixed(1)}% exceeds threshold ${(config.maxZeroVolumeRatio * 100).toFixed(1)}%`
      );
    }

    if (metrics.liquidityPercentile < config.minLiquidityPercentile) {
      reasons.push(
        `Liquidity percentile ${metrics.liquidityPercentile} is below threshold ${config.minLiquidityPercentile}`
      );
    }

    return {
      passes: reasons.length === 0,
      reasons
    };
  }

  /**
   * Evaluates participation rate realism for a proposed position size vs average daily turnover
   */
  public static evaluateParticipationRealism(
    positionValueNpr: number,
    averageDailyTurnoverNpr: number
  ): MarketParticipationDiagnostic {
    if (averageDailyTurnoverNpr <= 0) {
      return {
        positionValueNpr,
        averageDailyTurnoverNpr,
        participationRatePercent: 100,
        realismLevel: 'UNREALISTIC',
        warningMessage: 'Zero average daily turnover. Immediate market impact or total illiquidity.'
      };
    }

    const rate = (positionValueNpr / averageDailyTurnoverNpr) * 100;

    let realism: 'HIGH' | 'MODERATE' | 'LOW' | 'UNREALISTIC' = 'HIGH';
    let warning: string | undefined;

    if (rate > 15.0) {
      realism = 'UNREALISTIC';
      warning = `Extreme participation rate (${rate.toFixed(1)}% of ADT). Exceeds market absorption capacity without severe adverse slippage.`;
    } else if (rate > 5.0) {
      realism = 'LOW';
      warning = `High participation rate (${rate.toFixed(1)}% of ADT). Execution will likely suffer market impact and unfilled orders.`;
    } else if (rate > 2.0) {
      realism = 'MODERATE';
      warning = `Moderate participation rate (${rate.toFixed(1)}% of ADT). Slippage should be budgeted.`;
    } else {
      realism = 'HIGH';
    }

    return {
      positionValueNpr,
      averageDailyTurnoverNpr,
      participationRatePercent: Math.round(rate * 100) / 100,
      realismLevel: realism,
      warningMessage: warning
    };
  }
}
