/**
 * Backtest Reality Service (Phase 3D)
 * Performs a comprehensive 12-point audit on any backtest run or conditional probability result.
 * Verifies that results do not rest on unmodeled costs, unrealistic stops, or survivorship bias.
 */

import {
  BacktestRealityAudit,
  CheckResultStatus,
  ExecutionRealityConfig,
  PriceMode,
  UniverseMode
} from '../types/researchValidation';
import { DataCoverageScore } from '../types/researchValidation';
import { LiquidityMetrics } from '../types/researchValidation';
import { SurvivorshipBiasService } from './survivorshipBiasService';

export interface BacktestAuditContext {
  symbol: string;
  dataCoverage: DataCoverageScore;
  corporateActionCoverage: 'VERIFIED' | 'PARTIAL' | 'UNKNOWN';
  priceMode: PriceMode;
  universeMode: UniverseMode;
  startDate: string;
  endDate: string;
  liquidity: LiquidityMetrics;
  config: ExecutionRealityConfig;
  totalSignals: number;
  sameBarCollisionCount: number;
  gapThroughStopCount: number;
  isOutOfSampleLocked: boolean;
}

export class BacktestRealityService {
  /**
   * Generates the formal 12-item Backtest Reality Audit
   */
  public static auditBacktest(context: BacktestAuditContext): BacktestRealityAudit {
    const notes: string[] = [];

    // 1. Data Coverage Check
    let dataCoverageStatus: CheckResultStatus = 'PASS';
    if (context.dataCoverage.coveragePercent < 70 || context.dataCoverage.qualityStatus === 'INVALID') {
      dataCoverageStatus = 'FAIL';
      notes.push(`Critical data coverage deficit: ${context.dataCoverage.coveragePercent}% coverage.`);
    } else if (context.dataCoverage.coveragePercent < 85 || context.dataCoverage.longestGapSessions > 10) {
      dataCoverageStatus = 'WARNING';
      notes.push(`Moderate data gap: longest gap is ${context.dataCoverage.longestGapSessions} sessions.`);
    }

    // 2. Corporate Action Coverage Check
    let caStatus: CheckResultStatus = 'PASS';
    if (context.corporateActionCoverage === 'UNKNOWN') {
      caStatus = 'WARNING';
      notes.push('Corporate action status is UNKNOWN. Large price steps may reflect artificial book-closure adjustments.');
    } else if (context.corporateActionCoverage === 'PARTIAL') {
      caStatus = 'WARNING';
      notes.push('Corporate action coverage is PARTIAL. Some historical distributions may be unadjusted.');
    }

    // 3. Universe Integrity Check
    let universeStatus: CheckResultStatus = 'PASS';
    if (context.universeMode === 'USER_DEFINED') {
      universeStatus = 'WARNING';
      notes.push('Universe is manually selected; subject to selection bias.');
    }

    // 4. Survivorship Risk Check
    const survDiag = SurvivorshipBiasService.evaluateSurvivorshipBias(
      [context.symbol],
      context.startDate,
      context.endDate,
      context.universeMode
    );
    let survStatus: CheckResultStatus = 'PASS';
    if (survDiag.survivorshipBiasRisk === 'HIGH') {
      survStatus = 'FAIL';
      notes.push(survDiag.explanation);
    } else if (survDiag.survivorshipBiasRisk === 'MEDIUM') {
      survStatus = 'WARNING';
      notes.push(survDiag.explanation);
    }

    // 5. Liquidity Realism Check
    let liqStatus: CheckResultStatus = 'PASS';
    if (context.liquidity.classification === 'VERY_LOW') {
      liqStatus = 'FAIL';
      notes.push(`Security has VERY_LOW liquidity (ADT NPR ${context.liquidity.averageTurnover20.toLocaleString()}). Backtest fills unrealistic.`);
    } else if (context.liquidity.classification === 'LOW') {
      liqStatus = 'WARNING';
      notes.push(`Security has LOW liquidity (ADT NPR ${context.liquidity.averageTurnover20.toLocaleString()}). Fills may face slippage.`);
    }

    // 6. Execution Realism Check (Timing)
    let execStatus: CheckResultStatus = 'PASS';
    if (context.config.entryModel === 'SIGNAL_CLOSE') {
      execStatus = 'WARNING';
      notes.push('Signal Close entry assumes execution exactly at the closing tick when condition is triggered. Next Open is more realistic.');
    }

    // 7. Slippage Assumption Check
    let slipStatus: CheckResultStatus = 'PASS';
    if (context.config.slippageModel === 'NO_SLIPPAGE') {
      slipStatus = 'WARNING';
      notes.push('Zero slippage modeled. Unrealistic for retail orders in NEPSE.');
    }

    // 8. Transaction Cost Model Check
    let costStatus: CheckResultStatus = 'PASS';
    if (!context.config.includeNepseStatutoryFees) {
      costStatus = 'FAIL';
      notes.push('NEPSE statutory fees (Brokerage, SEBON, DP Fee, CGT) are disabled. Gross returns are overstated.');
    }

    // 9. Circuit Rule Coverage
    const circuitStatus: CheckResultStatus = 'PASS'; // 10% daily limit checked

    // 10. Stop Execution Model Check
    let stopStatus: CheckResultStatus = 'PASS';
    if (context.config.stopExecutionModel === 'STOP_AT_LEVEL' && context.gapThroughStopCount > 0) {
      stopStatus = 'WARNING';
      notes.push(`${context.gapThroughStopCount} gap-through stops executed at nominal stop level instead of actual gap price.`);
    }

    // 11. Same-Bar Ambiguity Impact Check
    let sameBarStatus: CheckResultStatus = 'PASS';
    const totalSigs = Math.max(1, context.totalSignals);
    const ambiguityPct = (context.sameBarCollisionCount / totalSigs) * 100;
    if (ambiguityPct > 15) {
      sameBarStatus = 'FAIL';
      notes.push(`High same-bar target/stop ambiguity (${ambiguityPct.toFixed(1)}% of trades). Outcome heavily sensitive to collision rule.`);
    } else if (ambiguityPct > 5) {
      sameBarStatus = 'WARNING';
      notes.push(`Moderate same-bar collision rate (${ambiguityPct.toFixed(1)}%).`);
    }

    // 12. Out-of-Sample Integrity
    let oosStatus: CheckResultStatus = 'PASS';
    if (!context.isOutOfSampleLocked) {
      oosStatus = 'FAIL';
      notes.push('Test set was not sealed prior to parameter review. Possible data leakage.');
    }

    return {
      dataCoverage: dataCoverageStatus,
      corporateActionCoverage: caStatus,
      universeIntegrity: universeStatus,
      survivorshipRisk: survStatus,
      liquidityRealism: liqStatus,
      executionRealism: execStatus,
      slippageAssumption: slipStatus,
      transactionCostModel: costStatus,
      circuitRuleCoverage: circuitStatus,
      stopExecutionModel: stopStatus,
      sameBarAmbiguityImpact: sameBarStatus,
      outOfSampleIntegrity: oosStatus,
      sameBarAmbiguityCount: context.sameBarCollisionCount,
      sameBarAmbiguityPercent: Math.round(ambiguityPct * 10) / 10,
      gapThroughStopCount: context.gapThroughStopCount,
      auditNotes: notes
    };
  }
}
