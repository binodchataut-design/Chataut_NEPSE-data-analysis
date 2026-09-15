/**
 * Phase 3C — Feature Selection & Conditional Probability Engine Types
 * Standardized interfaces for research features, normalization methods,
 * discretization bins, redundancy analysis, Information Coefficient (IC),
 * conditional probabilities, Bayesian smoothing, and historical similarity matching.
 */

import { Timeframe } from './technicalIndicators';
import {
  HoldingHorizon,
  MarketRegimeType,
  SampleSizeTier,
  WilsonConfidenceInterval,
  EntryModel,
  TargetStopParams,
  TransactionCostModel,
  DistributionStats
} from './historicalResearch';

export type FeatureCategory =
  | 'TREND'
  | 'MOMENTUM'
  | 'VOLUME'
  | 'VOLATILITY'
  | 'PRICE_STRUCTURE'
  | 'RELATIVE_STRENGTH'
  | 'MARKET_REGIME'
  | 'SECTOR_REGIME'
  | 'LIQUIDITY'
  | 'STATISTICAL'
  | 'CROSS_SECTIONAL'
  | 'COMPOSITE';

export type NormalizationMethod =
  | 'RAW'
  | 'MIN_MAX'
  | 'Z_SCORE'
  | 'ROLLING_Z_SCORE'
  | 'PERCENTILE_RANK'
  | 'CROSS_SECTIONAL_PERCENTILE'
  | 'DISTANCE_FROM_MA'
  | 'ATR_NORMALIZED_DISTANCE';

export interface FeatureBin {
  id: string;
  label: string;
  min: number;
  max: number;
  inclusiveMin: boolean;
  inclusiveMax: boolean;
  description: string;
}

export interface FeatureBinDefinition {
  featureId: string;
  bins: FeatureBin[];
}

export interface FeatureDefinition {
  featureId: string;
  name: string;
  category: FeatureCategory;
  sourceIndicator: string;
  description: string;
  formulaDescription: string;
  normalizationMethod: NormalizationMethod;
  defaultBins: FeatureBin[];
  parameters: Record<string, number | string | boolean>;
  calculationVersion: string;
  isCrossSectional: boolean;
}

export interface FeatureObservation {
  featureId: string;
  name: string;
  category: FeatureCategory;
  sourceIndicator: string;
  parameters: Record<string, number | string | boolean>;
  value: number | null;
  normalizedValue: number | null;
  binId?: string;
  binLabel?: string;
  timestamp: string;
  symbol: string;
  timeframe: Timeframe;
  barIndex: number;
  calculationVersion: string;
}

export interface FeatureRedundancyPair {
  featureA: string;
  featureB: string;
  featureAName: string;
  featureBName: string;
  categoryA: FeatureCategory;
  categoryB: FeatureCategory;
  pearsonCorrelation: number;
  spearmanCorrelation: number;
  sampleSize: number;
  redundancyFlag: boolean; // true if |corr| >= 0.70
  interpretation: string;
}

export interface FeaturePerformanceMetrics {
  featureId: string;
  featureName: string;
  category: FeatureCategory;
  horizon: HoldingHorizon;
  binId?: string;
  binLabel?: string;
  observationsCount: number;
  winRate: number; // %
  wilsonCI: WilsonConfidenceInterval;
  meanReturn: number;
  medianReturn: number;
  expectancy: number;
  profitFactor: number | null;
  mfeMean: number;
  maeMean: number;
  informationCoefficient: number; // Spearman rank correlation between feature value & forward return
  icPValue: number;
  effectSize: number; // Cohen's d vs baseline
  benjaminiHochbergSignificant: boolean;
  multipleTestingAdjustedPVal: number;
}

export interface FeatureStabilityMetrics {
  featureId: string;
  featureName: string;
  byYear: {
    year: string;
    observations: number;
    winRate: number;
    meanReturn: number;
    ic: number;
  }[];
  byRegime: {
    regime: MarketRegimeType;
    observations: number;
    winRate: number;
    meanReturn: number;
  }[];
  bySector: {
    sector: string;
    observations: number;
    winRate: number;
    meanReturn: number;
  }[];
  decayRollingWindows: {
    windowLabel: string; // '2022-2023', '2024-2025', etc.
    winRate: number;
    meanReturn: number;
    ic: number;
    sampleSize: number;
  }[];
  stabilityScore: number; // 0-100 score based on consistency across periods
  isPersistent: boolean;
}

export type OutcomeType =
  | 'POSITIVE_RETURN'
  | 'RETURN_GT_2'
  | 'RETURN_GT_5'
  | 'RETURN_GT_10'
  | 'TARGET_BEFORE_STOP'
  | 'MFE_GT_5'
  | 'MAE_LT_MINUS_3';

export interface OutcomeDefinition {
  type: OutcomeType;
  label: string;
  thresholdPercent?: number;
  description: string;
}

export interface FeatureCondition {
  featureId: string;
  comparator: '>' | '<' | '>=' | '<=' | '==' | 'BETWEEN' | 'IN_BIN';
  value?: number;
  minValue?: number;
  maxValue?: number;
  binId?: string;
  label: string;
}

export interface ConditionTree {
  operator: 'AND' | 'OR';
  conditions: (FeatureCondition | ConditionTree)[];
}

export interface ConditionalProbabilityQuery {
  queryId: string;
  conditionTree: ConditionTree;
  outcome: OutcomeDefinition;
  horizon: HoldingHorizon;
  entryModel: EntryModel;
  universe: 'ALL_NEPSE' | 'SECTOR' | 'SINGLE';
  selectedSymbol?: string;
  selectedSector?: string;
  timeframe: Timeframe;
  dateRange?: { start?: string; end?: string };
  partition: 'TRAIN' | 'VALIDATION' | 'TEST' | 'FULL';
  costs: TransactionCostModel;
  targetStop?: TargetStopParams;
}

export interface ConditionalProbabilityResult {
  researchRunId: string;
  query: ConditionalProbabilityQuery;
  conditionsLabel: string;
  symbolUniverse: string;
  timeframe: Timeframe;
  horizon: HoldingHorizon;
  entryModel: EntryModel;
  totalUniverseBars: number;
  observations: number;
  positiveCount: number;
  negativeCount: number;
  rawProbability: number; // % (k / n)
  smoothedProbability: number; // % Beta-Binomial: (k + alpha) / (n + alpha + beta)
  bayesianPrior: { alpha: number; beta: number; priorMean: number };
  confidenceInterval: WilsonConfidenceInterval;
  meanReturn: number;
  medianReturn: number;
  mfe: { mean: number; median: number };
  mae: { mean: number; median: number };
  expectancy: number;
  profitFactor: number | null;
  sampleTier: SampleSizeTier;
  smallSampleWarning: boolean;
  multipleTestingWarning: {
    hypothesesTestedCount: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    message: string;
  };
  regimeBreakdown: {
    regime: MarketRegimeType;
    observations: number;
    probability: number;
    meanReturn: number;
  }[];
  sectorBreakdown: {
    sector: string;
    observations: number;
    probability: number;
    meanReturn: number;
  }[];
  timeStability: {
    period: string;
    observations: number;
    probability: number;
    meanReturn: number;
  }[];
  datasetVersion: string;
  featureCalculationVersion: string;
}

export interface HistoricalSimilarityMatch {
  observationId: string;
  symbol: string;
  date: string;
  similarityScore: number; // 0-100% based on normalized Euclidean / Gower distance
  matchedConditions: string[];
  unmatchedConditions: string[];
  marketRegime: MarketRegimeType;
  forwardReturn: number;
  mfe: number;
  mae: number;
  entryPrice: number;
}

export interface CurrentConditionComparison {
  symbol: string;
  asOfDate: string;
  currentFeatures: Record<string, { value: number | null; binLabel?: string }>;
  matchedConditionsCount: number;
  totalConditionsCount: number;
  matchesCount: number;
  historicalMatches: HistoricalSimilarityMatch[];
  probabilityResult: ConditionalProbabilityResult;
}

export interface ProbabilityCalibrationBucket {
  predictedBinMin: number; // e.g. 50
  predictedBinMax: number; // e.g. 60
  predictedMean: number;   // e.g. 55%
  observedFrequency: number; // e.g. 53.8%
  sampleCount: number;
  deviation: number;       // observed - predicted
}

export interface FeatureSelectionCriterion {
  minSampleSize: number;
  minWinRate: number; // e.g. 52%
  minMeanReturn: number; // e.g. 0.5%
  minStabilityScore: number; // e.g. 60
  maxCorrelationThreshold: number; // e.g. 0.70
  minEffectSize: number; // e.g. 0.15
  requireTrainAndValidationEdge: boolean;
}

export interface FeatureSelectionReportItem {
  featureId: string;
  featureName: string;
  category: FeatureCategory;
  sampleSize: number;
  trainWinRate: number;
  trainMeanReturn: number;
  validationWinRate: number;
  validationMeanReturn: number;
  testWinRate?: number;
  testMeanReturn?: number;
  stabilityScore: number;
  maxCorrelationWithSelected: number;
  selected: boolean;
  rejectionReason?: string;
}
