/**
 * Fibonacci Analysis Engine
 * Implements: Fibonacci Retracement & Extension calculations from verified swing anchors
 * Levels: 0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618, 2.618
 *
 * RESEARCH DISCLAIMER:
 * Fibonacci levels represent historical geometric reference ratios. They are strictly
 * research features and do NOT guarantee price reversals or future trajectory.
 * Calculation Version: v1.0
 */

import { FibonacciAnalysisResult, OHLCVBar } from '../../types/technicalIndicators';
import { detectSwingPoints } from './priceStructure';

export const FIBONACCI_VERSION = 'v1.0';

export const STANDARD_FIBONACCI_RATIOS = [
  0.0,
  0.236,
  0.382,
  0.5,
  0.618,
  0.786,
  1.0,
  1.272,
  1.618,
  2.618
];

/**
 * Calculate Fibonacci levels between two explicit anchor points
 */
export function computeFibonacciLevels(
  highPrice: number,
  highDate: string,
  lowPrice: number,
  lowDate: string,
  ratios = STANDARD_FIBONACCI_RATIOS
): FibonacciAnalysisResult {
  const diff = highPrice - lowPrice;
  const isUptrend = new Date(highDate).getTime() >= new Date(lowDate).getTime();

  const levels = ratios.map(ratio => {
    let price: number;
    let label: string;

    if (isUptrend) {
      // Retracement from high down towards low
      price = highPrice - diff * ratio;
      label = ratio <= 1.0 ? `Retracement ${(ratio * 100).toFixed(1)}%` : `Extension ${(ratio * 100).toFixed(1)}%`;
    } else {
      // Retracement from low up towards high
      price = lowPrice + diff * ratio;
      label = ratio <= 1.0 ? `Retracement ${(ratio * 100).toFixed(1)}%` : `Extension ${(ratio * 100).toFixed(1)}%`;
    }

    return {
      ratio,
      price: Math.round(price * 10) / 10,
      label
    };
  });

  return {
    swingHigh: { date: highDate, price: highPrice },
    swingLow: { date: lowDate, price: lowPrice },
    direction: isUptrend ? 'RETRACEMENT_OF_UPTREND' : 'RETRACEMENT_OF_DOWNTREND',
    levels
  };
}

/**
 * Automatically compute Fibonacci levels using the most recent confirmed swing points
 */
export function autoCalculateFibonacci(
  bars: OHLCVBar[],
  leftBars = 5,
  rightBars = 5,
  ratios = STANDARD_FIBONACCI_RATIOS
): FibonacciAnalysisResult | null {
  const { swingHighs, swingLows } = detectSwingPoints(bars, leftBars, rightBars);
  if (swingHighs.length === 0 || swingLows.length === 0) return null;

  const lastHigh = swingHighs[swingHighs.length - 1];
  const lastLow = swingLows[swingLows.length - 1];

  return computeFibonacciLevels(
    lastHigh.price,
    lastHigh.date,
    lastLow.price,
    lastLow.date,
    ratios
  );
}
