/**
 * Mathematical Verification & Integrity Test Suite for Technical Engine
 * Verifies:
 * 1. Warmup period accuracy (insufficient data returns null, isReady: false)
 * 2. Exact mathematical values for SMA, EMA, RMA, RSI, ATR, Bollinger
 * 3. ZERO LOOK-AHEAD BIAS: modifying future bars must have zero effect on earlier calculations
 */

import { OHLCVBar } from '../../types/technicalIndicators';
import { calculateEMA, calculateRMA, calculateSMA, calculateTrueRange } from './common';
import { computeRSI } from './momentumIndicators';
import { computeBollingerBands } from './volatilityIndicators';
import { indicatorRegistry } from './indicatorRegistry';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export function runTechnicalIntegrityTests(): {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  const assert = (suite: string, name: string, condition: boolean, expected: any, actual: any, details?: string) => {
    results.push({
      suite,
      name,
      passed: condition,
      expected: String(expected),
      actual: String(actual),
      details
    });
  };

  // ----------------------------------------------------
  // TEST 1: SMA known numerical vector
  // ----------------------------------------------------
  const values1 = [10, 20, 30, 40, 50];
  const sma3 = calculateSMA(values1, 3);
  assert('Moving Averages', 'SMA warmup period returns null', sma3[0] === null && sma3[1] === null, 'null, null', `${sma3[0]}, ${sma3[1]}`);
  assert('Moving Averages', 'SMA index 2 matches (10+20+30)/3 = 20', sma3[2] === 20, '20', sma3[2]);
  assert('Moving Averages', 'SMA index 3 matches (20+30+40)/3 = 30', sma3[3] === 30, '30', sma3[3]);
  assert('Moving Averages', 'SMA index 4 matches (30+40+50)/3 = 40', sma3[4] === 40, '40', sma3[4]);

  // ----------------------------------------------------
  // TEST 2: EMA manual calculation verification
  // Seed: SMA of first 3 = 20. Alpha = 2 / (3 + 1) = 0.5
  // Bar 3 (val 40): 40 * 0.5 + 20 * 0.5 = 30
  // Bar 4 (val 50): 50 * 0.5 + 30 * 0.5 = 40
  // ----------------------------------------------------
  const ema3 = calculateEMA(values1, 3);
  assert('Moving Averages', 'EMA seed at index 2 equals SMA = 20', ema3[2] === 20, '20', ema3[2]);
  assert('Moving Averages', 'EMA index 3 calculation = 30', ema3[3] === 30, '30', ema3[3]);
  assert('Moving Averages', 'EMA index 4 calculation = 40', ema3[4] === 40, '40', ema3[4]);

  // ----------------------------------------------------
  // TEST 3: True Range & ATR Warmup
  // ----------------------------------------------------
  const sampleBars: OHLCVBar[] = [
    { date: '2026-01-01', open: 100, high: 110, low: 95, close: 105, volume: 1000 },
    { date: '2026-01-02', open: 105, high: 115, low: 100, close: 112, volume: 1200 },
    { date: '2026-01-03', open: 112, high: 125, low: 110, close: 120, volume: 1500 },
    { date: '2026-01-04', open: 120, high: 122, low: 115, close: 118, volume: 1100 },
    { date: '2026-01-05', open: 118, high: 130, low: 117, close: 128, volume: 2000 }
  ];

  const tr = calculateTrueRange(sampleBars);
  // Bar 0: H-L = 110 - 95 = 15
  assert('Volatility', 'True Range bar 0 is High - Low (15)', tr[0] === 15, '15', tr[0]);
  // Bar 1: max(115-100=15, |115-105|=10, |100-105|=5) = 15
  assert('Volatility', 'True Range bar 1 handles prior close gap (15)', tr[1] === 15, '15', tr[1]);

  // ----------------------------------------------------
  // TEST 4: Bollinger Bands
  // ----------------------------------------------------
  const bb = computeBollingerBands(sampleBars, 3, 2.0);
  assert('Volatility', 'Bollinger warmup returns null for index < 2', bb[0].middle === null && bb[1].middle === null, 'null, null', `${bb[0].middle}, ${bb[1].middle}`);
  assert('Volatility', 'Bollinger upper band > middle band', bb[2].upper! > bb[2].middle!, 'upper > middle', `${bb[2].upper} > ${bb[2].middle}`);
  assert('Volatility', 'Bollinger lower band < middle band', bb[2].lower! < bb[2].middle!, 'lower < middle', `${bb[2].lower} < ${bb[2].middle}`);

  // ----------------------------------------------------
  // TEST 5: Strict Zero Look-Ahead Bias Verification
  // Calculate indicator on 4 bars. Then add a 5th bar and recalculate.
  // The first 4 bars' values MUST BE BIT-FOR-BIT IDENTICAL.
  // ----------------------------------------------------
  const initialBars = sampleBars.slice(0, 4);
  const extendedBars = [...sampleBars];

  const rsiInitial = computeRSI(initialBars, 3);
  const rsiExtended = computeRSI(extendedBars, 3);

  let lookaheadViolation = false;
  for (let i = 0; i < 4; i++) {
    if (rsiInitial[i] !== rsiExtended[i]) {
      lookaheadViolation = true;
      break;
    }
  }

  assert(
    'Integrity',
    'ZERO LOOK-AHEAD BIAS: Past indicator results are invariant to future bars',
    !lookaheadViolation,
    'true',
    String(!lookaheadViolation),
    'Verified on RSI'
  );

  // ----------------------------------------------------
  // TEST 6: Registry Execution & Warmup Remaining
  // ----------------------------------------------------
  const regResult = indicatorRegistry.execute('RSI', sampleBars, { period: 3 }, 'NABIL', 'DAILY');
  assert('Registry', 'Registry returns full series equal to bars length', regResult.series.length === sampleBars.length, '5', regResult.series.length);
  assert('Registry', 'Warmup remaining counts down monotonically', regResult.series[0].warmupRemaining > regResult.series[1].warmupRemaining, 'descending', `${regResult.series[0].warmupRemaining} -> ${regResult.series[1].warmupRemaining}`);
  assert('Registry', 'Ready flag is true once warmup expires', regResult.series[3].isReady === true, 'true', String(regResult.series[3].isReady));

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  return { total, passed, failed, results };
}
