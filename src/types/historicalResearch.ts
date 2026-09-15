/**
 * Historical Research & Backtesting Laboratory Types
 * Supports temporal causality, forward return engines, MFE/MAE excursions,
 * target/stop simulations, and statistical distributions.
 */

import { Timeframe } from './technicalIndicators';

export type EntryModel = 'SIGNAL_CLOSE' | 'NEXT_OPEN' | 'NEXT_CLOSE';

export type HoldingHorizon = 1 | 3 | 5 | 10 | 20 | 30 | 60;

export type MarketRegimeType = 'BULL' | 'BEAR' | 'SIDEWAYS' | 'HIGH_VOLATILITY' | 'LOW_VOLATILITY';

export type SampleSizeTier = 'VERY_LOW' | 'LOW' | 'LIMITED' | 'MODERATE' | 'LARGER';

export type ConditionComparator =
  | '>'
  | '<'
  | '>='
  | '<='
  | '=='
  | 'CROSSES_ABOVE'
  | 'CROSSES_BELOW'
  | 'INCREASING'
  | 'DECREASING';

export interface SingleCondition {
  id: string;
  indicator: string; // e.g. 'RSI', 'SMA', 'MACD', 'VOLUME', 'ADX', 'BOLLINGER', 'CLOSE'
  field: string; // e.g. 'rsi', 'sma', 'histogram', 'volume', 'adx', 'close'
  comparator: ConditionComparator;
  thresholdType: 'VALUE' | 'INDICATOR_FIELD';
  thresholdValue?: number;
  targetIndicator?: string;
  targetField?: string;
  multiplier?: number; // e.g. 1.5 * VolumeMA20
  description: string;
}

export interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: (SingleCondition | ConditionGroup)[];
}

export interface TargetStopParams {
  targetPercent: number; // e.g. 10 (%)
  stopLossPercent: number; // e.g. 5 (%)
  maxHoldingBars: number; // e.g. 20 sessions
  ambiguousBarRule: 'CONSERVATIVE_STOP' | 'MARK_AMBIGUOUS';
}

export interface TransactionCostModel {
  includeCosts: boolean;
  brokeragePercent: number; // e.g. 0.35%
  sebonFeePercent: number; // e.g. 0.015%
  dpFeeNpr: number; // e.g. 25 NPR per trade
  capitalGainsTaxPercent: number; // e.g. 5.0% or 7.5% on net gains
  slippagePercent: number; // e.g. 0.1%
}

export interface ForwardOutcome {
  horizon: HoldingHorizon;
  exitPrice: number;
  exitDate: string;
  returnAbsolute: number;
  returnPercent: number;
  netReturnPercent: number;
  isPositive: boolean;
}

export interface ExcursionOutcome {
  horizon: HoldingHorizon;
  favorableAbsolute: number;
  favorablePercent: number;
  adverseAbsolute: number;
  adversePercent: number;
}

export interface SimulationResult {
  outcome: 'TARGET_HIT' | 'STOP_HIT' | 'MAX_TIME_EXPIRED' | 'AMBIGUOUS';
  exitPrice: number;
  exitDate: string;
  barsHeld: number;
  returnPercent: number;
  netReturnPercent: number;
  isWinner: boolean;
}

export interface ResearchObservation {
  id: string;
  symbol: string;
  companyId: string;
  timestamp: string;
  barIndex: number;
  timeframe: Timeframe;
  close: number;
  volume: number;
  marketRegime: MarketRegimeType;
  sector: string;
  features: Record<string, number | string | boolean | null>;
  signalConditions: string[];
  entryModel: EntryModel;
  entryPrice: number;
  entryDate: string;
  forwardOutcomes: Record<number, ForwardOutcome>;
  mfe: Record<number, ExcursionOutcome>;
  mae: Record<number, ExcursionOutcome>;
  simulation?: SimulationResult;
  calculationVersion: string;
  dataVersion: string;
}

export interface DistributionStats {
  count: number;
  mean: number;
  median: number;
  p25: number;
  p50: number;
  p75: number;
  min: number;
  max: number;
  stdDev: number;
  skewness: number;
}

export interface WilsonConfidenceInterval {
  rate: number;
  lower: number;
  upper: number;
  confidenceLevel: number; // 0.95
}

export interface EquityCurvePoint {
  index: number;
  date: string;
  symbol: string;
  equity: number;
  peakEquity: number;
  drawdownPercent: number;
  tradeReturnPercent: number;
}

export interface DrawdownMetrics {
  maxDrawdownPercent: number;
  avgDrawdownPercent: number;
  longestLosingStreak: number;
  longestWinningStreak: number;
  currentStreak: { type: 'WIN' | 'LOSS'; count: number };
  recoveryBarsMax: number;
  equityCurve: EquityCurvePoint[];
}

export interface SubgroupAnalysis {
  category: string;
  observations: number;
  winRate: number;
  meanReturn: number;
  medianReturn: number;
  profitFactor: number | null;
}

export interface ResearchRunConfig {
  runId: string;
  createdAt: string;
  datasetVersion: string;
  indicatorVersions: Record<string, string>;
  universe: 'SINGLE' | 'SECTOR' | 'ALL_NEPSE';
  selectedSymbol?: string;
  selectedSector?: string;
  timeframe: Timeframe;
  dateRange: { start?: string; end?: string };
  periodSplit: 'FULL' | 'TRAIN_VAL_TEST' | 'BY_YEAR';
  trainEndDate?: string;
  valEndDate?: string;
  entryModel: EntryModel;
  horizons: HoldingHorizon[];
  targetStop?: TargetStopParams;
  costs: TransactionCostModel;
  conditionTree: ConditionGroup;
  conditionLabel: string;
}

export interface ResearchResult {
  runConfig: ResearchRunConfig;
  totalUniverseBars: number;
  observationsCount: number;
  sampleTier: SampleSizeTier;
  smallSampleWarning: boolean;
  multipleTestingWarning: boolean;
  winRate: number; // based on primary chosen horizon or target/stop
  confidenceInterval: WilsonConfidenceInterval;
  primaryHorizon: HoldingHorizon;
  meanReturn: number;
  medianReturn: number;
  expectancy: number; // (winProb * avgWin) - (lossProb * avgLoss)
  expectancyRatio: number | null; // (winProb * avgWin) / (lossProb * avgLoss)
  profitFactor: number | null; // gross profits / gross losses
  grossProfits: number;
  grossLosses: number;
  riskRewardRatio: number; // avg MFE / avg MAE
  distributionByHorizon: Record<number, DistributionStats>;
  mfeStats: Record<number, { meanPercent: number; medianPercent: number }>;
  maeStats: Record<number, { meanPercent: number; medianPercent: number }>;
  drawdown: DrawdownMetrics;
  regimeResults: SubgroupAnalysis[];
  sectorResults: SubgroupAnalysis[];
  periodResults: SubgroupAnalysis[];
  observations: ResearchObservation[];
  auditInfo: {
    causalityEnforced: boolean;
    zeroLookAheadVerified: boolean;
    dataDateRange: { earliest: string; latest: string };
  };
}

export interface ParameterSweepItem {
  paramValue: number;
  paramLabel: string;
  observations: number;
  winRate: number;
  meanReturn: number;
  medianReturn: number;
  profitFactor: number | null;
  expectancy: number;
  ciLower: number;
  ciUpper: number;
}

export interface ParameterSweepResult {
  indicator: string;
  parameterName: string;
  testedValues: number[];
  horizon: HoldingHorizon;
  items: ParameterSweepItem[];
  multipleTestingWarning: string;
}
