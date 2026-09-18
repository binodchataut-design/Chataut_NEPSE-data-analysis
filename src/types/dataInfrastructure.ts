export type DataSourceMode = 'MOCK_DATA' | 'SUPABASE' | 'REAL_DATA';
export type ActiveDataState = 'MOCK_DATA' | 'LIVE_DATA_CONNECTED' | 'LIVE_DATA_UNAVAILABLE';

export interface ProviderStatusInfo {
  providerStatus: ActiveDataState;
  reason: string;
  timestamp: string;
  gateway: string;
  authenticated: boolean;
}

export interface SectorMaster {
  id: string;
  name: string;
  index_symbol: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface CompanyMaster {
  id: string;
  symbol: string;
  company_name: string;
  sector_id: string;
  sector?: string;
  security_type: string;
  listed_date: string | null;
  listed_shares: number | null;
  paid_up_capital: number | null;
  face_value: number | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELISTED';
  created_at: string;
  updated_at: string;
  hasFullMetadata?: boolean;
}

export interface BrokerMaster {
  broker_number: number;
  broker_name: string;
}

export interface HistoricalPriceRecord {
  id: string;
  company_id: string;
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  previous_close: number;
  change: number;
  change_percent: number;
  volume: number;
  turnover: number;
  transactions: number;
  possible_corporate_action: boolean;
  created_at: string;
}

export interface MarketIndexRecord {
  id?: string;
  symbol: string;
  name: string;
  currentValue: number;
  previousClose: number;
  change: number;
  changePercent: number;
  change_percent?: number;
  high: number;
  low: number;
  turnover: number;
  volume: number;
  totalTransactions: number;
  timestamp: string;
  date?: string;
  index_id?: string;
  close?: number;
  [key: string]: any;
}

export interface DailyMarketStatistics {
  id?: string;
  date: string;
  totalTurnover: number;
  totalVolume: number;
  totalTransactions: number;
  advancers: number;
  decliners: number;
  unchanged: number;
  [key: string]: any;
}

export interface RawFinancialStatement {
  symbol: string;
  fiscalYear: string;
  quarter: string;
  revenue: number;
  netProfit: number;
  eps: number;
}

export interface BrokerTransactionRecord {
  symbol: string;
  brokerNumber: number;
  buyQty: number;
  sellQty: number;
}

export interface ValidationIssue {
  severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
  entity: string;
  recordIdentifier: string;
  code: string;
  message: string;
}

export interface ValidationSummary {
  status: 'VALID' | 'WARNINGS' | 'INVALID';
  totalChecks?: number;
  totalRecordsChecked: number;
  validRecordsCount: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
}

export interface DataImportResult {
  success: boolean;
  message?: string;
  completedAt: string;
  recordsProcessed: number;
  importedCount: number;
  warningCount: number;
  rejectedCount: number;
  errors?: string[];
}

export class LiveDataSourceUnavailableError extends Error {
  constructor(message = 'Fundamental data not available in this mode') {
    super(message);
    this.name = 'LiveDataSourceUnavailableError';
  }
}
