/**
 * Price Structure Analysis Engine
 * Implements: Swing Highs, Swing Lows, HH/HL/LH/LL structure,
 * Trend classification, Local S/R, Breakout/Breakdown, Gap detection, Consolidation
 *
 * LOOK-AHEAD BIAS NOTICE:
 * A swing pivot with right-strength R requires R bars after the pivot to be mathematically
 * confirmed. At historical bar T, only pivots where (pivotIndex + R <= T) are marked as confirmed.
 * Calculation Version: v1.0
 */

import {
  OHLCVBar,
  PriceStructureResult,
  SwingPoint,
  TrendDirection
} from '../../types/technicalIndicators';

export const PRICE_STRUCTURE_VERSION = 'v1.0';

/**
 * Detect swing highs and lows strictly respecting look-ahead bias
 */
export function detectSwingPoints(
  bars: OHLCVBar[],
  leftBars = 5,
  rightBars = 5
): { swingHighs: SwingPoint[]; swingLows: SwingPoint[] } {
  const swingHighs: SwingPoint[] = [];
  const swingLows: SwingPoint[] = [];
  const len = bars.length;

  if (len < leftBars + rightBars + 1) {
    return { swingHighs, swingLows };
  }

  // Bar candidate 'i' can only be confirmed once index >= i + rightBars exists
  for (let i = leftBars; i < len - rightBars; i++) {
    const candidateHigh = bars[i].high;
    const candidateLow = bars[i].low;

    let isHigh = true;
    let isLow = true;

    // Check left side
    for (let l = 1; l <= leftBars; l++) {
      if (bars[i - l].high >= candidateHigh) isHigh = false;
      if (bars[i - l].low <= candidateLow) isLow = false;
    }

    // Check right side
    for (let r = 1; r <= rightBars; r++) {
      if (bars[i + r].high >= candidateHigh) isHigh = false;
      if (bars[i + r].low <= candidateLow) isLow = false;
    }

    if (isHigh) {
      const prevHigh = swingHighs[swingHighs.length - 1];
      swingHighs.push({
        index: i,
        date: bars[i].date,
        price: candidateHigh,
        type: 'SWING_HIGH',
        barsSincePrevious: prevHigh ? i - prevHigh.index : 0
      });
    }

    if (isLow) {
      const prevLow = swingLows[swingLows.length - 1];
      swingLows.push({
        index: i,
        date: bars[i].date,
        price: candidateLow,
        type: 'SWING_LOW',
        barsSincePrevious: prevLow ? i - prevLow.index : 0
      });
    }
  }

  return { swingHighs, swingLows };
}

/**
 * Full Price Structure Analysis
 */
export function analyzePriceStructure(
  bars: OHLCVBar[],
  leftBars = 5,
  rightBars = 5
): PriceStructureResult {
  const { swingHighs, swingLows } = detectSwingPoints(bars, leftBars, rightBars);
  const len = bars.length;

  let higherHigh = false;
  let lowerHigh = false;
  let higherLow = false;
  let lowerLow = false;

  if (swingHighs.length >= 2) {
    const latestHigh = swingHighs[swingHighs.length - 1].price;
    const prevHigh = swingHighs[swingHighs.length - 2].price;
    if (latestHigh > prevHigh) higherHigh = true;
    if (latestHigh < prevHigh) lowerHigh = true;
  }

  if (swingLows.length >= 2) {
    const latestLow = swingLows[swingLows.length - 1].price;
    const prevLow = swingLows[swingLows.length - 2].price;
    if (latestLow > prevLow) higherLow = true;
    if (latestLow < prevLow) lowerLow = true;
  }

  // Determine structural trend
  let trend: TrendDirection = 'SIDEWAYS';
  if (higherHigh && higherLow) {
    trend = 'BULLISH';
  } else if (lowerHigh && lowerLow) {
    trend = 'BEARISH';
  } else {
    trend = 'SIDEWAYS';
  }

  // Range and Consolidation detection (over last 20 bars)
  const windowSize = Math.min(20, len);
  let rangeHigh = -Infinity;
  let rangeLow = Infinity;
  for (let i = len - windowSize; i < len; i++) {
    if (bars[i]) {
      if (bars[i].high > rangeHigh) rangeHigh = bars[i].high;
      if (bars[i].low < rangeLow) rangeLow = bars[i].low;
    }
  }

  const rangePercentage = rangeLow > 0 ? ((rangeHigh - rangeLow) / rangeLow) * 100 : 0;
  // Consolidation defined as range percentage under 4% over 20 bars in NEPSE equities
  const isConsolidating = rangePercentage < 4.5 && windowSize >= 15;

  // Breakout detection against most recent swing points
  let recentBreakout: PriceStructureResult['recentBreakout'] = undefined;
  if (len > 0) {
    const lastBar = bars[len - 1];
    if (swingHighs.length > 0) {
      const lastSwingHigh = swingHighs[swingHighs.length - 1];
      if (lastBar.close > lastSwingHigh.price) {
        recentBreakout = {
          type: 'BREAKOUT_HIGH',
          breakPrice: lastSwingHigh.price,
          barDate: lastBar.date
        };
      }
    }
    if (swingLows.length > 0 && !recentBreakout) {
      const lastSwingLow = swingLows[swingLows.length - 1];
      if (lastBar.close < lastSwingLow.price) {
        recentBreakout = {
          type: 'BREAKDOWN_LOW',
          breakPrice: lastSwingLow.price,
          barDate: lastBar.date
        };
      }
    }
  }

  // Gap detection across the past 30 bars
  const recentGaps: PriceStructureResult['recentGaps'] = [];
  const gapLookback = Math.max(1, len - 30);

  for (let i = gapLookback; i < len; i++) {
    const prev = bars[i - 1];
    const curr = bars[i];
    // Gap Up: current Low > previous High
    if (curr.low > prev.high) {
      const gapSize = curr.low - prev.high;
      const gapPercent = (gapSize / prev.close) * 100;
      // Check if filled by subsequent bars
      let isFilled = false;
      for (let k = i + 1; k < len; k++) {
        if (bars[k].low <= prev.high) {
          isFilled = true;
          break;
        }
      }
      recentGaps.push({
        date: curr.date,
        type: 'GAP_UP',
        gapSize,
        gapPercent,
        isFilled
      });
    }
    // Gap Down: current High < previous Low
    else if (curr.high < prev.low) {
      const gapSize = prev.low - curr.high;
      const gapPercent = (gapSize / prev.close) * 100;
      let isFilled = false;
      for (let k = i + 1; k < len; k++) {
        if (bars[k].high >= prev.low) {
          isFilled = true;
          break;
        }
      }
      recentGaps.push({
        date: curr.date,
        type: 'GAP_DOWN',
        gapSize,
        gapPercent,
        isFilled
      });
    }
  }

  return {
    trend,
    swingHighs,
    swingLows,
    higherHigh,
    higherLow,
    lowerHigh,
    lowerLow,
    currentRangeHigh: rangeHigh,
    currentRangeLow: rangeLow,
    isConsolidating,
    rangePercentage,
    recentBreakout,
    recentGaps
  };
}
