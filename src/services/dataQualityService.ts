/**
 * Data Quality & Market Calendar Service (Phase 3D)
 * Strict deterministic audit of historical OHLCV data for NEPSE securities.
 * Zero look-ahead bias, flags anomalies rather than silently modifying raw data.
 */

import { OHLCVBar } from '../types/technicalIndicators';
import {
  PriceCheckIssue,
  DataCoverageScore,
  DayClassification,
  CalendarSource,
  ValidityStatus
} from '../types/researchValidation';

export interface DataQualityThresholds {
  minCoveragePercent: number; // e.g. 85%
  maxAllowedLongestGapSessions: number; // e.g. 15 sessions
  maxUnexplainedJumpPercent: number; // e.g. 20%
  maxVolumeMultiplier: number; // e.g. 15x
}

export const DEFAULT_DATA_QUALITY_THRESHOLDS: DataQualityThresholds = {
  minCoveragePercent: 80,
  maxAllowedLongestGapSessions: 12,
  maxUnexplainedJumpPercent: 20.0,
  maxVolumeMultiplier: 15.0
};

export class DataQualityService {
  /**
   * Known official NEPSE holiday dates (YYYY-MM-DD)
   * Dashain, Tihar, Shivaratri, Holi, New Year, etc.
   */
  private static readonly KNOWN_NEPSE_HOLIDAYS = new Set<string>([
    '2026-01-01', '2026-01-15', '2026-02-16', '2026-03-03', '2026-04-14',
    '2026-05-01', '2026-05-23', '2026-08-19', '2026-09-04', '2026-09-17',
    '2025-01-01', '2025-01-14', '2025-02-26', '2025-03-14', '2025-04-14',
    '2025-10-01', '2025-10-02', '2025-10-03', '2025-10-21', '2025-10-22'
  ]);

  /**
   * Determines if a calendar date is an expected NEPSE trading day
   * NEPSE trades Sunday through Thursday. Friday (5) and Saturday (6) are weekend closures.
   */
  public static isExpectedTradingDay(dateStr: string): {
    isTradingDay: boolean;
    classification: DayClassification;
  } {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { isTradingDay: false, classification: 'DATA_PROVIDER_GAP' };
    }

    const dayOfWeek = d.getUTCDay(); // 0 = Sunday, 1 = Monday ... 5 = Friday, 6 = Saturday

    // NEPSE Weekends: Friday (5) and Saturday (6)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return { isTradingDay: false, classification: 'NORMAL_NON_TRADING_DAY' };
    }

    // Public Holidays
    if (this.KNOWN_NEPSE_HOLIDAYS.has(dateStr)) {
      return { isTradingDay: false, classification: 'NORMAL_NON_TRADING_DAY' };
    }

    return { isTradingDay: true, classification: 'EXPECTED_TRADING_DAY' };
  }

  /**
   * Validates raw OHLCV series for an individual security
   */
  public static validateSecurityData(
    symbol: string,
    bars: OHLCVBar[],
    thresholds: DataQualityThresholds = DEFAULT_DATA_QUALITY_THRESHOLDS
  ): DataCoverageScore {
    const issues: PriceCheckIssue[] = [];

    if (!bars || bars.length === 0) {
      return {
        symbol,
        firstAvailableDate: 'N/A',
        lastAvailableDate: 'N/A',
        observationsCount: 0,
        expectedObservations: 0,
        missingObservations: 0,
        longestGapSessions: 0,
        averageGapSessions: 0,
        coveragePercent: 0,
        calendarSource: 'KNOWN',
        qualityStatus: 'INSUFFICIENT_DATA',
        statusNotes: 'Zero historical observations found for security.',
        issues: [
          {
            code: 'NO_DATA',
            severity: 'CRITICAL',
            date: 'N/A',
            message: 'Zero historical bars found.'
          }
        ]
      };
    }

    const seenDates = new Set<string>();
    let prevBar: OHLCVBar | null = null;
    const volumes: number[] = [];

    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      volumes.push(b.volume);

      // 1. Date Duplicate Check
      if (seenDates.has(b.date)) {
        issues.push({
          code: 'DUPLICATE_DATE',
          severity: 'CRITICAL',
          date: b.date,
          field: 'date',
          message: `Duplicate record for date ${b.date}`,
          detectedValue: b.date
        });
      }
      seenDates.add(b.date);

      // 2. Chronological Ordering Check
      if (prevBar && b.date <= prevBar.date) {
        issues.push({
          code: 'NON_CHRONOLOGICAL_DATE',
          severity: 'CRITICAL',
          date: b.date,
          field: 'date',
          message: `Date ${b.date} appears after or equal to ${prevBar.date}`,
          detectedValue: `${prevBar.date} -> ${b.date}`
        });
      }

      // 3. Positive Prices Check
      if (b.open <= 0 || b.high <= 0 || b.low <= 0 || b.close <= 0) {
        issues.push({
          code: 'NON_POSITIVE_PRICE',
          severity: 'CRITICAL',
          date: b.date,
          field: 'price',
          message: `Non-positive price detected: O=${b.open}, H=${b.high}, L=${b.low}, C=${b.close}`,
          detectedValue: `O:${b.open}, H:${b.high}, L:${b.low}, C:${b.close}`,
          expectedCondition: 'All OHLC > 0'
        });
      }

      // 4. Volume Bounds
      if (b.volume < 0) {
        issues.push({
          code: 'NEGATIVE_VOLUME',
          severity: 'CRITICAL',
          date: b.date,
          field: 'volume',
          message: `Negative volume detected: ${b.volume}`,
          detectedValue: b.volume,
          expectedCondition: 'Volume >= 0'
        });
      }

      // 5. Impossible OHLC Relationships
      const maxOCL = Math.max(b.open, b.close, b.low);
      const minOCH = Math.min(b.open, b.close, b.high);

      if (b.high < maxOCL) {
        issues.push({
          code: 'IMPOSSIBLE_HIGH',
          severity: 'CRITICAL',
          date: b.date,
          field: 'high',
          message: `High ${b.high} is lower than max(Open=${b.open}, Close=${b.close}, Low=${b.low})`,
          detectedValue: b.high,
          expectedCondition: 'High >= max(Open, Close, Low)'
        });
      }

      if (b.low > minOCH) {
        issues.push({
          code: 'IMPOSSIBLE_LOW',
          severity: 'CRITICAL',
          date: b.date,
          field: 'low',
          message: `Low ${b.low} is higher than min(Open=${b.open}, Close=${b.close}, High=${b.high})`,
          detectedValue: b.low,
          expectedCondition: 'Low <= min(Open, Close, High)'
        });
      }

      // 6. Extreme Unexplained Price Jump Check
      if (prevBar && prevBar.close > 0) {
        const changePct = Math.abs((b.close - prevBar.close) / prevBar.close) * 100;
        if (changePct > thresholds.maxUnexplainedJumpPercent) {
          issues.push({
            code: 'EXTREME_PRICE_JUMP',
            severity: 'WARNING',
            date: b.date,
            field: 'close',
            message: `Single session price change of ${changePct.toFixed(1)}% exceeds threshold of ${thresholds.maxUnexplainedJumpPercent}%`,
            detectedValue: `${changePct.toFixed(1)}%`,
            expectedCondition: `|Change| <= ${thresholds.maxUnexplainedJumpPercent}%`
          });
        }
      }

      // 7. Extreme Volume Spikes (relative to rolling 20-day median)
      if (i >= 10) {
        const slice = volumes.slice(Math.max(0, i - 20), i);
        const sorted = [...slice].sort((a, b) => a - b);
        const medianVol = sorted[Math.floor(sorted.length / 2)] || 1;
        if (medianVol > 0 && b.volume > medianVol * thresholds.maxVolumeMultiplier) {
          issues.push({
            code: 'EXTREME_VOLUME_SPIKE',
            severity: 'WARNING',
            date: b.date,
            field: 'volume',
            message: `Volume ${b.volume.toLocaleString()} is ${(b.volume / medianVol).toFixed(1)}x rolling median`,
            detectedValue: `${(b.volume / medianVol).toFixed(1)}x`,
            expectedCondition: `Volume <= ${thresholds.maxVolumeMultiplier}x median`
          });
        }
      }

      prevBar = b;
    }

    // Gap Analysis across NEPSE Market Calendar
    const firstDate = bars[0].date;
    const lastDate = bars[bars.length - 1].date;

    const startDate = new Date(firstDate);
    const endDate = new Date(lastDate);
    let expectedSessions = 0;
    const missingDays: string[] = [];
    const barDateSet = new Set(bars.map(b => b.date));

    // Iterate through calendar days from start to end
    const curr = new Date(startDate);
    let currentGap = 0;
    let longestGap = 0;
    const gaps: number[] = [];

    while (curr <= endDate) {
      const dateStr = curr.toISOString().split('T')[0];
      const { isTradingDay } = this.isExpectedTradingDay(dateStr);

      if (isTradingDay) {
        expectedSessions++;
        if (!barDateSet.has(dateStr)) {
          missingDays.push(dateStr);
          currentGap++;
        } else {
          if (currentGap > 0) {
            gaps.push(currentGap);
            if (currentGap > longestGap) longestGap = currentGap;
            currentGap = 0;
          }
        }
      }

      // advance 1 calendar day
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    if (currentGap > 0) {
      gaps.push(currentGap);
      if (currentGap > longestGap) longestGap = currentGap;
    }

    const totalMissing = missingDays.length;
    const totalExpected = Math.max(bars.length, expectedSessions);
    const coveragePct = totalExpected > 0 ? (bars.length / totalExpected) * 100 : 0;
    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;

    // Determine Quality Status
    const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
    let qualityStatus: ValidityStatus = 'VALID';
    let statusNotes = 'Data coverage and OHLC mathematical relations are verified.';

    if (criticalCount > 0) {
      qualityStatus = 'INVALID';
      statusNotes = `Found ${criticalCount} critical OHLC/ordering integrity violations.`;
    } else if (coveragePct < 50 || bars.length < 20) {
      qualityStatus = 'INSUFFICIENT_DATA';
      statusNotes = `Coverage (${coveragePct.toFixed(1)}%) or sample size (${bars.length} bars) is too low for research.`;
    } else if (
      coveragePct < thresholds.minCoveragePercent ||
      longestGap > thresholds.maxAllowedLongestGapSessions ||
      issues.some(i => i.severity === 'WARNING')
    ) {
      qualityStatus = 'CONDITIONALLY_VALID';
      statusNotes = `Data contains warnings or coverage (${coveragePct.toFixed(1)}%) is below standard (${thresholds.minCoveragePercent}%).`;
    }

    return {
      symbol,
      firstAvailableDate: firstDate,
      lastAvailableDate: lastDate,
      observationsCount: bars.length,
      expectedObservations: totalExpected,
      missingObservations: totalMissing,
      longestGapSessions: longestGap,
      averageGapSessions: Math.round(avgGap * 10) / 10,
      coveragePercent: Math.round(coveragePct * 10) / 10,
      calendarSource: 'KNOWN',
      qualityStatus,
      statusNotes,
      issues
    };
  }
}
