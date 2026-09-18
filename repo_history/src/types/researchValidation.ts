export interface ListingLifecycle {
  symbol: string;
  companyName: string;
  listingDate: string;
  delistingDate?: string;
  suspensionPeriods?: { startDate: string; endDate: string; reason: string; }[];
  currentStatus: string;
  lifecycleStatusSource: string;
}

export type LifecycleStatus = 'NEW' | 'ESTABLISHED' | 'MATURE';
export type UniverseMode = 'ALL' | 'ACTIVE' | 'FILTERED';
export type LiquidityClassification = 'HIGH' | 'MEDIUM' | 'LOW' | 'ILLIQUID';
export type DataCoverageScore = number;
export type PriceMode = 'SPLIT_ADJUSTED' | 'RAW';

export interface ShortHistoryWarning {
  symbol: string;
  reason: string;
  totalBars?: number;
}

export interface ResearchValidationResult {
  valid: boolean;
  warnings?: ShortHistoryWarning[];
}
