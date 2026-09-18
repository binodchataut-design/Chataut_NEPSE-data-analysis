import { OHLCVBar } from '../../types/technicalIndicators';

export function resample(
  bars: OHLCVBar[],
  timeframe: '1D' | '1W' | '1M'
): OHLCVBar[] {
  if (timeframe === '1D') {
    return bars;
  }

  if (!bars || bars.length === 0) {
    return [];
  }

  const parseDateParts = (dateStr: string) => {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10) - 1,
        day: parseInt(match[3], 10),
      };
    }
    const d = new Date(dateStr);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth(),
      day: d.getUTCDate(),
    };
  };

  const getWeekKey = (dateStr: string): string => {
    const { year, month, day } = parseDateParts(dateStr);
    const date = new Date(Date.UTC(year, month, day));
    // ISO day of week: Monday is 1, Sunday is 7
    const dayOfWeek = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
    // Shift date back to Monday
    date.setUTCDate(date.getUTCDate() - (dayOfWeek - 1));
    const monYear = date.getUTCFullYear();
    const monMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
    const monDay = String(date.getUTCDate()).padStart(2, '0');
    return `${monYear}-${monMonth}-${monDay}`;
  };

  const getMonthKey = (dateStr: string): string => {
    const { year, month } = parseDateParts(dateStr);
    const mStr = String(month + 1).padStart(2, '0');
    return `${year}-${mStr}`;
  };

  // Sort bars ascending by date before grouping
  const sortedBars = [...bars].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const groups = new Map<string, OHLCVBar[]>();
  for (const bar of sortedBars) {
    const key = timeframe === '1W' ? getWeekKey(bar.date) : getMonthKey(bar.date);
    let list = groups.get(key);
    if (!list) {
      list = [];
      groups.set(key, list);
    }
    list.push(bar);
  }

  const aggregated: OHLCVBar[] = [];

  for (const [, group] of groups) {
    if (group.length === 0) continue;

    group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const firstBar = group[0];
    const lastBar = group[group.length - 1];

    let maxHigh = -Infinity;
    let minLow = Infinity;
    let totalVolume = 0;
    let totalTurnover = 0;

    for (const b of group) {
      if (b.high > maxHigh) maxHigh = b.high;
      if (b.low < minLow) minLow = b.low;
      totalVolume += typeof b.volume === 'number' && !isNaN(b.volume) ? b.volume : 0;
      totalTurnover += typeof b.turnover === 'number' && !isNaN(b.turnover) ? b.turnover : 0;
    }

    const aggregatedBar: OHLCVBar = {
      date: lastBar.date,
      open: firstBar.open,
      high: maxHigh,
      low: minLow,
      close: lastBar.close,
      volume: totalVolume,
      turnover: totalTurnover,
    };

    if (lastBar.timestamp) {
      aggregatedBar.timestamp = lastBar.timestamp;
    }

    aggregated.push(aggregatedBar);
  }

  aggregated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return aggregated;
}

export const timeframeService = {
  getTimeframes() {
    return ['1D', '1W', '1M'];
  },
  resample,
};
