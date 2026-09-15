/**
 * Phase 4B — Evidence Aggregation & Decision Intelligence Engine Types
 * Standardized contracts for evidence items, multi-factor reliability,
 * alignment & conflict detection, historical conditional probabilities,
 * eligibility criteria, risk-reward parameters, and explainability.
 * Strictly separates EVIDENCE, CONFIDENCE, CONDITION, UNCERTAINTY, CONFLICT, and RISK.
 */

import { HoldingHorizon, MarketRegimeType, SampleSizeTier } from './historicalResearch';
import { LiquidityClassification, LifecycleStatus, EvidenceGrade } from './researchValidation';
import { TrendState, MomentumState, VolumeTurnoverState, RelativeStrengthState } from './currentStateEngine';

// ==========================================
// 1. Evidence Categories & Directions
// ==========================================

export type EvidenceCategory =
  | 'TECHNICAL'
  | 'MOMENTUM'
  | 'TREND'
  | 'VOLUME'
  | 'VOLATILITY'
  | 'PRICE_STRUCTURE'
  | 'MARKET_REGIME'
  | 'MARKET_BREADTH'
  | 'SECTOR'
  | 'RELATIVE_STRENGTH'
  | 'FUNDAMENTAL'
  | 'BROKER'
  | 'LIQUIDITY'
  | 'STATISTICAL'
  | 'HISTORICAL'
  | 'RISK'
  | 'EXECUTION'
  | 'DATA_QUALITY';

export type EvidenceDirection =
  | 'BULLISH'
  | 'BEARISH'
  | 'NEUTRAL'
  | 'MIXED'
  | 'UNKNOWN';

// ==========================================
// 2. Standardized Evidence Contract
// ==========================================

export interface EvidenceHistoricalSupport {
  observations: number;
  winRate?: number;
  expectancy?: number;
  medianReturn?: number;
  wilsonLower?: number;
  wilsonUpper?: number;
  evidenceGrade?: EvidenceGrade;
}

export interface EvidenceItem {
  id: string;
  category: EvidenceCategory;
  name: string;
  direction: EvidenceDirection;
  strength: number;          // 0 to 1 (magnitude of signal)
  reliability: number;       // 0 to 1 (statistical robustness of indicator/source)
  confidence: number;        // 0 to 1 (strength * reliability weighted)
  rawValue?: number | string | boolean | null;
  formattedValue?: string;
  referenceValue?: number | string | null;
  historicalSupport?: EvidenceHistoricalSupport;
  sourceEngine: string;
  asOfDate: string;
  dataQuality: 'VALID' | 'WARNING' | 'INVALID';
  explanation: string;
  isRedundant?: boolean;
  redundancyGroup?: string;
  collinearWith?: string[];
}

export interface NormalizedEvidenceItem extends EvidenceItem {
  normalizedScore: number;   // Continuous score from -1.0 (max bearish) to +1.0 (max bullish)
  zScore?: number | null;
  percentileRank?: number | null;
}

// ==========================================
// 3. Evidence Alignment & Consensus
// ==========================================

export type AlignmentClassification =
  | 'STRONG_CONVERGENT_BULLISH'
  | 'MODERATE_CONVERGENT_BULLISH'
  | 'NEUTRAL_OR_MIXED'
  | 'MODERATE_CONVERGENT_BEARISH'
  | 'STRONG_CONVERGENT_BEARISH'
  | 'CONFLICTED';

export interface CategoryConsensus {
  category: EvidenceCategory;
  direction: EvidenceDirection;
  weight: number;
  effectiveScore: number;    // -1 to +1
  itemCount: number;
  independentCount: number;
  itemNames: string[];
}

export interface EvidenceAlignmentResult {
  overallAlignment: AlignmentClassification;
  alignmentScore: number;    // 0 to 1 (degree of agreement among independent sources)
  netDirectionalScore: number; // -1 to +1 (aggregate directional bias)
  bullishEvidenceCount: number;
  bearishEvidenceCount: number;
  neutralEvidenceCount: number;
  independentEvidenceCount: number;
  redundantItemCount: number;
  categoryBreakdown: Record<EvidenceCategory, CategoryConsensus>;
  confluenceNotes: string[];
}

// ==========================================
// 4. Evidence Conflicts & Contradictions
// ==========================================

export type ConflictType =
  | 'DIRECT_CONTRADICTION'    // e.g. Strong Trend Bullish vs Overbought Exhaustion Bearish
  | 'CROSS_DIMENSIONAL'       // e.g. Technical Bullish vs Fundamental Bearish
  | 'EXECUTION_FRICTION'      // e.g. Strong Setup vs Illiquid ADT20 / High Slippage
  | 'VALUATION_TREND'         // e.g. Breakout price vs Overstretched PE
  | 'REGIME_DECOUPLING';      // e.g. Stock Bullish vs NEPSE Distribution Regime

export type ConflictSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export interface ConflictParty {
  id: string;
  name: string;
  category: EvidenceCategory;
  direction: EvidenceDirection;
  details: string;
}

export interface EvidenceConflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  evidenceA: ConflictParty;
  evidenceB: ConflictParty;
  title: string;
  explanation: string;
  impactOnDecision: string;
}

export interface EvidenceConflictResult {
  hasCriticalConflict: boolean;
  conflictCount: number;
  conflicts: EvidenceConflict[];
  summary: string;
}

// ==========================================
// 5. Historical Comparables & Outcomes
// ==========================================

export interface HistoricalComparableCondition {
  id: string;
  date: string;
  symbol: string;
  marketRegime: MarketRegimeType;
  sectorName: string;
  similarityScore: number;    // 0 to 1
  matchedFeatures: string[];
  entryPrice: number;
  forwardReturns: Record<HoldingHorizon, number>;
  mfe: Record<HoldingHorizon, number>;
  mae: Record<HoldingHorizon, number>;
  targetHit?: boolean;
  stopHit?: boolean;
}

// ==========================================
// 6. Probability & Multi-Horizon Distributions
// ==========================================

export interface HorizonProbabilityDistribution {
  horizon: HoldingHorizon;
  observations: number;
  positiveCount: number;
  pPositive: number;          // 0 to 100 (%)
  pNegative: number;          // 0 to 100 (%)
  pTargetReached: number;     // 0 to 100 (%)
  pStopReached: number;       // 0 to 100 (%)
  meanReturn: number;
  medianReturn: number;
  downsidePercentile10: number;
  downsidePercentile25: number;
  upsidePercentile75: number;
  upsidePercentile90: number;
  mfeMean: number;
  maeMean: number;
  expectancy: number;
  profitFactor: number | null;
  wilsonInterval: {
    lower: number;
    upper: number;
    confidenceLevel: number;
  };
  bayesianSmoothed: {
    smoothedRate: number;
    credibleLower: number;
    credibleUpper: number;
  };
  sampleTier: SampleSizeTier;
  isReliable: boolean;
  warningText?: string;
}

export interface DecisionProbabilityResult {
  asOfDate: string;
  symbol: string;
  distributions: Record<HoldingHorizon, HorizonProbabilityDistribution>;
  primaryHorizon: HoldingHorizon;
  sufficientHistoricalSample: boolean;
  caveats: string[];
}

// ==========================================
// 7. Hard Blockers & Decision Eligibility
// ==========================================

export type DecisionEligibilityStatus =
  | 'ELIGIBLE'
  | 'ELIGIBLE_WITH_WARNING'
  | 'WATCH'
  | 'BLOCKED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'UNAVAILABLE';

export interface HardBlocker {
  id: string;
  code: string;
  name: string;
  triggered: boolean;
  severity: 'BLOCKER' | 'WARNING';
  details: string;
}

export interface DecisionEligibilityResult {
  status: DecisionEligibilityStatus;
  blockers: HardBlocker[];
  hasHardBlocker: boolean;
  warnings: string[];
  passedCriteria: string[];
  primaryReason: string;
  detailedReasons: string[];
}

// ==========================================
// 8. Risk-Reward Integration
// ==========================================

export interface RiskRewardParameters {
  currentPrice: number;
  recommendedEntryZone: { low: number; high: number };
  suggestedStopLoss: number;
  stopDistancePercent: number;
  target1: number;
  target1Percent: number;
  target2: number;
  target2Percent: number;
  riskRewardRatio: number;
  estimatedSlippagePercent: number;
  estimatedBrokerageRoundTripPercent: number;
  estimatedNetExpectancyPercent: number;
  liquidityAbsorptionScore: number; // 0-100 (capacity to enter/exit without distortion)
}

// ==========================================
// 9. Decision Explanation Engine Contract
// ==========================================

export interface DecisionExplanation {
  headline: string;
  whyInteresting: string[];
  whyCautionRequired: string[];
  evidenceAlignmentSummary: string;
  historicalBasisSummary: string;
  primaryRiskFactor: string;
  verdictRationale: string;
}

// ==========================================
// 10. Market-Wide Evidence Ranking
// ==========================================

export interface MarketWideEvidenceRankingItem {
  symbol: string;
  companyName: string;
  sector: string;
  compositeScore: number;     // Multi-factor evidence ranking (0 to 100)
  evidenceAlignment: AlignmentClassification;
  alignmentScore: number;
  historicalSupportObservations: number;
  researchGrade: EvidenceGrade;
  fiveDayProb: number;
  fiveDayWilsonCI: { lower: number; upper: number };
  twentyDayProb: number;
  twentyDayWilsonCI: { lower: number; upper: number };
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  liquidityRating: string;
  marketRegime: MarketRegimeType;
  eligibilityStatus: DecisionEligibilityStatus;
  primaryBlockerOrWarning?: string;
}

// ==========================================
// 11. Unified Decision Assessment Container (Audit Trail)
// ==========================================

export interface DecisionAuditSnapshot {
  inputSnapshotHash: string;
  dataProvenance: string;
  totalObservationsMatched: number;
  isPointInTimeGuaranteed: boolean;
  engineVersion: string;
  probabilityEngineVersion: string;
  calculationTimestamp: string;
}

export interface DecisionAssessment {
  id: string;
  symbol: string;
  companyName: string;
  sectorName: string;
  asOfDate: string;
  dataSource: string;
  engineVersion: string;             // '4B_v1'
  probabilityEngineVersion: string;  // '4B_PROB_v1'
  calculationTimestamp: string;
  evidenceItems: NormalizedEvidenceItem[];
  alignment: EvidenceAlignmentResult;
  conflicts: EvidenceConflictResult;
  probability: DecisionProbabilityResult;
  comparables: HistoricalComparableCondition[];
  eligibility: DecisionEligibilityResult;
  riskReward: RiskRewardParameters;
  explanation: DecisionExplanation;
  researchEvidenceGrade: EvidenceGrade;
  researchGradeExplanation: string;
  audit: DecisionAuditSnapshot;
}

// ==========================================
// 12. Alert-Ready Architecture Event Contracts (Phase 5 Foundation)
// ==========================================

export type DecisionIntelligenceEventType =
  | 'EVIDENCE_ALIGNMENT_CHANGED'
  | 'HISTORICAL_EDGE_CHANGED'
  | 'RISK_STATUS_CHANGED'
  | 'MARKET_REGIME_CHANGED'
  | 'SECTOR_REGIME_CHANGED'
  | 'TRADE_ELIGIBILITY_CHANGED'
  | 'DATA_SOURCE_CHANGED';

export interface DecisionIntelligenceEvent {
  id: string;
  type: DecisionIntelligenceEventType;
  symbol: string;
  asOfDate: string;
  previousValue: string | number | boolean | null;
  currentValue: string | number | boolean | null;
  reason: string;
  timestamp: string;
}
