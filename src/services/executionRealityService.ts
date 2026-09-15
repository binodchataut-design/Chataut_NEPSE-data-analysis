/**
 * Execution Reality Service (Phase 3D)
 * Models realistic NEPSE execution mechanics:
 * 1. Entry timing (Signal Close vs Next Open vs Next Close)
 * 2. Liquidity-adjusted slippage models
 * 3. NEPSE statutory costs (Brokerage, SEBON, DP Fee, CGT)
 * 4. Circuit limit restrictions (10% daily bounds)
 * 5. Gap-through-stop executions
 * 6. Same-bar collision resolution
 */

import { OHLCVBar } from '../types/technicalIndicators';
import {
  ExecutionRealityConfig,
  StopExecutionModelType,
  SameBarCollisionModel,
  StopTargetTriggerOutcome,
  CircuitRule,
  LiquidityMetrics
} from '../types/researchValidation';

export const DEFAULT_EXECUTION_REALITY_CONFIG: ExecutionRealityConfig = {
  entryModel: 'NEXT_OPEN',
  slippageModel: 'LIQUIDITY_ADJUSTED',
  baseSlippageBps: 15, // 0.15% base slippage
  liquidityPenaltyFactor: 1.5,
  stopExecutionModel: 'CONSERVATIVE_GAP_MODEL',
  sameBarCollisionRule: 'CONSERVATIVE',
  includeNepseStatutoryFees: true,
  brokeragePercent: 0.35, // 0.35% average tier
  sebonFeePercent: 0.015, // 0.015%
  dpFeeNpr: 25.0, // 25 NPR
  capitalGainsTaxPercent: 5.0 // 5% individual
};

export class ExecutionRealityService {
  /**
   * Verified NEPSE circuit breaker guidelines
   */
  public static readonly NEPSE_CIRCUIT_RULE: CircuitRule = {
    effectiveFrom: '2019-01-01',
    maxDailyChangePercent: 10.0,
    source: 'NEPSE_BYLAWS',
    confidence: 'HIGH'
  };

  /**
   * Computes modelled slippage percentage based on model choice and security liquidity
   */
  public static calculateModelledSlippage(
    config: ExecutionRealityConfig,
    liquidity?: LiquidityMetrics
  ): { slippagePercent: number; label: string } {
    if (config.slippageModel === 'NO_SLIPPAGE') {
      return { slippagePercent: 0, label: 'Zero slippage assumed (Optimistic)' };
    }

    if (config.slippageModel === 'FIXED_BPS') {
      const fixedPct = config.baseSlippageBps / 100;
      return { slippagePercent: fixedPct, label: `Fixed ${config.baseSlippageBps} bps (${fixedPct.toFixed(2)}%)` };
    }

    if (config.slippageModel === 'LIQUIDITY_ADJUSTED') {
      let penaltyMultiplier = 1.0;
      if (liquidity) {
        if (liquidity.classification === 'VERY_LOW') penaltyMultiplier = 4.0;
        else if (liquidity.classification === 'LOW') penaltyMultiplier = 2.5;
        else if (liquidity.classification === 'MODERATE') penaltyMultiplier = 1.3;
        else if (liquidity.classification === 'HIGH') penaltyMultiplier = 1.0;
        else if (liquidity.classification === 'VERY_HIGH') penaltyMultiplier = 0.8;
      }
      const slippage = (config.baseSlippageBps / 100) * penaltyMultiplier * config.liquidityPenaltyFactor;
      return {
        slippagePercent: Math.round(slippage * 1000) / 1000,
        label: `Liquidity-adjusted (${(config.baseSlippageBps / 100).toFixed(2)}% * ${penaltyMultiplier.toFixed(1)}x penalty)`
      };
    }

    return { slippagePercent: 0.2, label: 'User defined 0.20%' };
  }

  /**
   * Calculates total NEPSE round-trip transaction costs
   */
  public static calculateRoundTripCosts(
    entryPrice: number,
    exitPrice: number,
    shares: number,
    config: ExecutionRealityConfig,
    liquidity?: LiquidityMetrics
  ): {
    totalDeductionPercent: number;
    grossReturnPercent: number;
    netReturnPercent: number;
    brokerageNpr: number;
    sebonFeeNpr: number;
    dpFeeNpr: number;
    cgtNpr: number;
    slippageNpr: number;
  } {
    const grossReturnPct = ((exitPrice - entryPrice) / entryPrice) * 100;
    const entryTurnover = entryPrice * shares;
    const exitTurnover = exitPrice * shares;

    if (!config.includeNepseStatutoryFees) {
      return {
        totalDeductionPercent: 0,
        grossReturnPercent: Math.round(grossReturnPct * 100) / 100,
        netReturnPercent: Math.round(grossReturnPct * 100) / 100,
        brokerageNpr: 0,
        sebonFeeNpr: 0,
        dpFeeNpr: 0,
        cgtNpr: 0,
        slippageNpr: 0
      };
    }

    // Brokerage both ways
    const bEntry = entryTurnover * (config.brokeragePercent / 100);
    const bExit = exitTurnover * (config.brokeragePercent / 100);
    const totalBrokerage = bEntry + bExit;

    // SEBON fee (0.015%) both ways
    const sebon = (entryTurnover + exitTurnover) * (config.sebonFeePercent / 100);

    // DP fee (typically 25 NPR per sell transaction)
    const dp = config.dpFeeNpr;

    // Slippage impact
    const { slippagePercent } = this.calculateModelledSlippage(config, liquidity);
    const slippageCost = (entryTurnover + exitTurnover) * (slippagePercent / 100);

    // Capital Gains Tax (applied only on positive net profit before CGT)
    const profitBeforeCGT = exitTurnover - entryTurnover - totalBrokerage - sebon - dp - slippageCost;
    const cgt = profitBeforeCGT > 0 ? profitBeforeCGT * (config.capitalGainsTaxPercent / 100) : 0;

    const totalCosts = totalBrokerage + sebon + dp + slippageCost + cgt;
    const netProfit = exitTurnover - entryTurnover - totalCosts;
    const netReturnPct = entryTurnover > 0 ? (netProfit / entryTurnover) * 100 : grossReturnPct;
    const totalDeductionPct = grossReturnPct - netReturnPct;

    return {
      totalDeductionPercent: Math.round(totalDeductionPct * 100) / 100,
      grossReturnPercent: Math.round(grossReturnPct * 100) / 100,
      netReturnPercent: Math.round(netReturnPct * 100) / 100,
      brokerageNpr: Math.round(totalBrokerage),
      sebonFeeNpr: Math.round(sebon),
      dpFeeNpr: dp,
      cgtNpr: Math.round(cgt),
      slippageNpr: Math.round(slippageCost)
    };
  }

  /**
   * Simulates stop-loss & target resolution on a single bar with gap and collision handling
   */
  public static evaluateBarExit(
    bar: OHLCVBar,
    targetPrice: number,
    stopLossPrice: number,
    config: ExecutionRealityConfig
  ): {
    outcome: StopTargetTriggerOutcome;
    executedExitPrice: number;
    isGapThroughStop: boolean;
    isSameBarCollision: boolean;
  } {
    const touchedTarget = bar.high >= targetPrice;
    const touchedStop = bar.low <= stopLossPrice;

    // 1. Same-Bar Collision (Both target and stop touched in same bar)
    if (touchedTarget && touchedStop) {
      let executedPrice = stopLossPrice;
      if (config.sameBarCollisionRule === 'STOP_FIRST' || config.sameBarCollisionRule === 'CONSERVATIVE') {
        executedPrice = stopLossPrice;
      } else if (config.sameBarCollisionRule === 'TARGET_FIRST') {
        executedPrice = targetPrice;
      }

      return {
        outcome: 'BOTH_TOUCHED_SAME_BAR',
        executedExitPrice: executedPrice,
        isGapThroughStop: false,
        isSameBarCollision: true
      };
    }

    // 2. Stop touched
    if (touchedStop) {
      // Check for gap-through-stop (bar opened below the stop price)
      const isGapThrough = bar.open < stopLossPrice;
      let executedPrice = stopLossPrice;

      if (isGapThrough) {
        if (config.stopExecutionModel === 'STOP_AT_NEXT_AVAILABLE_PRICE' || config.stopExecutionModel === 'CONSERVATIVE_GAP_MODEL') {
          // Realistic fill: executed at Open or worse
          executedPrice = bar.open;
        } else {
          // Naive fill at nominal stop level
          executedPrice = stopLossPrice;
        }
        return {
          outcome: 'GAP_THROUGH_STOP',
          executedExitPrice: executedPrice,
          isGapThroughStop: true,
          isSameBarCollision: false
        };
      }

      return {
        outcome: 'STOP_TRIGGERED',
        executedExitPrice: stopLossPrice,
        isGapThroughStop: false,
        isSameBarCollision: false
      };
    }

    // 3. Target touched
    if (touchedTarget) {
      return {
        outcome: 'TARGET_TRIGGERED',
        executedExitPrice: targetPrice,
        isGapThroughStop: false,
        isSameBarCollision: false
      };
    }

    return {
      outcome: 'NO_TRIGGER',
      executedExitPrice: bar.close,
      isGapThroughStop: false,
      isSameBarCollision: false
    };
  }
}
