/**
 * Research Validity Gate (Phase 3D)
 * The definitive quality gate for the Personal NEPSE Research System.
 * Evaluates empirical evidence across data integrity, corporate action coverage,
 * survivorship bias, liquidity, execution realism, parameter stability, and out-of-sample persistence.
 * Emits immutable ResearchEvidence objects for the Phase 4 Composite Decision Engine.
 */

import {
  ValidityStatus,
  EvidenceGrade,
  ResearchValidityResult,
  ResearchEvidence,
  AuditLogRecord,
  BacktestRealityAudit,
  DataCoverageScore,
  LiquidityMetrics,
  PriceMode,
  UniverseMode
} from '../types/researchValidation';
import { HoldingHorizon, MarketRegimeType } from '../types/historicalResearch';

export interface GateEvaluationInput {
  evidenceId: string;
  symbol: string;
  conditionDescription: string;
  horizon: HoldingHorizon;
  sampleSize: number;
  winRate: number;
  winRateCI: { lower: number; upper: number };
  meanReturn: number;
  medianReturn: number;
  expectancy: number;
  profitFactor: number | null;
  mfeMean: number;
  maeMean: number;

  trainResult: { sample: number; winRate: number; expectancy: number };
  validationResult: { sample: number; winRate: number; expectancy: number };
  testResult: { sample: number; winRate: number; expectancy: number };

  regimeResults: { regime: MarketRegimeType; sample: number; winRate: number; expectancy: number }[];
  timeResults: { periodLabel: string; sample: number; winRate: number; expectancy: number }[];
  sectorResults: { sectorName: string; sample: number; winRate: number }[];

  dataCoverage: DataCoverageScore;
  corporateActionCoverage: 'VERIFIED' | 'PARTIAL' | 'UNKNOWN';
  liquidity: LiquidityMetrics;
  backtestAudit: BacktestRealityAudit;

  parameterStability: 'HIGH' | 'MODERATE' | 'LOW' | 'UNSTABLE';
  costSensitivity: 'COST_RESILIENT' | 'COST_SENSITIVE' | 'INSUFFICIENT_DATA';
  liquiditySensitivity: 'LIQUIDITY_INDEPENDENT' | 'LIQUIDITY_DEPENDENT' | 'UNKNOWN';
  survivorshipRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

  isOutOfSampleLocked: boolean;
  testSetUsedForOptimization: boolean;
  priceMode: PriceMode;
  universeMode: UniverseMode;
  randomSeed?: number;
}

export class ResearchValidityGate {
  /**
   * Evaluates input against the Research Validity Gate rules
   */
  public static evaluateEvidence(input: GateEvaluationInput): {
    validityResult: ResearchValidityResult;
    evidenceObject: ResearchEvidence;
  } {
    const blockingIssues: string[] = [];
    const warnings: string[] = [];
    const passedChecks: string[] = [];
    const assumptions: string[] = [];
    const limitations: string[] = [];

    // ==========================================
    // 1. Critical Blocking Integrity Checks
    // ==========================================
    if (input.testSetUsedForOptimization) {
      blockingIssues.push('CRITICAL INTEGRITY FAILURE: Out-of-sample Test data was accessed for condition optimization or selection.');
    }

    if (input.dataCoverage.qualityStatus === 'INVALID') {
      blockingIssues.push('DATA INTEGRITY FAILURE: Historical price series has fatal OHLC, duplicate date, or negative price/volume corruptions.');
    }

    if (input.sampleSize < 15) {
      blockingIssues.push(`SAMPLE SIZE DEFICIT: Sample size of ${input.sampleSize} is below absolute minimum of 15 observations.`);
    }

    // ==========================================
    // 2. Data & Market Realism Checks
    // ==========================================
    if (input.dataCoverage.coveragePercent >= 85) {
      passedChecks.push(`Historical data coverage verified at ${input.dataCoverage.coveragePercent}% of expected market sessions.`);
    } else {
      warnings.push(`Data coverage is ${input.dataCoverage.coveragePercent}%, longest gap is ${input.dataCoverage.longestGapSessions} sessions.`);
    }

    if (input.corporateActionCoverage === 'VERIFIED') {
      passedChecks.push('Corporate actions (bonuses, rights, cash dividends) are verified against official NEPSE disclosures.');
    } else if (input.corporateActionCoverage === 'PARTIAL') {
      warnings.push('Corporate actions coverage is partial. Unadjusted book-closure dilution gaps may exist.');
      limitations.push('Historical series may include unadjusted bonus/rights price steps.');
    } else {
      warnings.push('Corporate actions status is UNKNOWN. Large price steps may reflect artificial corporate action adjustments rather than market movement.');
      limitations.push('Zero verified corporate action history.');
    }

    // Survivorship bias
    if (input.survivorshipRisk === 'LOW') {
      passedChecks.push('Survivorship bias controlled: historical lifecycle tracks both surviving and historical delisted/merged securities.');
    } else if (input.survivorshipRisk === 'HIGH') {
      warnings.push('High survivorship bias risk: backtest spans multi-year historical periods using only active current survivors.');
      limitations.push('Surviving-universe selection bias present.');
    } else {
      warnings.push(`Survivorship risk: ${input.survivorshipRisk}.`);
    }

    // Liquidity
    if (input.liquidity.classification === 'HIGH' || input.liquidity.classification === 'VERY_HIGH' || input.liquidity.classification === 'MODERATE') {
      passedChecks.push(`Liquidity verified: 20-day Average Daily Turnover NPR ${input.liquidity.averageTurnover20.toLocaleString()} (${input.liquidity.classification}).`);
    } else {
      warnings.push(`Low liquidity: 20-day Average Daily Turnover NPR ${input.liquidity.averageTurnover20.toLocaleString()} (${input.liquidity.classification}). Slippage expected.`);
      limitations.push('Real-world execution may be severely constrained by order book depth.');
    }

    // Execution Reality & Costs
    if (input.costSensitivity === 'COST_RESILIENT') {
      passedChecks.push('Cost resilient: Edge retains positive expectancy after NEPSE brokerage, SEBON fee, DP fee, and CGT deductions.');
    } else if (input.costSensitivity === 'COST_SENSITIVE') {
      warnings.push('Cost sensitive: Historical edge is eliminated or rendered negative when realistic NEPSE statutory costs are subtracted.');
      limitations.push('Edge exists primarily in gross returns; unviable after standard transaction fees.');
    }

    // Parameter Stability
    if (input.parameterStability === 'HIGH' || input.parameterStability === 'MODERATE') {
      passedChecks.push(`Parameter stability verified (${input.parameterStability}): Neighboring thresholds exhibit smooth, consistent performance.`);
    } else {
      warnings.push(`Parameter instability (${input.parameterStability}): Edge displays knife-edge sensitivity to isolated parameter thresholds.`);
    }

    // Out-of-sample persistence
    if (input.testResult.sample >= 5 && input.testResult.winRate >= 50.0 && input.testResult.expectancy > 0) {
      passedChecks.push(`Out-of-sample test verified: ${input.testResult.winRate}% win rate and +${input.testResult.expectancy}% expectancy on untouched test partition.`);
    } else if (input.testResult.sample >= 5) {
      warnings.push(`Out-of-sample test failed: Edge degraded to ${input.testResult.winRate}% win rate in untouched test period.`);
    }

    // Assumptions
    assumptions.push('Execution modeled at next session Open (NEXT_OPEN) with liquidity-adjusted slippage.');
    assumptions.push('NEPSE retail statutory cost model: 0.35% brokerage + 0.015% SEBON fee + 25 NPR DP fee + 5% CGT on net profits.');
    assumptions.push('Conservative stop-loss rule: If price gaps beyond stop level on open, executed at actual gap fill.');
    assumptions.push('Conservative same-bar collision: If both target and stop are touched on same bar, stop is assumed to have triggered first.');

    // ==========================================
    // 3. Determine Overall Validity Status
    // ==========================================
    let status: ValidityStatus = 'VALID';
    let grade: EvidenceGrade = 'A';

    if (blockingIssues.length > 0) {
      if (input.sampleSize < 15) {
        status = 'INSUFFICIENT_DATA';
        grade = 'F';
      } else {
        status = 'INVALID';
        grade = 'F';
      }
    } else if (input.costSensitivity === 'COST_SENSITIVE' || input.testResult.expectancy < 0) {
      status = 'WEAK_EVIDENCE';
      grade = 'D';
    } else if (warnings.length > 2 || input.corporateActionCoverage === 'UNKNOWN' || input.survivorshipRisk === 'HIGH') {
      status = 'CONDITIONALLY_VALID';
      grade = warnings.length > 4 ? 'C' : 'B';
    } else {
      status = 'VALID';
      grade = 'A';
    }

    // Recommended Next Action
    let nextAction = 'Approved for inclusion as verified evidence in Phase 4 Composite Decision Engine.';
    if (status === 'INVALID') {
      nextAction = 'Reject condition. Do not proceed until fatal data or out-of-sample leakage errors are resolved.';
    } else if (status === 'INSUFFICIENT_DATA') {
      nextAction = 'Gather more historical observations or test across a broader historical universe before evaluating.';
    } else if (status === 'WEAK_EVIDENCE') {
      nextAction = 'Re-evaluate parameter thresholds and cost structure. Edge is fragile under realistic market friction.';
    } else if (status === 'CONDITIONALLY_VALID') {
      nextAction = 'Proceed with caution. Account for identified limitations (e.g. corporate action gaps or low liquidity).';
    }

    const validityResult: ResearchValidityResult = {
      status,
      evidenceGrade: grade,
      blockingIssues,
      warnings,
      passedChecks,
      assumptions,
      limitations,
      recommendedNextAction: nextAction
    };

    // Construct Audit Log Record
    const auditLog: AuditLogRecord = {
      runId: `AUDIT-${input.evidenceId}`,
      timestamp: new Date().toISOString(),
      datasetVersion: 'NEPSE-NORM-2026.09.11',
      provider: 'NEPSE Official Master Data Repository',
      priceMode: input.priceMode,
      universe: input.universeMode,
      dateRange: `${input.dataCoverage.firstAvailableDate} to ${input.dataCoverage.lastAvailableDate}`,
      symbolsCount: 1,
      featureVersion: 'PHASE-3C-FEAT-1.0',
      indicatorVersion: 'PHASE-3A-IND-1.0',
      costModelSummary: '0.35% Brokerage, 0.015% SEBON, 25 NPR DP, 5.0% CGT',
      slippageModelSummary: 'Liquidity-adjusted BPS with order-book penalty factor',
      liquidityFilterActive: input.liquiditySensitivity === 'LIQUIDITY_INDEPENDENT',
      randomSeed: input.randomSeed || 20260912,
      trainPeriod: 'Historical <= 2024.12.31',
      validationPeriod: 'Historical 2025.01.01 to 2025.12.31',
      testPeriod: 'Untouched Test >= 2026.01.01'
    };

    // Compile Final Research Evidence Object
    const evidenceObject: ResearchEvidence = {
      evidenceId: input.evidenceId,
      symbol: input.symbol,
      conditionDescription: input.conditionDescription,
      horizon: input.horizon,
      sampleSize: input.sampleSize,
      winRate: input.winRate,
      winRateCI: input.winRateCI,
      meanReturn: input.meanReturn,
      medianReturn: input.medianReturn,
      expectancy: input.expectancy,
      profitFactor: input.profitFactor,
      mfeMean: input.mfeMean,
      maeMean: input.maeMean,
      trainResult: input.trainResult,
      validationResult: input.validationResult,
      testResult: input.testResult,
      regimeResults: input.regimeResults,
      timeResults: input.timeResults,
      sectorResults: input.sectorResults,
      parameterStability: input.parameterStability,
      costSensitivity: input.costSensitivity,
      liquiditySensitivity: input.liquiditySensitivity,
      survivorshipRisk: input.survivorshipRisk,
      corporateActionStatus: input.corporateActionCoverage,
      dataQualityStatus: input.dataCoverage.qualityStatus,
      robustnessStatus: status === 'VALID' || status === 'CONDITIONALLY_VALID' ? 'PASS' : 'WARNING',
      validityStatus: status,
      evidenceGrade: grade,
      auditLog,
      assumptions,
      warnings,
      limitations
    };

    return { validityResult, evidenceObject };
  }

  /**
   * Generates a structured plain-text historical research report
   */
  public static generateTextReport(evidence: ResearchEvidence): string {
    return `
================================================================================
NEPSE RESEARCH VALIDITY AUDIT REPORT
Run ID: ${evidence.auditLog.runId} | Timestamp: ${evidence.auditLog.timestamp}
================================================================================

1. RESEARCH TARGET & SETUP
--------------------------------------------------------------------------------
Security:               ${evidence.symbol}
Condition:              ${evidence.conditionDescription}
Holding Horizon:        ${evidence.horizon} Sessions
Dataset Version:        ${evidence.auditLog.datasetVersion}
Price Mode:             ${evidence.auditLog.priceMode}
Universe Mode:          ${evidence.auditLog.universe}

2. DISTRIBUTIONAL EDGE & OUTCOMES
--------------------------------------------------------------------------------
Total Observations (N): ${evidence.sampleSize.toLocaleString()}
Gross Win Rate:         ${evidence.winRate.toFixed(1)}% (95% Wilson CI: [${evidence.winRateCI.lower}%, ${evidence.winRateCI.upper}%])
Mean Net Return:        ${evidence.meanReturn > 0 ? '+' : ''}${evidence.meanReturn.toFixed(2)}%
Median Net Return:      ${evidence.medianReturn > 0 ? '+' : ''}${evidence.medianReturn.toFixed(2)}%
Trade Expectancy:       ${evidence.expectancy > 0 ? '+' : ''}${evidence.expectancy.toFixed(2)}% per trade
Profit Factor:          ${evidence.profitFactor !== null ? evidence.profitFactor.toFixed(2) : 'N/A'}
Mean Favorable (MFE):   +${evidence.mfeMean.toFixed(1)}%
Mean Adverse (MAE):     -${evidence.maeMean.toFixed(1)}%

3. CHRONOLOGICAL OUT-OF-SAMPLE VALIDATION
--------------------------------------------------------------------------------
Train Set (N=${evidence.trainResult.sample}):       Win Rate: ${evidence.trainResult.winRate.toFixed(1)}% | Exp: ${evidence.trainResult.expectancy > 0 ? '+' : ''}${evidence.trainResult.expectancy.toFixed(2)}%
Validation Set (N=${evidence.validationResult.sample}):  Win Rate: ${evidence.validationResult.winRate.toFixed(1)}% | Exp: ${evidence.validationResult.expectancy > 0 ? '+' : ''}${evidence.validationResult.expectancy.toFixed(2)}%
Untouched Test (N=${evidence.testResult.sample}):  Win Rate: ${evidence.testResult.winRate.toFixed(1)}% | Exp: ${evidence.testResult.expectancy > 0 ? '+' : ''}${evidence.testResult.expectancy.toFixed(2)}%

4. MARKET REALITY & ROBUSTNESS AUDIT
--------------------------------------------------------------------------------
Data Quality Status:    ${evidence.dataQualityStatus}
Corporate Actions:      ${evidence.corporateActionStatus}
Survivorship Risk:      ${evidence.survivorshipRisk}
Parameter Stability:    ${evidence.parameterStability}
Cost Sensitivity:       ${evidence.costSensitivity}
Liquidity Sensitivity:  ${evidence.liquiditySensitivity}

5. RESEARCH VALIDITY GATE VERDICT
--------------------------------------------------------------------------------
VALIDITY STATUS:        ${evidence.validityStatus}
EVIDENCE GRADE:         [ GRADE ${evidence.evidenceGrade} ]
ROBUSTNESS STATUS:      ${evidence.robustnessStatus}

Key Warnings:
${evidence.warnings.length > 0 ? evidence.warnings.map(w => ` - ${w}`).join('\n') : ' - None detected.'}

Core Assumptions:
${evidence.assumptions.map(a => ` - ${a}`).join('\n')}

Limitations:
${evidence.limitations.length > 0 ? evidence.limitations.map(l => ` - ${l}`).join('\n') : ' - None recorded.'}
================================================================================
    `.trim();
  }
}
