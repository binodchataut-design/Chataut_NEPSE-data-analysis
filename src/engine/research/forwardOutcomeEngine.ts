/**
 * Forward Outcome Engine
 * Measures historical post-signal performance strictly in the forward horizon.
 * Computes:
 * 1. Entry price based on selected execution model (Signal Close, Next Open, Next Close)
 * 2. Forward Returns for 1, 3, 5, 10, 20, 30, 60 bars
 * 3. Maximum Favorable Excursion (MFE)
 * 4. Maximum Adverse Excursion (MAE)
 * 5. Event-Driven Target / Stop simulation with explicit ambiguous bar handling
 * 6. Nepal-specific transaction cost adjustments (brokerage, SEBON, DP, slippage)
 */

import { OHLCVBar } from '../../types/technicalIndicators';
import {
  EntryModel,
  HoldingHorizon,
  ForwardOutcome,
  ExcursionOutcome,
  TargetStopParams,
  SimulationResult,
  TransactionCostModel
} from '../../types/historicalResearch';
import { ResearchCausalityGuard } from './researchCausalityGuard';

export class ForwardOutcomeEngine {
  /**
   * Determine exact entry price and execution bar date based on chosen model
   */
  public static determineEntry(
    bars: OHLCVBar[],
    signalIndex: number,
    model: EntryModel,
    slippagePercent: number = 0
  ): { entryPrice: number; entryIndex: number; entryDate: string } | null {
    if (signalIndex < 0 || signalIndex >= bars.length) return null;

    let basePrice = 0;
    let entryIndex = signalIndex;

    switch (model) {
      case 'SIGNAL_CLOSE':
        basePrice = bars[signalIndex].close;
        entryIndex = signalIndex;
        break;

      case 'NEXT_OPEN':
        if (signalIndex + 1 >= bars.length) {
          // Next bar does not yet exist in dataset; trade cannot fill
          return null;
        }
        basePrice = bars[signalIndex + 1].open;
        entryIndex = signalIndex + 1;
        break;

      case 'NEXT_CLOSE':
        if (signalIndex + 1 >= bars.length) {
          return null;
        }
        basePrice = bars[signalIndex + 1].close;
        entryIndex = signalIndex + 1;
        break;
    }

    if (basePrice <= 0) return null;

    // Apply slippage on entry (buyer pays slippage above execution price)
    const effectiveEntry = basePrice * (1 + slippagePercent / 100);

    return {
      entryPrice: effectiveEntry,
      entryIndex,
      entryDate: bars[entryIndex].date
    };
  }

  /**
   * Calculate forward returns across configured horizons
   */
  public static calculateForwardReturns(
    bars: OHLCVBar[],
    entryIndex: number,
    entryPrice: number,
    horizons: HoldingHorizon[],
    costs: TransactionCostModel
  ): Record<number, ForwardOutcome> {
    const outcomes: Record<number, ForwardOutcome> = {};

    for (const h of horizons) {
      const exitIndex = entryIndex + h;
      if (exitIndex >= bars.length) {
        // Horizon extends beyond available dataset
        continue;
      }

      ResearchCausalityGuard.assertOutcomeTemporalSequence(entryIndex, exitIndex, `Forward Return ${h}D`);

      const exitBar = bars[exitIndex];
      const exitPriceGross = exitBar.close;

      const returnAbsolute = exitPriceGross - entryPrice;
      const returnPercent = ((exitPriceGross - entryPrice) / entryPrice) * 100;

      // Transaction costs adjustment
      const netReturnPercent = this.applyTransactionCosts(
        entryPrice,
        exitPriceGross,
        returnPercent,
        costs
      );

      outcomes[h] = {
        horizon: h,
        exitPrice: exitPriceGross,
        exitDate: exitBar.date,
        returnAbsolute,
        returnPercent,
        netReturnPercent,
        isPositive: netReturnPercent > 0
      };
    }

    return outcomes;
  }

  /**
   * Calculate Maximum Favorable Excursion (MFE) and Maximum Adverse Excursion (MAE)
   */
  public static calculateExcursions(
    bars: OHLCVBar[],
    entryIndex: number,
    entryPrice: number,
    horizons: HoldingHorizon[]
  ): {
    mfe: Record<number, ExcursionOutcome>;
    mae: Record<number, ExcursionOutcome>;
  } {
    const mfeOutcomes: Record<number, ExcursionOutcome> = {};
    const maeOutcomes: Record<number, ExcursionOutcome> = {};

    for (const h of horizons) {
      const maxIndex = Math.min(bars.length - 1, entryIndex + h);
      if (entryIndex >= maxIndex) continue;

      let maxHigh = -Infinity;
      let minLow = Infinity;

      for (let i = entryIndex + 1; i <= maxIndex; i++) {
        ResearchCausalityGuard.assertOutcomeTemporalSequence(entryIndex, i, 'Excursion Inspection');
        const bar = bars[i];
        if (bar.high > maxHigh) maxHigh = bar.high;
        if (bar.low < minLow) minLow = bar.low;
      }

      if (maxHigh === -Infinity || minLow === Infinity) continue;

      const favAbs = Math.max(0, maxHigh - entryPrice);
      const favPct = (favAbs / entryPrice) * 100;

      const advAbs = Math.max(0, entryPrice - minLow);
      const advPct = (advAbs / entryPrice) * 100;

      const outcome: ExcursionOutcome = {
        horizon: h,
        favorableAbsolute: favAbs,
        favorablePercent: favPct,
        adverseAbsolute: advAbs,
        adversePercent: advPct
      };

      mfeOutcomes[h] = outcome;
      maeOutcomes[h] = outcome;
    }

    return { mfe: mfeOutcomes, mae: maeOutcomes };
  }

  /**
   * Event-Driven Target / Stop Simulation
   * Checks whether target or stop is hit first within maxHoldingBars.
   * If both target and stop are triggered in the same bar, handles ambiguity explicitly.
   */
  public static simulateTargetStop(
    bars: OHLCVBar[],
    entryIndex: number,
    entryPrice: number,
    params: TargetStopParams,
    costs: TransactionCostModel
  ): SimulationResult | undefined {
    const targetPrice = entryPrice * (1 + params.targetPercent / 100);
    const stopPrice = entryPrice * (1 - params.stopLossPercent / 100);

    const maxExitIndex = Math.min(bars.length - 1, entryIndex + params.maxHoldingBars);

    for (let i = entryIndex + 1; i <= maxExitIndex; i++) {
      const bar = bars[i];
      const targetHit = bar.high >= targetPrice;
      const stopHit = bar.low <= stopPrice;

      if (targetHit && stopHit) {
        // Ambiguous intra-bar collision
        if (params.ambiguousBarRule === 'MARK_AMBIGUOUS') {
          return {
            outcome: 'AMBIGUOUS',
            exitPrice: bar.close,
            exitDate: bar.date,
            barsHeld: i - entryIndex,
            returnPercent: 0,
            netReturnPercent: 0,
            isWinner: false
          };
        } else {
          // Conservative rule: assume stop was hit first
          const grossRet = ((stopPrice - entryPrice) / entryPrice) * 100;
          const netRet = this.applyTransactionCosts(entryPrice, stopPrice, grossRet, costs);
          return {
            outcome: 'STOP_HIT',
            exitPrice: stopPrice,
            exitDate: bar.date,
            barsHeld: i - entryIndex,
            returnPercent: grossRet,
            netReturnPercent: netRet,
            isWinner: false
          };
        }
      }

      if (targetHit) {
        const grossRet = ((targetPrice - entryPrice) / entryPrice) * 100;
        const netRet = this.applyTransactionCosts(entryPrice, targetPrice, grossRet, costs);
        return {
          outcome: 'TARGET_HIT',
          exitPrice: targetPrice,
          exitDate: bar.date,
          barsHeld: i - entryIndex,
          returnPercent: grossRet,
          netReturnPercent: netRet,
          isWinner: true
        };
      }

      if (stopHit) {
        const grossRet = ((stopPrice - entryPrice) / entryPrice) * 100;
        const netRet = this.applyTransactionCosts(entryPrice, stopPrice, grossRet, costs);
        return {
          outcome: 'STOP_HIT',
          exitPrice: stopPrice,
          exitDate: bar.date,
          barsHeld: i - entryIndex,
          returnPercent: grossRet,
          netReturnPercent: netRet,
          isWinner: false
        };
      }
    }

    // If max holding horizon is reached without target or stop hit
    const finalBar = bars[maxExitIndex];
    if (finalBar && maxExitIndex > entryIndex) {
      const exitPrice = finalBar.close;
      const grossRet = ((exitPrice - entryPrice) / entryPrice) * 100;
      const netRet = this.applyTransactionCosts(entryPrice, exitPrice, grossRet, costs);
      return {
        outcome: 'MAX_TIME_EXPIRED',
        exitPrice,
        exitDate: finalBar.date,
        barsHeld: maxExitIndex - entryIndex,
        returnPercent: grossRet,
        netReturnPercent: netRet,
        isWinner: netRet > 0
      };
    }

    return undefined;
  }

  /**
   * Apply configurable transaction costs (brokerage, SEBON, DP fee, taxes)
   */
  public static applyTransactionCosts(
    entryPrice: number,
    exitPrice: number,
    grossReturnPercent: number,
    costs: TransactionCostModel
  ): number {
    if (!costs.includeCosts) {
      return grossReturnPercent;
    }

    // Slippage on exit
    const effectiveExitPrice = exitPrice * (1 - costs.slippagePercent / 100);

    // Total brokerage & SEBON round-trip percentage
    const roundtripFeePct = (costs.brokeragePercent + costs.sebonFeePercent) * 2;

    let netReturn = ((effectiveExitPrice - entryPrice) / entryPrice) * 100 - roundtripFeePct;

    // If profitable, deduct Capital Gains Tax (CGT) on the gain
    if (netReturn > 0 && costs.capitalGainsTaxPercent > 0) {
      const taxDeduction = netReturn * (costs.capitalGainsTaxPercent / 100);
      netReturn -= taxDeduction;
    }

    return netReturn;
  }
}
