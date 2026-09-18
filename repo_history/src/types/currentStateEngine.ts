/**
 * Phase 4A — Current Market & Stock State Engine Types
 * Deterministic, point-in-time state contracts for NEPSE market, sector, and individual stocks.
 * Strictly separates STATE ("What is happening now?") from DECISION ("What should we do?").
 */

import { MarketRegimeType } from './historicalResearch';
import { DataSourceMode } from './index';
import {
  LiquidityClassification,
  LifecycleStatus,
  DataCoverageScore,
  PriceMode,
  UniverseMode
} from './researchValidation';

// ==========================================
// 1. Classification Enums & Types
// ==========================================

export type TrendState = 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'UNKNOWN';

export type MomentumState =
  | 'STRONG_POSITIVE'
  | 'POSITIVE'
  | 'NEUTRAL'
  | 'NEGATIVE'
  | 'STRONG_NEGATIVE'
  | 'UNKNOWN';

export type MomentumLevel =
  | 'EXTREME_HIGH'
  | 'HIGH'
  | 'MODERATE'
  | 'LOW'
  | 'EXTREME_LOW'
  | 'UNKNOWN';

export type MomentumDirection = 'RISING' | 'FLAT' | 'FALLING' | 'UNKNOWN';

export type VolumeTurnoverState =
  | 'EXPANDING'
  | 'NORMAL'
  | 'CONTRACTING'
  | 'UNKNOWN';

export type ActivityLevel =
  | 'HIGH_ACTIVITY'
  | 'NORMAL_ACTIVITY'
  | 'LOW_ACTIVITY'
  | 'UNKNOWN';

export type VolumePriceRelationship =
  | 'PRICE_UP_VOLUME_EXPANDING'
  | 'PRICE_UP_VOLUME_CONTRACTING'
  | 'PRICE_DOWN_VOLUME_EXPANDING'
  | 'PRICE_DOWN_VOLUME_CONTRACTING'
  | 'PRICE_FLAT_VOLUME_EXPANDING'
  | 'PRICE_FLAT_VOLUME_CONTRACTING'
  | 'UNKNOWN';

export type MarketVolatilityState =
  | 'VERY_LOW'
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'VERY_HIGH'
  | 'UNKNOWN';

export type StockVolatilityState =
  | 'COMPRESSED'
  | 'NORMAL'
  | 'EXPANDING'
  | 'EXTREME'
  | 'UNKNOWN';

export type VolatilityTransition =
  | 'COMPRESSION_TO_EXPANSION'
  | 'EXPANSION_TO_CONTRACTION'
  | 'STABLE'
  | 'UNKNOWN';

export type RelativeStrengthState =
  | 'STRONG_OUTPERFORMER'
  | 'OUTPERFORMER'
  | 'INLINE'
  | 'UNDERPERFORMER'
  | 'STRONG_UNDERPERFORMER'
  | 'UNKNOWN';

export type SectorLeadershipState =
  | 'LEADING'
  | 'IMPROVING'
  | 'NEUTRAL'
  | 'WEAKENING'
  | 'LAGGING'
  | 'UNKNOWN';

export type PriceStructureState =
  | 'HIGHER_HIGH'
  | 'LOWER_HIGH'
  | 'HIGHER_LOW'
  | 'LOWER_LOW'
  | 'RANGE_BOUND'
  | 'BREAKOUT'
  | 'BREAKDOWN'
  | 'UNKNOWN';

export type MarketBreadthState =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'NEUTRAL'
  | 'WEAK'
  | 'VERY_WEAK'
  | 'UNKNOWN';

export type StateDataQualityGrade =
  | 'GOOD'
  | 'ACCEPTABLE'
  | 'LIMITED'
  | 'POOR'
  | 'INVALID'
  | 'UNKNOWN';

// ==========================================
// 2. Structural & Detail Interfaces
// ==========================================

export interface TrendStructure {
  aboveSMA20: boolean | null;
  aboveSMA50: boolean | null;
  aboveSMA200: boolean | null;
  sma20AboveSMA50: boolean | null;
  sma50AboveSMA200: boolean | null;
  sma20Rising: boolean | null;
  sma50Rising: boolean | null;
  sma200Rising: boolean | null;
  priceVsEMA20: boolean | null;
  priceVsEMA50: boolean | null;
}

export interface SupportResistanceContext {
  nearestSupport: number | null;
  nextSupport: number | null;
  nearestResistance: number | null;
  nextResistance: number | null;
  distanceToSupportPercent: number | null;
  distanceToResistancePercent: number | null;
  distanceToSupportATR: number | null;
  distanceToResistanceATR: number | null;
  atrValue: number | null;
}

export interface CrossSectionalRank {
  return20DPercentile: number | null;
  return60DPercentile: number | null;
  volumePercentile: number | null;
  turnoverPercentile: number | null;
  relativeStrengthPercentile: number | null;
  momentumPercentile: number | null;
  volatilityPercentile: number | null;
  universeSize: number;
}

export interface StateTransition {
  dimension:
    | 'TREND'
    | 'MOMENTUM'
    | 'VOLUME'
    | 'VOLATILITY'
    | 'RELATIVE_STRENGTH'
    | 'REGIME'
    | 'LIQUIDITY';
  previousState: string;
  currentState: string;
  transitionDate: string;
  description: string;
}

// ==========================================
// 3. Market State Contract
// ==========================================

export interface IndexStateRecord {
  symbol: string;
  name: string;
  close: number;
  change: number;
  changePercent: number;
  turnover: number;
  volume: number;
  trend: TrendState;
  sma20: number | null;
  sma50: number | null;
}

export interface MarketBreadthMetrics {
  advancingStocks: number;
  decliningStocks: number;
  unchangedStocks: number;
  totalTraded: number;
  advanceDeclineRatio: number;
  percentAbove20MA: number;
  percentAbove50MA: number;
  percentAbove200MA: number;
  newHighs: number;
  newLows: number;
  breadthState: MarketBreadthState;
}

export interface MarketTurnoverMetrics {
  todayTurnover: number;
  averageTurnover20: number;
  averageTurnover60: number;
  turnoverRatio20: number;
  turnoverRatio60: number;
  turnoverState: VolumeTurnoverState;
  activityLevel: ActivityLevel;
}

export interface MarketVolatilityMetrics {
  currentVolatility: number;
  atr14: number | null;
  atrPercent: number | null;
  realizedVolatility20: number;
  volatilityPercentile: number;
  volatilityState: MarketVolatilityState;
}

export interface CurrentMarketState {
  asOfDate: string;
  indexStates: IndexStateRecord[];
  primaryIndex: IndexStateRecord;
  breadth: MarketBreadthMetrics;
  turnover: MarketTurnoverMetrics;
  volatility: MarketVolatilityMetrics;
  trend: {
    shortTerm: TrendState;
    mediumTerm: TrendState;
    longTerm: TrendState;
    structure: TrendStructure;
  };
  momentum: {
    state: MomentumState;
    level: MomentumLevel;
    direction: MomentumDirection;
    rsi14: number | null;
    macdHist: number | null;
    adx14: number | null;
  };
  regime: MarketRegimeType;
  regimeConfidence: number;
  regimeAsOfDate: string;
  regimeVersion: string;
  previousRegime: MarketRegimeType | null;
  regimeTransition: string;
  dataQuality: StateDataQualityGrade;
  evidence: string[];
  warnings: string[];
  calculationVersions: {
    stateEngineVersion: string;
    datasetVersion: string;
    asOfDate: string;
  };
}

// ==========================================
// 4. Sector State Contract
// ==========================================

export interface CurrentSectorState {
  sectorId: string;
  sectorName: string;
  asOfDate: string;
  sectorIndexSymbol: string;
  sectorIndexClose: number;
  sectorReturn1D: number;
  sectorReturn5D: number;
  sectorReturn20D: number;
  sectorReturn60D: number;
  relativeStrengthVsNepse: {
    ratio: number;
    returnDiff20D: number;
    returnDiff60D: number;
    state: RelativeStrengthState;
  };
  trend: {
    shortTerm: TrendState;
    mediumTerm: TrendState;
    state: TrendState;
    aboveSMA20: boolean | null;
    aboveSMA50: boolean | null;
  };
  momentum: {
    state: MomentumState;
    rsi14: number | null;
  };
  breadth: {
    advancing: number;
    declining: number;
    unchanged: number;
    total: number;
    advanceDeclineRatio: number;
  };
  turnoverRatio: number;
  turnoverState: VolumeTurnoverState;
  volatility: MarketVolatilityState;
  leadershipState: SectorLeadershipState;
  dataQuality: StateDataQualityGrade;
  evidence: string[];
  warnings: string[];
}

// ==========================================
// 5. Stock State Contract
// ==========================================

export interface StockPriceMetrics {
  open: number;
  high: number;
  low: number;
  close: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  turnover: number;
}

export interface StockReturnMetrics {
  return1D: number;
  return5D: number;
  return20D: number;
  return60D: number;
  returnYTD: number | null;
}

export interface StockTrendMetrics {
  shortTerm: TrendState;
  mediumTerm: TrendState;
  longTerm: TrendState;
  structure: TrendStructure;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema20: number | null;
  ema50: number | null;
  adx14: number | null;
  supertrendDirection: string;
  evidence: string[];
}

export interface StockMomentumMetrics {
  state: MomentumState;
  level: MomentumLevel;
  direction: MomentumDirection;
  rsi14: number | null;
  macd: {
    macd: number | null;
    signal: number | null;
    hist: number | null;
  };
  adx14: number | null;
  roc10: number | null;
  stochasticK: number | null;
  evidence: string[];
}

export interface StockVolumeMetrics {
  todayVolume: number;
  todayTurnover: number;
  averageVolume20: number;
  averageVolume60: number;
  averageTurnover20: number;
  volumeVs20DayAverage: number;
  volumeVs60DayAverage: number;
  turnoverVs20DayAverage: number;
  obvTrend: 'RISING' | 'FLAT' | 'FALLING' | 'UNKNOWN';
  cmfState: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'UNKNOWN';
  mfiState: 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN';
  volumeState: VolumeTurnoverState;
  volumePriceRelationship: VolumePriceRelationship;
  evidence: string[];
}

export interface StockVolatilityMetrics {
  atr14: number | null;
  atrPercent: number | null;
  realizedVolatility20: number;
  realizedVolatility60: number;
  bollingerBandwidth: number | null;
  state: StockVolatilityState;
  transition: VolatilityTransition;
  evidence: string[];
}

export interface CurrentStockState {
  symbol: string;
  companyName: string;
  sectorId: string | null;
  sectorName: string | null;
  hasFullMetadata?: boolean;
  asOfDate: string;
  price: StockPriceMetrics;
  returns: StockReturnMetrics;
  trend: StockTrendMetrics;
  momentum: StockMomentumMetrics;
  volume: StockVolumeMetrics;
  volatility: StockVolatilityMetrics;
  priceStructure: {
    state: PriceStructureState;
    higherHigh: boolean;
    higherLow: boolean;
    lowerHigh: boolean;
    lowerLow: boolean;
    isConsolidating: boolean;
    breakoutType?: string;
    evidence: string[];
  };
  supportResistance: SupportResistanceContext;
  relativeStrength: {
    vsNepse: {
      returnDiff5D: number;
      returnDiff20D: number;
      returnDiff60D: number;
      state: RelativeStrengthState;
    };
    vsSector: {
      returnDiff5D: number;
      returnDiff20D: number;
      returnDiff60D: number;
      state: RelativeStrengthState;
    };
    evidence: string[];
  };
  crossSectionalRank: CrossSectionalRank;
  liquidity: {
    adt20: number;
    adt60: number;
    tradedDayRatio: number;
    zeroVolumeRatio: number;
    liquidityPercentile: number;
    classification: LiquidityClassification;
    participationCapacity: string;
    status: string;
    warnings: string[];
  };
  lifecycle: {
    status: LifecycleStatus;
    listingDate: string;
    suspensionStatus: string;
    warnings: string[];
  };
  corporateActionContext: {
    recentCorporateAction: string | null;
    actionType: string | null;
    actionDate: string | null;
    distortionRisk: string;
    dataConfidence: string;
    warnings: string[];
  };
  dataQuality: {
    overall: StateDataQualityGrade;
    priceDataQuality: string;
    liquidityCoverage: string;
    corporateActionCoverage: string;
    issues: string[];
  };
  evidence: string[];
  warnings: string[];
  limitations: string[];
}

// ==========================================
// 6. Central State Snapshot Contract
// ==========================================

export interface StateAvailability {
  isAvailable: boolean;
  status: 'AVAILABLE' | 'STATE_UNAVAILABLE';
  reason?: string;
  timestamp?: string;
  dataSourceMode: DataSourceMode;
}

export interface CurrentStateSnapshot {
  symbol: string;
  asOfDate: string;
  mode: 'LATEST' | 'HISTORICAL_SNAPSHOT';
  marketState: CurrentMarketState;
  sectorState: CurrentSectorState;
  stockState: CurrentStockState;
  stateTransitions: StateTransition[];
  calculationVersions: {
    stateEngineVersion: string;
    indicatorVersion: string;
    featureVersion: string;
    marketRegimeVersion: string;
    datasetVersion: string;
  };
  causalityAudit: {
    cutoffDate: string;
    futureDataIncluded: boolean;
    zeroLookaheadVerified: boolean;
    auditMessage: string;
  };
  warnings: string[];
  limitations: string[];
  stateAvailability?: StateAvailability;
}

export type CurrentMarketAndStockSnapshot = CurrentStateSnapshot;
