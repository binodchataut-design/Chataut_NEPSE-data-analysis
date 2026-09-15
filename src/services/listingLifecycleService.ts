/**
 * Listing Lifecycle Service (Phase 3D)
 * Manages the chronological lifecycle of NEPSE securities:
 * listing dates, delistings, merger trading suspensions, and relisting events.
 * Prevents look-ahead bias (trading before listing date) and tracks dead/suspended securities.
 */

import {
  ListingLifecycle,
  LifecycleStatus,
  UniverseMode,
  ShortHistoryWarning
} from '../types/researchValidation';
import { normalizedCompanies } from '../data/normalizedMasterData';
import { OHLCVBar } from '../types/technicalIndicators';

export class ListingLifecycleService {
  /**
   * Historical Lifecycle Master Registry
   * Reflects real NEPSE listings, mergers, suspensions, and historical delistings.
   */
  private static readonly LIFECYCLE_REGISTRY: ListingLifecycle[] = [
    {
      symbol: 'CHCL',
      companyName: 'Chilime Hydropower Company Limited',
      listingDate: '2004-03-29',
      suspensionPeriods: [],
      currentStatus: 'ACTIVE',
      lifecycleStatusSource: 'NEPSE_OFFICIAL'
    },
    {
      symbol: 'NABIL',
      companyName: 'Nabil Bank Limited',
      listingDate: '1986-07-12',
      suspensionPeriods: [
        { startDate: '2022-07-01', endDate: '2022-07-12', reason: 'Nabil & NBB Merger Finalization' }
      ],
      currentStatus: 'ACTIVE',
      lifecycleStatusSource: 'NEPSE_OFFICIAL'
    },
    {
      symbol: 'SHIVM',
      companyName: 'Shivam Cements Limited',
      listingDate: '2019-03-10',
      suspensionPeriods: [],
      currentStatus: 'ACTIVE',
      lifecycleStatusSource: 'NEPSE_OFFICIAL'
    },
    {
      symbol: 'UPPER',
      companyName: 'Upper Tamakoshi Hydropower Limited',
      listingDate: '2018-12-24',
      suspensionPeriods: [],
      currentStatus: 'ACTIVE',
      lifecycleStatusSource: 'NEPSE_OFFICIAL'
    },
    {
      symbol: 'NICA',
      companyName: 'NIC Asia Bank Limited',
      listingDate: '1998-07-21',
      suspensionPeriods: [],
      currentStatus: 'ACTIVE',
      lifecycleStatusSource: 'NEPSE_OFFICIAL'
    },
    {
      symbol: 'HDL',
      companyName: 'Himalayan Distillery Limited',
      listingDate: '2001-08-16',
      suspensionPeriods: [],
      currentStatus: 'ACTIVE',
      lifecycleStatusSource: 'NEPSE_OFFICIAL'
    },
    {
      symbol: 'CIT',
      companyName: 'Citizen Investment Trust',
      listingDate: '2002-04-12',
      suspensionPeriods: [],
      currentStatus: 'ACTIVE',
      lifecycleStatusSource: 'NEPSE_OFFICIAL'
    },
    {
      symbol: 'NLIC',
      companyName: 'Nepal Life Insurance Company Limited',
      listingDate: '2003-02-18',
      suspensionPeriods: [],
      currentStatus: 'ACTIVE',
      lifecycleStatusSource: 'NEPSE_OFFICIAL'
    },
    {
      symbol: 'NTC',
      companyName: 'Nepal Doorsanchar Company Limited',
      listingDate: '2008-03-16',
      suspensionPeriods: [],
      currentStatus: 'ACTIVE',
      lifecycleStatusSource: 'NEPSE_OFFICIAL'
    },
    // Delisted / Merged Historical Securities (Critical for Survivorship Bias elimination)
    {
      symbol: 'NBB',
      companyName: 'Nepal Bangladesh Bank Limited (Merged into NABIL)',
      listingDate: '1995-06-05',
      delistingDate: '2022-07-11',
      suspensionPeriods: [
        { startDate: '2022-01-14', endDate: '2022-07-11', reason: 'Trading suspended for merger acquisition' }
      ],
      currentStatus: 'DELISTED',
      lifecycleStatusSource: 'NEPSE_OFFICIAL'
    },
    {
      symbol: 'BOKL',
      companyName: 'Bank of Kathmandu Limited (Merged into Global IME)',
      listingDate: '1997-03-12',
      delistingDate: '2023-01-09',
      suspensionPeriods: [
        { startDate: '2022-06-16', endDate: '2023-01-09', reason: 'GBIME & BOKL Joint Merger' }
      ],
      currentStatus: 'DELISTED',
      lifecycleStatusSource: 'NEPSE_OFFICIAL'
    },
    {
      symbol: 'MEGA',
      companyName: 'Mega Bank Nepal Limited (Merged into Nepal Investment Mega Bank)',
      listingDate: '2013-11-04',
      delistingDate: '2023-01-11',
      suspensionPeriods: [
        { startDate: '2022-06-12', endDate: '2023-01-11', reason: 'NIBL & MEGA Merger' }
      ],
      currentStatus: 'DELISTED',
      lifecycleStatusSource: 'NEPSE_OFFICIAL'
    },
    {
      symbol: 'CCBL',
      companyName: 'Century Commercial Bank (Merged into Prabhu Bank)',
      listingDate: '2014-03-24',
      delistingDate: '2023-01-10',
      suspensionPeriods: [
        { startDate: '2022-08-15', endDate: '2023-01-10', reason: 'PRVU & CCBL Merger' }
      ],
      currentStatus: 'DELISTED',
      lifecycleStatusSource: 'NEPSE_OFFICIAL'
    }
  ];

  /**
   * Retrieves the lifecycle record for a given symbol
   */
  public static getLifecycle(symbol: string): ListingLifecycle | null {
    const sym = symbol.toUpperCase();
    const found = this.LIFECYCLE_REGISTRY.find(l => l.symbol === sym);
    if (found) return found;

    // Fallback to CompanyMaster if available
    const comp = normalizedCompanies.find(c => c.symbol === sym);
    if (comp) {
      return {
        symbol: comp.symbol,
        companyName: comp.company_name,
        listingDate: comp.listed_date,
        suspensionPeriods: [],
        currentStatus: comp.status as LifecycleStatus,
        lifecycleStatusSource: 'NEPSE_OFFICIAL'
      };
    }

    return null;
  }

  /**
   * Returns all lifecycle entries
   */
  public static getAllLifecycles(): ListingLifecycle[] {
    return [...this.LIFECYCLE_REGISTRY];
  }

  /**
   * Evaluates whether a security was actively tradable on a specific date
   * Strictly enforces listing date and historical suspension periods.
   */
  public static isTradableOnDate(symbol: string, dateStr: string): {
    tradable: boolean;
    reason?: string;
  } {
    const lifecycle = this.getLifecycle(symbol);
    if (!lifecycle) {
      return { tradable: true }; // unknown lifecycle status
    }

    // 1. Pre-listing check
    if (dateStr < lifecycle.listingDate) {
      return {
        tradable: false,
        reason: `Pre-listing bar: Security listed on ${lifecycle.listingDate}, observation is ${dateStr}`
      };
    }

    // 2. Post-delisting check
    if (lifecycle.delistingDate && dateStr > lifecycle.delistingDate) {
      return {
        tradable: false,
        reason: `Delisted security: Delisted on ${lifecycle.delistingDate}, observation is ${dateStr}`
      };
    }

    // 3. Historical suspension period check
    for (const susp of lifecycle.suspensionPeriods) {
      if (dateStr >= susp.startDate && (!susp.endDate || dateStr <= susp.endDate)) {
        return {
          tradable: false,
          reason: `Suspended trading: ${susp.reason} (${susp.startDate} to ${susp.endDate || 'Present'})`
        };
      }
    }

    return { tradable: true };
  }

  /**
   * Evaluates IPO and short history limitations
   */
  public static evaluateShortHistory(
    symbol: string,
    bars: OHLCVBar[],
    warmupRequired: number = 50
  ): ShortHistoryWarning {
    const totalBars = bars.length;
    const usableBars = Math.max(0, totalBars - warmupRequired);
    const isShortHistory = totalBars < 100 || usableBars < 30;

    let message = 'Sufficient historical observations for indicator warmup and forward research.';
    if (totalBars < warmupRequired) {
      message = `Critical: Total bars (${totalBars}) is fewer than indicator warmup requirement (${warmupRequired} bars).`;
    } else if (isShortHistory) {
      message = `Warning: Short history (${totalBars} bars). Indicator warmup consumes ${Math.round((warmupRequired / totalBars) * 100)}% of dataset.`;
    }

    return {
      symbol,
      totalBars,
      warmupBarsRequired: warmupRequired,
      usableBars,
      isShortHistory,
      message
    };
  }
}
