/**
 * Corporate Action & Price Continuity Service (Phase 3D)
 * Tracks NEPSE corporate actions (bonuses, rights, cash dividends, mergers, capital adjustments),
 * detects artificial price distortions (e.g., book-closure dilution drops),
 * and flags unadjusted historical price artifacts.
 */

import { OHLCVBar } from '../types/technicalIndicators';
import {
  CorporateAction,
  PriceMode,
  DiscontinuityDiagnostic,
  DistortionClassification
} from '../types/researchValidation';

export class CorporateActionService {
  /**
   * Verified NEPSE Corporate Actions Repository
   * Includes historical dividend announcements, bonus share issues, and rights offerings.
   */
  private static readonly KNOWN_ACTIONS: CorporateAction[] = [
    {
      id: 'CA-CHCL-2025-BONUS',
      symbol: 'CHCL',
      date: '2025-12-18',
      type: 'BONUS',
      ratio: '1:0.10',
      cashAmount: 5.0,
      source: 'NEPSE_OFFICIAL',
      confidence: 'HIGH',
      notes: '10% Bonus shares + 5% Cash dividend for FY 2081/82'
    },
    {
      id: 'CA-NABIL-2025-CASH',
      symbol: 'NABIL',
      date: '2025-12-24',
      type: 'CASH_DIVIDEND',
      ratio: '0',
      cashAmount: 11.5,
      source: 'NEPSE_OFFICIAL',
      confidence: 'HIGH',
      notes: '11.5% Cash dividend approved in AGM'
    },
    {
      id: 'CA-UPPER-2024-RIGHTS',
      symbol: 'UPPER',
      date: '2024-08-15',
      type: 'RIGHTS',
      ratio: '1:1',
      cashAmount: 0,
      source: 'NEPSE_OFFICIAL',
      confidence: 'HIGH',
      notes: '100% Right share issuance (1:1)'
    },
    {
      id: 'CA-SHIVM-2025-CASH',
      symbol: 'SHIVM',
      date: '2025-11-20',
      type: 'CASH_DIVIDEND',
      ratio: '0',
      cashAmount: 6.84,
      source: 'NEPSE_OFFICIAL',
      confidence: 'HIGH',
      notes: '6.84% Cash dividend'
    },
    {
      id: 'CA-NICA-2024-CAPITAL',
      symbol: 'NICA',
      date: '2024-10-10',
      type: 'CAPITAL_ADJUSTMENT',
      ratio: '1:0.15',
      cashAmount: 0,
      source: 'COMPANY_ANNOUNCEMENT',
      confidence: 'MODERATE',
      notes: 'Capital adjustment following sub-ordinate debt conversion'
    },
    {
      id: 'CA-HDL-2025-BONUS',
      symbol: 'HDL',
      date: '2025-12-05',
      type: 'BONUS',
      ratio: '1:0.05',
      cashAmount: 10.0,
      source: 'NEPSE_OFFICIAL',
      confidence: 'HIGH',
      notes: '5% Bonus + 10% Cash'
    }
  ];

  /**
   * Retrieve all known corporate actions for a given symbol
   */
  public static getActionsForSymbol(symbol: string): CorporateAction[] {
    const sym = symbol.toUpperCase();
    return this.KNOWN_ACTIONS.filter(a => a.symbol === sym);
  }

  /**
   * Retrieves all corporate actions recorded across the entire system
   */
  public static getAllActions(): CorporateAction[] {
    return [...this.KNOWN_ACTIONS];
  }

  /**
   * Audits price series for price discontinuities and checks against corporate actions
   */
  public static auditPriceContinuity(
    symbol: string,
    bars: OHLCVBar[],
    priceMode: PriceMode = 'RAW_UNADJUSTED'
  ): {
    diagnostics: DiscontinuityDiagnostic[];
    corporateActionCoverage: 'VERIFIED' | 'PARTIAL' | 'UNKNOWN';
    warningMessage?: string;
  } {
    const sym = symbol.toUpperCase();
    const actions = this.getActionsForSymbol(sym);
    const actionDateMap = new Map<string, CorporateAction>();
    for (const a of actions) {
      actionDateMap.set(a.date, a);
    }

    const diagnostics: DiscontinuityDiagnostic[] = [];
    const volumes = bars.map(b => b.volume);

    for (let i = 1; i < bars.length; i++) {
      const prev = bars[i - 1];
      const curr = bars[i];
      if (prev.close <= 0) continue;

      const overnightGapPct = ((curr.open - prev.close) / prev.close) * 100;
      const singleDayChangePct = ((curr.close - prev.close) / prev.close) * 100;

      // 20-day rolling volume MA
      const vSlice = volumes.slice(Math.max(0, i - 20), i);
      const avgVol = vSlice.reduce((a, b) => a + b, 0) / (vSlice.length || 1);
      const volRatio = avgVol > 0 ? curr.volume / avgVol : 1.0;

      // Check for large discontinuity (overnight gap > 8% or single-day move > 10%)
      const isLargeDiscontinuity = Math.abs(overnightGapPct) >= 8.0 || Math.abs(singleDayChangePct) >= 10.0;

      if (isLargeDiscontinuity) {
        const matched = actionDateMap.get(curr.date);
        let classification: DistortionClassification = 'UNKNOWN';
        let notes = '';

        if (matched) {
          classification = 'LIKELY_CORPORATE_ACTION';
          notes = `Matched known ${matched.type} action on ${matched.date}. Artificial price adjustment expected.`;
        } else if (overnightGapPct <= -9.0 && priceMode === 'RAW_UNADJUSTED') {
          // Sharp downward overnight gap without prior news is characteristic of NEPSE book-closure adjustment
          classification = 'POSSIBLE_CORPORATE_ACTION';
          notes = `Unexplained overnight drop of ${overnightGapPct.toFixed(1)}% suggests an unrecorded bonus/rights book-closure.`;
        } else {
          classification = 'LIKELY_MARKET_MOVE';
          notes = `Price move of ${singleDayChangePct.toFixed(1)}% with volume ratio ${volRatio.toFixed(1)}x rolling average.`;
        }

        diagnostics.push({
          symbol: sym,
          date: curr.date,
          previousClose: prev.close,
          open: curr.open,
          close: curr.close,
          overnightGapPercent: Math.round(overnightGapPct * 10) / 10,
          volumeRatioVs20MA: Math.round(volRatio * 10) / 10,
          classification,
          matchedAction: matched,
          notes
        });
      }
    }

    let coverage: 'VERIFIED' | 'PARTIAL' | 'UNKNOWN' = 'PARTIAL';
    if (actions.length >= 2) {
      coverage = 'VERIFIED';
    } else if (actions.length === 0) {
      coverage = 'UNKNOWN';
    }

    let warningMessage: string | undefined;
    if (priceMode === 'RAW_UNADJUSTED' && diagnostics.some(d => d.classification === 'POSSIBLE_CORPORATE_ACTION')) {
      warningMessage = 'Raw unadjusted prices contain large overnight gaps that may distort indicator formulas and return expectations.';
    }

    return {
      diagnostics,
      corporateActionCoverage: coverage,
      warningMessage
    };
  }
}
