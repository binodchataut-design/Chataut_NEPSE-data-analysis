/**
 * Phase 3D — NEPSE Data Integrity, Market Reality & Robustness Validation Types
 * Strict, transparent contracts for:
 * 1. Data Quality & Gap Analysis
 * 2. Corporate Actions & Price Discontinuity
 * 3. Listing Lifecycle & Survivorship Bias
 * 4. Liquidity & Execution Realism
 * 5. Parameter Perturbation & Statistical Robustness
 * 6. Research Validity Gate & Evidence Contract for Phase 4
 */

import { HoldingHorizon, MarketRegimeType, EntryModel } from './historicalResearch';
import { OHLCVBar } from './technicalIndicators';

// ==========================================
// 1. Validity Gate & Evidence Statuses
// ==========================================
export type ValidityStatus =
  | 'VALID'
  | 'CONDITIONALLY_VALID'
  | 'WEAK_EVIDENCE'
  | 'INVALID'
  | 'INSUFFICIENT_DATA';

export type EvidenceGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type CheckResultStatus = 'PASS' | 'WARNING' | 'FAIL' | 'UNKNOWN';

// ==========================================
// 2. Data Quality & Market Calendar
// ==========================================
export type PriceCheckSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface PriceCheckIssue {
  code: string;
  severity: PriceCheckSeverity;
  date: string;
  field?: string;
  message: string;
  detectedValue?: number | string;
  expectedCondition?: string;
}

export type CalendarSource = 'KNOWN' | 'USER_SUPPLIED' | 'MOCK' | 'UNKNOWN';

export type DayClassification =
  | 'NORMAL_NON_TRADING_DAY'
  | 'EXPECTED_TRADING_DAY'
  | 'MISSING_TRADING_DATA'
  | 'SUSPENDED_SECURITY'
  | 'DATA_PROVIDER_GAP';

export interface DataCoverageScore {
  symbol: string;
  firstAvailableDate: string;
  lastAvailableDate: string;
  observationsCount: number;
  expectedObservations: number;
  missingObservations: number;
  longestGapSessions: number;
  averageGapSessions: number;
  coveragePercent: number;
  calendarSource: CalendarSource;
  qualityStatus: ValidityStatus;
  statusNotes: string;
  issues: PriceCheckIssue[];
}

// ==========================================
// 3. Corporate Actions & Price Continuity
// ==========================================
export type CorporateActionType =
  | 'BONUS'
  | 'RIGHTS'
  | 'CASH_DIVIDEND'
  | 'STOCK_SPLIT'
  | 'MERGER'
  | 'ACQUISITION'
  | 'CAPITAL_ADJUSTMENT'
  | 'LISTING'
  | 'RELISTING'
  | 'DELISTING'
  | 'OTHER'
  | 'UNKNOWN';

export interface CorporateAction {
  id: string;
  symbol: string;
  date: string;
  type: CorporateActionType;
  ratio?: string; // e.g., '1:0.15' for 15% bonus
  cashAmount?: number; // NPR per share
  source: 'NEPSE_OFFICIAL' | 'COMPANY_ANNOUNCEMENT' | 'USER_SUPPLIED' | 'ESTIMATED' | 'UNKNOWN';
  confidence: 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN';
  notes?: string;
}

export type PriceMode = 'RAW_UNADJUSTED' | 'ADJUSTED' | 'UNKNOWN';

export type DistortionClassification =
  | 'LIKELY_CORPORATE_ACTION'
  | 'POSSIBLE_CORPORATE_ACTION'
  | 'LIKELY_MARKET_MOVE'
  | 'UNKNOWN';

export interface DiscontinuityDiagnostic {
  symbol: string;
  date: string;
  previousClose: number;
  open: number;
  close: number;
  overnightGapPercent: number;
  volumeRatioVs20MA: number;
  classification: DistortionClassification;
  matchedAction?: CorporateAction;
  notes: string;
}

// ==========================================
// 4. Listing Lifecycle & Survivorship Bias
// ==========================================
export type LifecycleStatus = 'ACTIVE' | 'SUSPENDED' | 'DELISTED' | 'RELISTED' | 'UNKNOWN';

export interface SuspensionPeriod {
  startDate: string;
  endDate?: string;
  reason: string;
}

export interface ListingLifecycle {
  symbol: string;
  companyName: string;
  listingDate: string;
  delistingDate?: string;
  suspensionPeriods: SuspensionPeriod[];
  relistingDate?: string;
  currentStatus: LifecycleStatus;
  lifecycleStatusSource: 'NEPSE_OFFICIAL' | 'ESTIMATED' | 'UNKNOWN';
}

export type UniverseMode =
  | 'ALL_HISTORICAL_SECURITIES'
  | 'ACTIVE_ONLY'
  | 'ACTIVE_AND_SUSPENDED'
  | 'USER_DEFINED';

export type SurvivorshipRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export interface SurvivorshipDiagnostic {
  universeMode: UniverseMode;
  totalHistoricalUniverseCount: number;
  activeUniverseCount: number;
  delistedUniverseCount: number;
  suspendedCount: number;
  survivorshipBiasRisk: SurvivorshipRisk;
  explanation: string;
}

export interface ShortHistoryWarning {
  symbol: string;
  totalBars: number;
  warmupBarsRequired: number;
  usableBars: number;
  isShortHistory: boolean;
  message: string;
}

// ==========================================
// 5. Liquidity Realism
// ==========================================
export type LiquidityClassification =
  | 'VERY_LOW'
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'VERY_HIGH'
  | 'UNKNOWN';

export interface LiquidityMetrics {
  symbol: string;
  averageTurnover20: number; // NPR
  averageTurnover60: number; // NPR
  averageVolume20: number; // Shares
  averageVolume60: number; // Shares
  tradedDayRatio: number; // percentage of market sessions where stock actually traded
  zeroVolumeRatio: number; // percentage of days with 0 volume
  liquidityPercentile: number; // 0..100 across universe
  classification: LiquidityClassification;
  assumedExecutionRealistic: boolean;
}

export interface LiquidityFilterConfig {
  enabled: boolean;
  minAvgTurnoverNpr: number; // e.g. 500,000 NPR
  minAvgVolume: number; // e.g. 1,000 shares
  minTradedDaysRatio: number; // e.g. 0.85 (85%)
  maxZeroVolumeRatio: number; // e.g. 0.05 (5%)
  minLiquidityPercentile: number; // e.g. 20th percentile
}

export interface MarketParticipationDiagnostic {
  positionValueNpr: number;
  averageDailyTurnoverNpr: number;
  participationRatePercent: number;
  realismLevel: 'HIGH' | 'MODERATE' | 'LOW' | 'UNREALISTIC';
  warningMessage?: string;
}

// ==========================================
// 6. Execution Reality & Circuit Limits
// ==========================================
export type SlippageModelType =
  | 'NO_SLIPPAGE'
  | 'FIXED_BPS'
  | 'LIQUIDITY_ADJUSTED'
  | 'USER_DEFINED';

export type StopExecutionModelType =
  | 'STOP_AT_LEVEL'
  | 'STOP_AT_NEXT_AVAILABLE_PRICE'
  | 'CONSERVATIVE_GAP_MODEL'
  | 'AMBIGUOUS';

export type SameBarCollisionModel =
  | 'STOP_FIRST'
  | 'TARGET_FIRST'
  | 'CONSERVATIVE'
  | 'AMBIGUOUS';

export type StopTargetTriggerOutcome =
  | 'STOP_TRIGGERED'
  | 'TARGET_TRIGGERED'
  | 'BOTH_TOUCHED_SAME_BAR'
  | 'NO_TRIGGER'
  | 'GAP_THROUGH_STOP'
  | 'UNKNOWN_EXECUTION';

export interface CircuitRule {
  effectiveFrom: string;
  effectiveTo?: string;
  maxDailyChangePercent: number; // e.g. 10.0% for NEPSE normal daily circuit
  source: 'NEPSE_BYLAWS' | 'ESTIMATED' | 'UNKNOWN';
  confidence: 'HIGH' | 'MODERATE' | 'UNKNOWN';
}

export interface ExecutionRealityConfig {
  entryModel: EntryModel;
  slippageModel: SlippageModelType;
  baseSlippageBps: number; // e.g. 10 bps (0.10%)
  liquidityPenaltyFactor: number;
  stopExecutionModel: StopExecutionModelType;
  sameBarCollisionRule: SameBarCollisionModel;
  includeNepseStatutoryFees: boolean;
  brokeragePercent: number; // e.g. 0.35%
  sebonFeePercent: number; // 0.015%
  dpFeeNpr: number; // 25 NPR
  capitalGainsTaxPercent: number; // 5.0%
}

export interface BacktestRealityAudit {
  dataCoverage: CheckResultStatus;
  corporateActionCoverage: CheckResultStatus;
  universeIntegrity: CheckResultStatus;
  survivorshipRisk: CheckResultStatus;
  liquidityRealism: CheckResultStatus;
  executionRealism: CheckResultStatus;
  slippageAssumption: CheckResultStatus;
  transactionCostModel: CheckResultStatus;
  circuitRuleCoverage: CheckResultStatus;
  stopExecutionModel: CheckResultStatus;
  sameBarAmbiguityImpact: CheckResultStatus;
  outOfSampleIntegrity: CheckResultStatus;
  sameBarAmbiguityCount: number;
  sameBarAmbiguityPercent: number;
  gapThroughStopCount: number;
  auditNotes: string[];
}

// ==========================================
// 7. Robustness Testing Engine
// ==========================================
export interface PerturbationPoint {
  parameterName: string;
  perturbedValue: number;
  observations: number;
  winRate: number;
  expectancy: number;
  meanReturn: number;
  isBaseline: boolean;
}

export interface ParameterStabilityAnalysis {
  parameterName: string;
  baselineValue: number;
  points: PerturbationPoint[];
  stabilityScore: number; // 0..100
  stabilityLevel: 'HIGH' | 'MODERATE' | 'LOW' | 'UNSTABLE';
  isMonotonicOrSmooth: boolean;
  notes: string;
}

export interface RegimeRobustnessAnalysis {
  regimesTested: {
    regime: MarketRegimeType;
    sampleSize: number;
    winRate: number;
    meanReturn: number;
    expectancy: number;
    profitFactor: number | null;
  }[];
  classification: 'REGIME_ROBUST' | 'REGIME_DEPENDENT' | 'INSUFFICIENT_DATA';
  explanation: string;
}

export interface TimePeriodRobustnessAnalysis {
  periods: {
    periodLabel: string;
    sampleSize: number;
    winRate: number;
    meanReturn: number;
    expectancy: number;
    informationCoefficient: number;
  }[];
  trendClassification:
    | 'CONSISTENT'
    | 'DECAYING'
    | 'RECENTLY_IMPROVING'
    | 'RECENTLY_WEAKENING'
    | 'REGIME_DEPENDENT'
    | 'INSUFFICIENT_DATA';
  explanation: string;
}

export interface CrossSectionalRobustnessAnalysis {
  numberOfStocks: number;
  numberOfObservations: number;
  medianStockWinRate: number;
  meanStockWinRate: number;
  bestStock: { symbol: string; winRate: number; sample: number };
  worstStock: { symbol: string; winRate: number; sample: number };
  positiveStockRatioPercent: number;
  scopeClassification: 'BROAD_MARKET' | 'SECTOR_SPECIFIC' | 'STOCK_SPECIFIC';
  sectorBreakdown: {
    sectorName: string;
    stockCount: number;
    sampleSize: number;
    winRate: number;
    meanReturn: number;
  }[];
}

export interface BootstrapEstimate {
  metricName: string;
  pointEstimate: number;
  bootstrapMean: number;
  bootstrapLower95: number;
  bootstrapUpper95: number;
  resamplesCount: number;
  randomSeed: number;
}

export interface PermutationCheckResult {
  observedStatistic: number; // e.g. difference in win rate from 50%
  permutationPValue: number; // p-value from shuffled outcome labels
  isStatisticallyDistinguishable: boolean;
  permutationsCount: number;
  randomSeed: number;
  explanation: string;
}

export interface MultipleTestingOverfittingAudit {
  hypothesesExploredCount: number;
  positiveFindingsCount: number;
  multipleTestingAdjustedPValThreshold: number;
  overfittingRisk: 'LOW_OVERFITTING_RISK' | 'MODERATE_OVERFITTING_RISK' | 'HIGH_OVERFITTING_RISK' | 'UNKNOWN';
  warnings: string[];
}

export interface WalkForwardWindow {
  windowIndex: number;
  trainPeriod: string;
  validatePeriod: string;
  testPeriod: string;
  trainWinRate: number;
  validateWinRate: number;
  testWinRate: number;
  testExpectancy: number;
  passed: boolean;
}

export interface WalkForwardRobustnessResult {
  windows: WalkForwardWindow[];
  successRatePercent: number;
  medianTestWinRate: number;
  medianTestExpectancy: number;
  worstWindowIndex: number;
  bestWindowIndex: number;
  isConsistent: boolean;
  notes: string;
}

export interface PerformanceDecayAnalysis {
  earlyPeriod: { label: string; winRate: number; expectancy: number; sample: number };
  middlePeriod: { label: string; winRate: number; expectancy: number; sample: number };
  recentPeriod: { label: string; winRate: number; expectancy: number; sample: number };
  decayStatus: 'STABLE' | 'DECAYING' | 'DISAPPEARING' | 'IMPROVING' | 'INCONCLUSIVE';
  decayExplanation: string;
}

export interface SensitivityScenarioResult {
  scenarioName: string;
  sampleSize: number;
  winRate: number;
  expectancy: number;
  meanReturn: number;
  profitFactor: number | null;
  maxDrawdownPercent: number;
  status: 'VIABLE' | 'MARGINAL' | 'DEGRADED';
}

export interface RobustnessMatrixItem {
  testName: string;
  category: 'STATISTICS' | 'MARKET_REALISM' | 'TIME_STABILITY' | 'EXECUTION' | 'INTEGRITY';
  result: CheckResultStatus;
  metricSummary: string;
  details: string;
}

// ==========================================
// 8. Research Validity Gate & Evidence Contract
// ==========================================
export interface ResearchValidityResult {
  status: ValidityStatus;
  evidenceGrade: EvidenceGrade;
  blockingIssues: string[];
  warnings: string[];
  passedChecks: string[];
  assumptions: string[];
  limitations: string[];
  recommendedNextAction: string;
}

export interface AuditLogRecord {
  runId: string;
  timestamp: string;
  datasetVersion: string;
  provider: string;
  priceMode: PriceMode;
  universe: UniverseMode;
  dateRange: string;
  symbolsCount: number;
  featureVersion: string;
  indicatorVersion: string;
  costModelSummary: string;
  slippageModelSummary: string;
  liquidityFilterActive: boolean;
  randomSeed: number;
  trainPeriod: string;
  validationPeriod: string;
  testPeriod: string;
}

/**
 * Clean, immutable evidence object contract for the future Phase 4 Composite Decision Engine
 */
export interface ResearchEvidence {
  evidenceId: string;
  symbol: string;
  conditionDescription: string;
  horizon: HoldingHorizon;

  // Sample & Distributional Edge
  sampleSize: number;
  winRate: number;
  winRateCI: { lower: number; upper: number };
  meanReturn: number;
  medianReturn: number;
  expectancy: number;
  profitFactor: number | null;
  mfeMean: number;
  maeMean: number;

  // Out-of-Sample Validation
  trainResult: { sample: number; winRate: number; expectancy: number };
  validationResult: { sample: number; winRate: number; expectancy: number };
  testResult: { sample: number; winRate: number; expectancy: number };

  // Multi-Dimensional Breakdown
  regimeResults: { regime: MarketRegimeType; sample: number; winRate: number; expectancy: number }[];
  timeResults: { periodLabel: string; sample: number; winRate: number; expectancy: number }[];
  sectorResults: { sectorName: string; sample: number; winRate: number }[];

  // Robustness Indicators
  parameterStability: 'HIGH' | 'MODERATE' | 'LOW' | 'UNSTABLE';
  costSensitivity: 'COST_RESILIENT' | 'COST_SENSITIVE' | 'INSUFFICIENT_DATA';
  liquiditySensitivity: 'LIQUIDITY_INDEPENDENT' | 'LIQUIDITY_DEPENDENT' | 'UNKNOWN';
  survivorshipRisk: SurvivorshipRisk;
  corporateActionStatus: 'VERIFIED' | 'PARTIAL' | 'UNKNOWN';
  dataQualityStatus: ValidityStatus;

  // Final Gate Output
  robustnessStatus: CheckResultStatus;
  validityStatus: ValidityStatus;
  evidenceGrade: EvidenceGrade;

  // Audit Trails
  auditLog: AuditLogRecord;
  assumptions: string[];
  warnings: string[];
  limitations: string[];
}
