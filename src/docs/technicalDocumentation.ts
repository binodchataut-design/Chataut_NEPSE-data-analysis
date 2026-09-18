/**
 * Authoritative Technical Indicator Reference Documentation
 * Covers mathematical formulations, parameter ranges, warmup requirements,
 * numerical edge cases, and NEPSE-specific market microstructure limitations.
 */

import { IndicatorCategory } from '../types/technicalIndicators';

export interface IndicatorDoc {
  id: string;
  name: string;
  category: IndicatorCategory;
  formulaLatex: string;
  calculationSteps: string[];
  parameters: Array<{ name: string; default: any; validRange: string; description: string }>;
  warmupBars: string;
  edgeCases: string[];
  nepseMarketCaveats: string[];
  interpretationNotice: string;
}

export const TECHNICAL_INDICATOR_DOCS: Record<string, IndicatorDoc> = {
  SMA: {
    id: 'SMA',
    name: 'Simple Moving Average',
    category: 'Moving Averages',
    formulaLatex: 'SMA_t = \\frac{1}{N} \\sum_{i=0}^{N-1} P_{t-i}',
    calculationSteps: [
      'Take closing prices for the trailing N trading sessions.',
      'Sum all N closing prices.',
      'Divide sum by N.'
    ],
    parameters: [
      { name: 'period', default: 20, validRange: '2 - 500', description: 'Lookback window size in bars' }
    ],
    warmupBars: 'N bars (indices 0 to N-2 return null with isReady = false).',
    edgeCases: [
      'Series shorter than N: all bars return null.',
      'Flat prices (no movement): standard deviation is 0, but SMA remains well-defined.'
    ],
    nepseMarketCaveats: [
      'On +10% or -10% circuit limit days where volume is low, equal-weighted SMA treats the locked price identically to a high-turnover session.'
    ],
    interpretationNotice: 'SMA represents the arithmetic mean price. It lags fast momentum changes.'
  },
  EMA: {
    id: 'EMA',
    name: 'Exponential Moving Average',
    category: 'Moving Averages',
    formulaLatex: 'EMA_t = \\alpha \\cdot P_t + (1 - \\alpha) \\cdot EMA_{t-1}, \\quad \\alpha = \\frac{2}{N + 1}',
    calculationSteps: [
      'Calculate smoothing factor alpha = 2 / (N + 1).',
      'Seed the first valid EMA value at index N-1 using the N-period SMA.',
      'For every subsequent bar, weight current price by alpha and previous EMA by (1 - alpha).'
    ],
    parameters: [
      { name: 'period', default: 20, validRange: '2 - 500', description: 'Smoothing period' }
    ],
    warmupBars: 'N bars for initial SMA seed; stabilizes with high accuracy after 3 * N bars.',
    edgeCases: [
      'Missing or null price points abort recursion.',
      'Single large gap moves can skew EMA sharply until decaying.'
    ],
    nepseMarketCaveats: [
      'Rights/bonus share book-closure price adjustments cause sharp artificial cliffs if historical bars are unadjusted.'
    ],
    interpretationNotice: 'EMA responds more rapidly to recent price impulses than SMA.'
  },
  RSI: {
    id: 'RSI',
    name: 'Relative Strength Index',
    category: 'Momentum',
    formulaLatex: 'RSI = 100 - \\frac{100}{1 + RS}, \\quad RS = \\frac{RMA(\\text{UpGains}, N)}{RMA(\\text{DownLosses}, N)}',
    calculationSteps: [
      'Calculate 1-bar price delta: Delta = Close[t] - Close[t-1].',
      'Separate into UpGains (max(0, Delta)) and DownLosses (max(0, -Delta)).',
      'Smooth gains and losses using Wilder RMA (Running Moving Average, alpha = 1/N).',
      'Compute Relative Strength RS = AvgGain / AvgLoss.',
      'Normalize to 0-100 oscillator.'
    ],
    parameters: [
      { name: 'period', default: 14, validRange: '2 - 100', description: 'Lookback periods for Wilder smoothing' }
    ],
    warmupBars: 'N + 1 bars.',
    edgeCases: [
      'When AvgLoss = 0 (14 consecutive green bars), RS is infinite; clamped mathematically to RSI = 100.',
      'When AvgGain = 0 (14 consecutive red bars), RSI = 0.',
      'Zero change (Delta = 0) treats gain and loss as 0.'
    ],
    nepseMarketCaveats: [
      'During aggressive NEPSE speculative runs (especially in low-float hydro or micro-cap finance sectors), RSI can stay pegged > 80 for weeks. Never treat 70 as an automatic sell signal without volume confirmation.'
    ],
    interpretationNotice: 'Oscillator measuring momentum velocity. Default thresholds (70/30) are not universal trading triggers.'
  },
  MACD: {
    id: 'MACD',
    name: 'Moving Average Convergence Divergence',
    category: 'Trend',
    formulaLatex: 'MACD = EMA_{12}(C) - EMA_{26}(C), \\quad \\text{Signal} = EMA_9(MACD), \\quad \\text{Hist} = MACD - \\text{Signal}',
    calculationSteps: [
      'Compute 12-period fast EMA of closing prices.',
      'Compute 26-period slow EMA of closing prices.',
      'Calculate MACD line = FastEMA - SlowEMA.',
      'Compute 9-period EMA of the MACD line to generate the Signal line.',
      'Compute Histogram = MACD line - Signal line.'
    ],
    parameters: [
      { name: 'fastPeriod', default: 12, validRange: '2 - 50', description: 'Fast EMA period' },
      { name: 'slowPeriod', default: 26, validRange: '5 - 100', description: 'Slow EMA period' },
      { name: 'signalPeriod', default: 9, validRange: '2 - 50', description: 'Signal line smoothing' }
    ],
    warmupBars: 'slowPeriod + signalPeriod bars (approx 35 bars).',
    edgeCases: [
      'Insufficient bars return null for signal and histogram.',
      'Large price magnitude stocks have naturally wider nominal MACD spreads than low-priced stocks.'
    ],
    nepseMarketCaveats: [
      'NEPSE macro bull/bear cycles often feature prolonged divergence phases where histogram contracts while index continues up.'
    ],
    interpretationNotice: 'Trend and momentum combination. Zero-line crosses reflect medium-term regime shifts.'
  },
  BOLLINGER: {
    id: 'BOLLINGER',
    name: 'Bollinger Bands',
    category: 'Volatility',
    formulaLatex: 'Upper/Lower = SMA_N \\pm (k \\cdot \\sigma_N), \\quad \\text{Bandwidth} = \\frac{Upper - Lower}{SMA} \\cdot 100',
    calculationSteps: [
      'Compute N-period Simple Moving Average of Close (Middle Band).',
      'Compute N-period sample standard deviation of Close (sigma).',
      'Upper Band = Middle + k * sigma.',
      'Lower Band = Middle - k * sigma.',
      'PercentB (%B) = (Close - Lower) / (Upper - Lower).'
    ],
    parameters: [
      { name: 'period', default: 20, validRange: '3 - 100', description: 'Moving average window' },
      { name: 'stdDevMultiplier', default: 2.0, validRange: '0.5 - 5.0', description: 'Standard deviation multiplier' }
    ],
    warmupBars: 'N bars.',
    edgeCases: [
      'When price is locked in circuit for 20 days, stdDev = 0, Upper = Middle = Lower, %B defaults to 0.5.',
      'Denominator guard prevents division by zero.'
    ],
    nepseMarketCaveats: [
      'Volatility contractions (Bollinger Squeeze, Bandwidth < 4%) in NEPSE often precede explosive multi-day breakout waves.'
    ],
    interpretationNotice: 'Measures relative volatility and high/low extremes relative to recent variance.'
  },
  ATR: {
    id: 'ATR',
    name: 'Average True Range',
    category: 'Volatility',
    formulaLatex: 'TR = \\max(H - L, |H - C_{t-1}|, |L - C_{t-1}|), \\quad ATR = RMA(TR, N)',
    calculationSteps: [
      'For each bar, True Range is the maximum of: current high minus current low, absolute value of current high minus previous close, absolute value of current low minus previous close.',
      'Smooth the True Range series using Wilder RMA over N periods.'
    ],
    parameters: [
      { name: 'period', default: 14, validRange: '2 - 50', description: 'ATR Wilder smoothing period' }
    ],
    warmupBars: 'N bars.',
    edgeCases: [
      'First bar has no previous close; TR defaults to (High - Low).'
    ],
    nepseMarketCaveats: [
      'Gapping between sessions (e.g. following dividend or budget announcements) expands TR significantly without requiring wide intraday wicks.'
    ],
    interpretationNotice: 'Non-directional measure of pure volatility in currency units or percentage terms.'
  }
};
