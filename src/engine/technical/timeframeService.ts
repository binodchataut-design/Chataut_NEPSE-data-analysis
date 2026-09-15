/**
 * Multi-Timeframe Abstraction & Aggregation Service
 * Converts raw lower-frequency OHLCV bars into mathematically sound higher-timeframe candles:
 * - INTRADAY
 * - DAILY (Native NEPSE trading days: Sunday through Thursday)
 * - WEEKLY (Aggregated from Sunday open to Thursday close)
 * - MONTHLY (Aggregated from month opening day to month closing day)
 *
 * Prevents premature or fake timeframe relabeling.
 */

import { OHLCVBar, Timeframe } from '../../types/technicalIndicators';

export class TimeframeService {
  /**
   * Resamples daily OHLCV bars into Weekly OHLCV bars.
   * NEPSE trading calendar: Sunday (Day 0) through Thursday (Day 4).
   */
  public aggregateToWeekly(dailyBars: OHLCVBar[]): OHLCVBar[] {
    if (dailyBars.length === 0) return [];

    // Sort chronologically ascending
    const sorted = [...dailyBars].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const weeklyBars: OHLCVBar[] = [];

    // Group bars by ISO week key (YYYY-Www)
    const weekGroups = new Map<string, OHLCVBar[]>();

    for (const bar of sorted) {
      const d = new Date(bar.date);
      // Determine week identifier: year + week number
      const target = new Date(d.valueOf());
      const dayNr = (d.getUTCDay() + 6) % 7;
      target.setUTCDate(target.getUTCDate() - dayNr + 3);
      const firstThursday = target.valueOf();
      target.setUTCMonth(0, 1);
      if (target.getUTCDay() !== 4) {
        target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
      }
      const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
      const weekKey = `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;

      if (!weekGroups.has(weekKey)) {
        weekGroups.set(weekKey, []);
      }
      weekGroups.get(weekKey)!.push(bar);
    }

    for (const [, group] of weekGroups.entries()) {
      if (group.length === 0) continue;
      const firstDay = group[0];
      const lastDay = group[group.length - 1];

      let weekHigh = -Infinity;
      let weekLow = Infinity;
      let totalVolume = 0;
      let totalTurnover = 0;

      for (const b of group) {
        if (b.high > weekHigh) weekHigh = b.high;
        if (b.low < weekLow) weekLow = b.low;
        totalVolume += b.volume;
        totalTurnover += b.turnover || 0;
      }

      weeklyBars.push({
        date: lastDay.date, // Label weekly candle with week ending date
        open: firstDay.open,
        high: weekHigh,
        low: weekLow,
        close: lastDay.close,
        volume: totalVolume,
        turnover: totalTurnover
      });
    }

    return weeklyBars;
  }

  /**
   * Resamples daily OHLCV bars into Monthly OHLCV bars
   */
  public aggregateToMonthly(dailyBars: OHLCVBar[]): OHLCVBar[] {
    if (dailyBars.length === 0) return [];

    const sorted = [...dailyBars].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const monthlyBars: OHLCVBar[] = [];
    const monthGroups = new Map<string, OHLCVBar[]>();

    for (const bar of sorted) {
      const monthKey = bar.date.substring(0, 7); // YYYY-MM
      if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, []);
      }
      monthGroups.get(monthKey)!.push(bar);
    }

    for (const [, group] of monthGroups.entries()) {
      if (group.length === 0) continue;
      const firstDay = group[0];
      const lastDay = group[group.length - 1];

      let monthHigh = -Infinity;
      let monthLow = Infinity;
      let totalVolume = 0;
      let totalTurnover = 0;

      for (const b of group) {
        if (b.high > monthHigh) monthHigh = b.high;
        if (b.low < monthLow) monthLow = b.low;
        totalVolume += b.volume;
        totalTurnover += b.turnover || 0;
      }

      monthlyBars.push({
        date: lastDay.date,
        open: firstDay.open,
        high: monthHigh,
        low: monthLow,
        close: lastDay.close,
        volume: totalVolume,
        turnover: totalTurnover
      });
    }

    return monthlyBars;
  }

  /**
   * Universal timeframe resampler
   */
  public resample(bars: OHLCVBar[], targetTimeframe: Timeframe): OHLCVBar[] {
    switch (targetTimeframe) {
      case 'INTRADAY':
        // Intraday from daily data is not synthetically manufactured
        return bars;
      case 'DAILY':
        return [...bars].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'WEEKLY':
        return this.aggregateToWeekly(bars);
      case 'MONTHLY':
        return this.aggregateToMonthly(bars);
    }
  }
}

export const timeframeService = new TimeframeService();
