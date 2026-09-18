import { OHLCVBar } from '../../types/technicalIndicators';

export type EntryModel = 'SIGNAL_CLOSE' | 'NEXT_OPEN' | 'NEXT_CLOSE';

export interface EntryResult {
  entryIndex: number;
  entryPrice: number;
  entryDate: string;
}

export interface ForwardReturnResult {
  exitIndex: number;
  exitDate: string;
  exitPrice: number;
  grossReturnPercent: number;
  netReturnPercent: number;
  holdingBars: number;
}

export interface ExcursionResult {
  favorablePercent: number;
}
export interface AdverseExcursionResult {
  adversePercent: number;
}

export type SimulationOutcome = 'TARGET_HIT' | 'STOP_HIT' | 'AMBIGUOUS' | 'TIME_EXIT';

export interface SimulationResult {
  outcome: SimulationOutcome;
  barsHeld: number;
  exitPrice: number;
  netReturnPercent: number;
}

// Baseline capital the equity curve compounds against (matches ResearchStatisticsEngine.calculateDrawdown's default).
// Flat-NPR fees (DP fee) are modeled against this baseline since the backtest doesn't track per-trade position sizing.
const BASE_CAPITAL = 100000;

function applyCosts(grossReturnPercent: number, costs: any): number {
  if (!costs || !costs.includeCosts) return grossReturnPercent;
  let net = grossReturnPercent;
  net -= costs.slippagePercent ?? 0; // exit-side slippage (entry-side slippage is already baked into entryPrice)
  net -= (costs.brokeragePercent ?? 0) * 2; // charged on both the buy and sell legs
  net -= (costs.sebonFeePercent ?? 0) * 2;
  net -= ((costs.dpFeeNpr ?? 0) / BASE_CAPITAL) * 100; // flat fee against baseline capital
  if (net > 0) {
    net -= net * ((costs.capitalGainsTaxPercent ?? 0) / 100); // tax only realized gains
  }
  return net;
}

export class ForwardOutcomeEngine {
  static determineEntry(
    bars: OHLCVBar[],
    signalIndex: number,
    entryModel: EntryModel,
    slippagePercent: number = 0
  ): EntryResult | null {
    let entryIndex: number;
    let rawPrice: number;
    if (entryModel === 'SIGNAL_CLOSE') {
      entryIndex = signalIndex;
      rawPrice = bars[entryIndex]?.close;
    } else if (entryModel === 'NEXT_OPEN') {
      entryIndex = signalIndex + 1;
      rawPrice = bars[entryIndex]?.open;
    } else {
      entryIndex = signalIndex + 1;
      rawPrice = bars[entryIndex]?.close;
    }
    if (entryIndex >= bars.length || rawPrice === undefined) return null;
    const entryPrice = rawPrice * (1 + (slippagePercent || 0) / 100);
    return { entryIndex, entryPrice, entryDate: bars[entryIndex].date };
  }

  static calculateForwardReturns(
    bars: OHLCVBar[],
    entryIndex: number,
    entryPrice: number,
    horizons: number[],
    costs: any
  ): Record<number, ForwardReturnResult> {
    const result: Record<number, ForwardReturnResult> = {};
    for (const h of horizons) {
      const exitIndex = entryIndex + h;
      if (exitIndex >= bars.length) continue;
      const exitBar = bars[exitIndex];
      const grossReturnPercent = ((exitBar.close - entryPrice) / entryPrice) * 100;
      result[h] = {
        exitIndex,
        exitDate: exitBar.date,
        exitPrice: exitBar.close,
        grossReturnPercent,
        netReturnPercent: applyCosts(grossReturnPercent, costs),
        holdingBars: h
      };
    }
    return result;
  }

  static calculateExcursions(
    bars: OHLCVBar[],
    entryIndex: number,
    entryPrice: number,
    horizons: number[]
  ): { mfe: Record<number, ExcursionResult>; mae: Record<number, AdverseExcursionResult> } {
    const mfe: Record<number, ExcursionResult> = {};
    const mae: Record<number, AdverseExcursionResult> = {};
    for (const h of horizons) {
      const windowEnd = Math.min(entryIndex + h, bars.length - 1);
      const window = bars.slice(entryIndex + 1, windowEnd + 1);
      if (window.length === 0) continue;
      const maxHigh = Math.max(...window.map(b => b.high));
      const minLow = Math.min(...window.map(b => b.low));
      mfe[h] = { favorablePercent: ((maxHigh - entryPrice) / entryPrice) * 100 };
      mae[h] = { adversePercent: ((entryPrice - minLow) / entryPrice) * 100 };
    }
    return { mfe, mae };
  }

  static simulateTargetStop(
    bars: OHLCVBar[],
    entryIndex: number,
    entryPrice: number,
    targetStop: any,
    costs: any
  ): SimulationResult {
    const targetPrice = entryPrice * (1 + targetStop.targetPercent / 100);
    const stopPrice = entryPrice * (1 - targetStop.stopLossPercent / 100);
    const maxHoldingBars = targetStop.maxHoldingBars ?? 15;

    for (let barsHeld = 1; barsHeld <= maxHoldingBars; barsHeld++) {
      const idx = entryIndex + barsHeld;
      if (idx >= bars.length) break;
      const bar = bars[idx];
      const hitTarget = bar.high >= targetPrice;
      const hitStop = bar.low <= stopPrice;

      if (hitTarget && hitStop) {
        // Same-bar ambiguity: OHLC alone can't tell which was touched first.
        // ambiguousBarRule resolves the *return calculation* conservatively; the outcome is still flagged AMBIGUOUS for audit.
        const exitPrice = targetStop.ambiguousBarRule === 'CONSERVATIVE_STOP' ? stopPrice : targetPrice;
        const grossReturnPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
        return { outcome: 'AMBIGUOUS', barsHeld, exitPrice, netReturnPercent: applyCosts(grossReturnPercent, costs) };
      }
      if (hitTarget) {
        const grossReturnPercent = ((targetPrice - entryPrice) / entryPrice) * 100;
        return { outcome: 'TARGET_HIT', barsHeld, exitPrice: targetPrice, netReturnPercent: applyCosts(grossReturnPercent, costs) };
      }
      if (hitStop) {
        const grossReturnPercent = ((stopPrice - entryPrice) / entryPrice) * 100;
        return { outcome: 'STOP_HIT', barsHeld, exitPrice: stopPrice, netReturnPercent: applyCosts(grossReturnPercent, costs) };
      }
    }

    // Neither hit within the holding window — exit at close of the last bar held
    const lastIdx = Math.min(entryIndex + maxHoldingBars, bars.length - 1);
    const barsHeld = lastIdx - entryIndex;
    const exitPrice = bars[lastIdx].close;
    const grossReturnPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
    return { outcome: 'TIME_EXIT', barsHeld, exitPrice, netReturnPercent: applyCosts(grossReturnPercent, costs) };
  }
}
