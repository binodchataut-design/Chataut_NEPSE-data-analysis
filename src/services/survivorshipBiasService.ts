/**
 * Survivorship Bias Service (Phase 3D)
 * Distinguishes between the current survivor universe and the true historical universe as of date.
 * Assesses survivorship bias risk and tracks delisted companies in NEPSE backtests.
 */

import {
  UniverseMode,
  SurvivorshipRisk,
  SurvivorshipDiagnostic
} from '../types/researchValidation';
import { ListingLifecycleService } from './listingLifecycleService';

export class SurvivorshipBiasService {
  /**
   * Retrieves the universe of securities that were actively existing and tradable as of a given historical date
   */
  public static getUniverseAsOfDate(
    dateStr: string,
    mode: UniverseMode = 'ALL_HISTORICAL_SECURITIES'
  ): string[] {
    const all = ListingLifecycleService.getAllLifecycles();

    return all
      .filter(item => {
        // Must have been listed on or before this date
        if (item.listingDate > dateStr) return false;

        // If delisted before this date, it didn't exist at this date
        if (item.delistingDate && item.delistingDate < dateStr) return false;

        if (mode === 'ACTIVE_ONLY') {
          return item.currentStatus === 'ACTIVE';
        }

        if (mode === 'ACTIVE_AND_SUSPENDED') {
          return item.currentStatus === 'ACTIVE' || item.currentStatus === 'SUSPENDED';
        }

        // ALL_HISTORICAL_SECURITIES includes delisted securities that were active on dateStr
        return true;
      })
      .map(item => item.symbol);
  }

  /**
   * Evaluates survivorship bias risk for a backtest configuration
   */
  public static evaluateSurvivorshipBias(
    symbolsTested: string[],
    startDate: string,
    endDate: string,
    mode: UniverseMode
  ): SurvivorshipDiagnostic {
    const lifecycles = ListingLifecycleService.getAllLifecycles();
    const totalHistorical = lifecycles.length;
    const activeCount = lifecycles.filter(l => l.currentStatus === 'ACTIVE').length;
    const delistedCount = lifecycles.filter(l => l.currentStatus === 'DELISTED').length;
    const suspendedCount = lifecycles.filter(l => l.currentStatus === 'SUSPENDED').length;

    // Check if the backtest period is in the past (e.g. prior to 2024)
    const isHistoricalEra = startDate < '2024-01-01';
    const includesDelisted = symbolsTested.some(sym => {
      const lc = ListingLifecycleService.getLifecycle(sym);
      return lc?.currentStatus === 'DELISTED';
    });

    let risk: SurvivorshipRisk = 'LOW';
    let explanation = '';

    if (mode === 'ACTIVE_ONLY' && isHistoricalEra) {
      risk = 'HIGH';
      explanation = `Backtest covers historical era (${startDate} to ${endDate}) using only today's surviving companies. Delisted/merged banks (e.g., NBB, BOKL, MEGA, CCBL) are excluded, causing significant survivorship bias.`;
    } else if (!includesDelisted && isHistoricalEra) {
      risk = 'MEDIUM';
      explanation = `Backtest period spans dates prior to 2024 but tested symbols do not include any delisted or merged securities. Historical universe representation is partial.`;
    } else if (mode === 'ALL_HISTORICAL_SECURITIES' && includesDelisted) {
      risk = 'LOW';
      explanation = 'Historical universe includes both surviving and historical delisted securities as of tested dates. Survivorship bias risk is controlled.';
    } else {
      risk = 'LOW';
      explanation = 'Recent testing period or custom universe with monitored lifecycle parameters.';
    }

    return {
      universeMode: mode,
      totalHistoricalUniverseCount: totalHistorical,
      activeUniverseCount: activeCount,
      delistedUniverseCount: delistedCount,
      suspendedCount,
      survivorshipBiasRisk: risk,
      explanation
    };
  }
}
