/**
 * Technical Indicator Research Laboratory Type System
 * Standardized interfaces, categories, parameter specifications, and normalized outputs
 * for historical research, backtesting, and feature engineering.
 */

export type Timeframe = 'INTRADAY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type IndicatorCategory =
  | 'Trend'
  | 'Momentum'
  | 'Volatility'
  | 'Volume'
  | 'Price Structure'
  | 'Moving Averages'
  | 'Oscillators'
  | 'Support/Resistance'
  | 'Market Breadth'
  | 'Statistical/Quantitative'
  | 'Candlestick Patterns'
  | 'Chart Patterns';

export type ImplementationStatus = 'IMPLEMENTED' | 'NOT_IMPLEMENTED' | 'PLANNED';

export interface ParameterDefinition {
  name: string;
  type: 'number' | 'string' | 'boolean';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description: string;
}

export interface OutputFieldDefinition {
  key: string;
  label: string;
  type: 'number' | 'string' | 'boolean';
  format?: 'price' | 'percent' | 'decimal' | 'integer' | 'status';
  description?: string;
}

export interface IndicatorDefinition<P = Record<string, any>> {
  id: string; // e.g., 'SMA', 'EMA', 'RSI', 'MACD', 'BOLLINGER'
  name: string;
  category: IndicatorCategory;
  description: string;
  inputs: Array<'open' | 'high' | 'low' | 'close' | 'volume' | 'turnover'>;
  parameters: Record<string, ParameterDefinition>;
  outputFields: OutputFieldDefinition[];
  timeframeCompatibility: Timeframe[];
  warmupPeriod: number | ((params: P) => number);
  calculationVersion: string; // e.g. 'v1.0'
  sourceNotes: string;
  implementationStatus: ImplementationStatus;
  overlayOnPrice: boolean; // True: plotted on price axis; False: separate sub-panel
}

/**
 * Normalized Single-Bar Indicator Output
 * Strictly timestamped and guaranteed lookahead-bias free
 */
export interface IndicatorResult {
  symbol: string;
  timeframe: Timeframe;
  timestamp: string; // YYYY-MM-DD or ISO timestamp
  indicatorId: string;
  parameters: Record<string, any>;
  values: Record<string, number | string | boolean | null>;
  isReady: boolean; // False if historical bar count < warmup period
  warmupRemaining: number; // Number of additional bars required before calculation is valid
  calculationVersion: string;
}

/**
 * Full timeseries calculation output for backtesting and charting
 */
export interface IndicatorSeriesResult {
  symbol: string;
  timeframe: Timeframe;
  indicatorId: string;
  parameters: Record<string, any>;
  calculationVersion: string;
  series: IndicatorResult[];
}

/**
 * Standard OHLCV Bar input interface
 */
export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover?: number;
}

/**
 * Price Structure Output Types
 */
export type TrendDirection = 'BULLISH' | 'BEARISH' | 'SIDEWAYS' | 'NEUTRAL';

export interface SwingPoint {
  index: number;
  date: string;
  price: number;
  type: 'SWING_HIGH' | 'SWING_LOW';
  barsSincePrevious: number;
}

export interface PriceStructureResult {
  trend: TrendDirection;
  swingHighs: SwingPoint[];
  swingLows: SwingPoint[];
  higherHigh: boolean;
  higherLow: boolean;
  lowerHigh: boolean;
  lowerLow: boolean;
  currentRangeHigh: number;
  currentRangeLow: number;
  isConsolidating: boolean;
  rangePercentage: number;
  recentBreakout?: {
    type: 'BREAKOUT_HIGH' | 'BREAKDOWN_LOW';
    breakPrice: number;
    barDate: string;
  };
  recentGaps: Array<{
    date: string;
    type: 'GAP_UP' | 'GAP_DOWN';
    gapSize: number;
    gapPercent: number;
    isFilled: boolean;
  }>;
}

/**
 * Support & Resistance Engine Models
 */
export type SRType = 'SUPPORT' | 'RESISTANCE' | 'DYNAMIC_MA' | 'PIVOT' | 'FIBONACCI';
export type SRSource = 'SWING_POINT' | 'PREVIOUS_HIGH_LOW' | 'MOVING_AVERAGE' | 'PIVOT_POINT' | 'FIBONACCI_LEVEL' | 'VOLUME_NODE';

export interface SupportResistanceLevel {
  id: string;
  price: number;
  type: SRType;
  strength: number; // 0 to 100 based on test count, recency, and rejection sharpness
  source: SRSource;
  firstDetected: string;
  lastTested: string;
  testCount: number;
  notes?: string;
}

/**
 * Pivot Points Output
 */
export type PivotSystemType = 'STANDARD' | 'FIBONACCI' | 'CAMARILLA' | 'WOODIE' | 'DEMARK';

export interface PivotPointsResult {
  system: PivotSystemType;
  p: number;
  r1?: number;
  r2?: number;
  r3?: number;
  r4?: number;
  s1?: number;
  s2?: number;
  s3?: number;
  s4?: number;
}

/**
 * Fibonacci Analysis Models
 */
export interface FibonacciAnalysisResult {
  swingHigh: { date: string; price: number };
  swingLow: { date: string; price: number };
  direction: 'RETRACEMENT_OF_UPTREND' | 'RETRACEMENT_OF_DOWNTREND';
  levels: Array<{
    ratio: number;
    price: number;
    label: string;
  }>;
}

/**
 * Candlestick Pattern Engine Models
 */
export interface CandlestickPatternDetection {
  pattern: string; // e.g. 'HAMMER', 'ENGULFING_BULLISH', 'DOJI', etc.
  category: 'SINGLE' | 'DOUBLE' | 'TRIPLE';
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number; // 0-100 mathematical structural match confidence (NOT future prediction)
  barIndex: number;
  date: string;
  conditionsMet: string[];
}

/**
 * Chart Pattern Framework Models
 */
export interface ChartPatternDetection {
  patternId: string;
  patternName: string;
  status: ImplementationStatus;
  detected: boolean;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number; // 0-100 based on geometric alignment
  startDate?: string;
  endDate?: string;
  keyLevels?: {
    neckline?: number;
    target?: number;
    invalidation?: number;
    upperBoundary?: number;
    lowerBoundary?: number;
  };
  notes: string;
}

/**
 * Statistical & Quantitative Features
 */
export interface StatisticalFeaturesResult {
  returns: number[];
  logReturns: number[];
  rollingMean: (number | null)[];
  rollingMedian: (number | null)[];
  rollingStdDev: (number | null)[];
  rollingVariance: (number | null)[];
  zScore: (number | null)[];
  percentileRank: (number | null)[];
  rateOfChange: (number | null)[];
  autocorrelationLag1: number | null;
  annualizedVolatility: number | null;
  downsideDeviation: number | null;
  maxDrawdown: number;
  currentDrawdown: number;
}
