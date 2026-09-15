/**
 * NEPSE Data Infrastructure Domain Models
 * Normalized models prepared for PostgreSQL / Supabase relational architecture
 */

// ==========================================
// 1. Company Master Model
// ==========================================

export type SecurityType = 'EQ' | 'MF' | 'DEB' | 'PREF';
export type EntityStatus = 'ACTIVE' | 'SUSPENDED' | 'DELISTED';

export interface CompanyMaster {
  id: string; // UUID or normalized slug
  symbol: string; // Ticker (e.g. NABIL, CHCL)
  company_name: string; // Legal full company name
  sector_id: string; // Foreign key referencing Sector
  security_type: SecurityType; // Equity, Mutual Fund, Debenture, Preferred
  listed_date: string; // YYYY-MM-DD
  listed_shares: number; // Total issued shares
  paid_up_capital: number; // in NPR
  face_value: number; // Typically 100 for equity, 10 for mutual funds
  status: EntityStatus; // ACTIVE, SUSPENDED, DELISTED
  created_at: string;
  updated_at: string;
}

// ==========================================
// 2. Sector Master Model
// ==========================================

export interface SectorMaster {
  id: string;
  name: string;
  index_symbol: string; // e.g. BANKING, HYDRO, HOTELS
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
  created_at: string;
  updated_at: string;
}

// ==========================================
// 3. Historical Price Data Model
// ==========================================

export interface HistoricalPriceRecord {
  id: string;
  company_id: string; // Foreign key referencing CompanyMaster.id
  symbol: string; // Denormalized for rapid lookup
  date: string; // Trading date YYYY-MM-DD
  open: number; // Opening price in NPR
  high: number; // Day high in NPR
  low: number; // Day low in NPR
  close: number; // Closing/LTP price in NPR
  previous_close: number; // Prior day's close
  change: number; // close - previous_close
  change_percent: number; // (change / previous_close) * 100
  volume: number; // Total shares traded
  turnover: number; // Total monetary turnover in NPR
  transactions: number; // Number of trades/contracts executed
  created_at: string;
}

// ==========================================
// 4. Market Index Record
// ==========================================

export interface MarketIndexRecord {
  id: string;
  index_id: string; // 'NEPSE' | 'SENSITIVE' | 'FLOAT' | Sector Index Symbol
  name: string;
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  change_percent: number;
  turnover: number; // in NPR
  volume: number;
  transactions?: number;
  created_at: string;
}

// ==========================================
// 5. Daily Market Statistics Model
// ==========================================

export interface DailyMarketStatistics {
  id: string;
  date: string; // YYYY-MM-DD
  advancers: number;
  decliners: number;
  unchanged: number;
  total_turnover: number; // Total NPR traded across exchange
  total_volume: number; // Total shares traded
  total_transactions: number; // Total transactions
  listed_companies: number;
  traded_companies: number;
  advance_decline_ratio: number; // advancers / decliners
  market_breadth: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  stocks_above_20ema: number; // Percentage of stocks above 20 EMA
  stocks_above_50sma: number; // Percentage of stocks above 50 SMA
  stocks_above_200sma: number; // Percentage of stocks above 200 SMA
  created_at: string;
}

// ==========================================
// 6. Broker Master & Transaction Models
// ==========================================

export interface BrokerMaster {
  id: string;
  broker_number: number; // Official NEPSE member number (e.g. 58, 42, 34)
  broker_name: string; // Official broker house name
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  address?: string;
  contact?: string;
  created_at: string;
  updated_at: string;
}

export interface BrokerTransactionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  company_id: string; // Foreign key referencing CompanyMaster.id
  symbol: string;
  broker_id: string; // Foreign key referencing BrokerMaster.id
  broker_number: number;
  buy_quantity: number;
  buy_value: number; // in NPR
  sell_quantity: number;
  sell_value: number; // in NPR
  net_quantity: number; // buy_quantity - sell_quantity
  net_value: number; // buy_value - sell_value
  transaction_count: number;
  created_at: string;
}

// ==========================================
// 7. Fundamental Data Models (Raw vs Calculated)
// ==========================================

export type FiscalQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface FinancialPeriod {
  id: string;
  company_id: string;
  fiscal_year: string; // e.g. "2080/081" (Bikram Sambat) or "2023/2024"
  quarter: FiscalQuarter;
  end_date: string;
  is_audited: boolean;
}

// Raw Financial Statement Figures (Directly reported by company in NPR Millions)
export interface RawFinancialStatement {
  id: string;
  company_id: string;
  symbol: string;
  fiscal_year: string;
  quarter: FiscalQuarter;
  revenue: number; // in Millions NPR
  operating_profit: number; // in Millions NPR
  net_profit: number; // in Millions NPR
  paid_up_capital: number; // in Millions NPR
  reserve_and_surplus: number; // in Millions NPR
  total_assets: number; // in Millions NPR
  total_liabilities: number; // in Millions NPR
  equity: number; // in Millions NPR (Assets - Liabilities or Paid Up + Reserves)
  current_assets: number; // in Millions NPR
  current_liabilities: number; // in Millions NPR
  cash_and_equivalents: number; // in Millions NPR
  total_shares: number; // Number of shares in millions
  declared_cash_dividend: number; // Cash dividend %
  declared_bonus_dividend: number; // Bonus dividend %
  created_at: string;
}

// Derived/Calculated Financial Ratios (Separated from Raw Statements)
export interface CalculatedFinancialRatios {
  id: string;
  company_id: string;
  symbol: string;
  fiscal_year: string;
  quarter: FiscalQuarter;
  eps: number; // (Net Profit * 1,000,000) / Shares
  book_value: number; // (Equity * 1,000,000) / Shares
  roe: number; // (Net Profit / Equity) * 100
  roa: number; // (Net Profit / Total Assets) * 100
  debt_to_equity: number; // Total Liabilities / Equity
  current_ratio: number; // Current Assets / Current Liabilities
  pe_ratio: number; // LTP / EPS
  pb_ratio: number; // LTP / Book Value
  dividend_yield: number; // Total Dividend / LTP * 100
  calculated_at: string;
}

// ==========================================
// 8. Data Validation Engine Models
// ==========================================

export type ValidationSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type ValidationStatus = 'VALID' | 'INVALID';

export interface ValidationIssue {
  code: string; // Unique rule identifier (e.g. 'OHLC_INVALID_BOUNDS', 'NEGATIVE_PRICE')
  severity: ValidationSeverity;
  entity: 'COMPANY' | 'SECTOR' | 'PRICE' | 'INDEX' | 'BROKER' | 'FINANCIAL';
  recordIdentifier: string; // e.g. "CHCL / 2026-09-10" or "Broker #58"
  field?: string;
  message: string;
  actualValue?: any;
  expectedCondition?: string;
  timestamp: string;
}

export interface ValidationSummary {
  status: ValidationStatus;
  totalRecordsChecked: number;
  validRecordsCount: number;
  totalIssuesCount: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  issues: ValidationIssue[];
  executedAt: string;
}

// ==========================================
// 9. Data Import Models
// ==========================================

export type ImportDataType = 'COMPANIES' | 'PRICES' | 'BROKERS' | 'FINANCIALS';

export interface DataImportResult {
  importType: ImportDataType;
  recordsProcessed: number;
  importedCount: number;
  warningCount: number;
  rejectedCount: number;
  errors: Array<{
    rowNumber: number;
    rawRecord: string;
    errorMessage: string;
    severity: ValidationSeverity;
  }>;
  summaryMessage: string;
  completedAt: string;
}

// ==========================================
// 10. Data Source State & Safety Models
// ==========================================

export type ActiveDataState = 'MOCK_DATA' | 'LIVE_DATA_CONNECTED' | 'LIVE_DATA_UNAVAILABLE';

export interface ProviderStatusInfo {
  providerStatus: ActiveDataState;
  reason: string;
  timestamp: string;
  gateway?: string;
  authenticated?: boolean;
}

export class LiveDataSourceUnavailableError extends Error {
  public readonly providerStatus = 'LIVE_DATA_UNAVAILABLE' as const;
  public readonly reason: string;
  public readonly timestamp: string;
  public readonly providerName: string;

  constructor(providerName: string, reason?: string) {
    const msg = reason || 'Upstream NEPSE broker API connection is not configured or authenticated.';
    super(`[${providerName}] LIVE_DATA_UNAVAILABLE: ${msg}`);
    this.name = 'LiveDataSourceUnavailableError';
    this.providerName = providerName;
    this.reason = msg;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, LiveDataSourceUnavailableError.prototype);
  }

  public toStatusInfo(): ProviderStatusInfo {
    return {
      providerStatus: 'LIVE_DATA_UNAVAILABLE',
      reason: this.reason,
      timestamp: this.timestamp,
      gateway: this.providerName,
      authenticated: false,
    };
  }
}
