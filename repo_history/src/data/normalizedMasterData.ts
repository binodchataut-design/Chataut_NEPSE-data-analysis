import {
  SectorMaster,
  CompanyMaster,
  BrokerMaster,
  HistoricalPriceRecord,
  MarketIndexRecord,
  DailyMarketStatistics,
  RawFinancialStatement,
  BrokerTransactionRecord,
} from '../types/dataInfrastructure';
import { OHLCVBar } from '../types/technicalIndicators';

// ==========================================
// 1. Sector Master
// ==========================================
export const normalizedSectors: SectorMaster[] = [
  { id: 'sec-cb', name: 'Commercial Banks', index_symbol: 'BANKING', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'sec-db', name: 'Development Banks', index_symbol: 'DEV_BANK', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'sec-fin', name: 'Finance', index_symbol: 'FINANCE', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'sec-hot', name: 'Hotels & Tourism', index_symbol: 'HOTELS', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'sec-hyd', name: 'Hydropower', index_symbol: 'HYDRO', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'sec-inv', name: 'Investment', index_symbol: 'INVESTMENT', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'sec-li', name: 'Life Insurance', index_symbol: 'LIFE_INS', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'sec-nli', name: 'Non-Life Insurance', index_symbol: 'NON_LIFE_INS', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'sec-man', name: 'Manufacturing & Processing', index_symbol: 'MANUFACTURING', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'sec-mic', name: 'Microfinance', index_symbol: 'MICROFINANCE', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'sec-mf', name: 'Mutual Fund', index_symbol: 'MUTUAL_FUND', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'sec-oth', name: 'Others', index_symbol: 'OTHERS', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
];

// ==========================================
// 2. Company Master
// ==========================================
export const normalizedCompanies: CompanyMaster[] = [
  {
    id: 'cmp-chcl',
    symbol: 'CHCL',
    company_name: 'Chilime Hydropower Company Limited',
    sector_id: 'sec-hyd',
    security_type: 'EQ',
    listed_date: '2004-03-29',
    listed_shares: 79836936,
    paid_up_capital: 7983693600,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-nabil',
    symbol: 'NABIL',
    company_name: 'Nabil Bank Limited',
    sector_id: 'sec-cb',
    security_type: 'EQ',
    listed_date: '1986-07-12',
    listed_shares: 270569973,
    paid_up_capital: 27056997300,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-shivm',
    symbol: 'SHIVM',
    company_name: 'Shivam Cements Limited',
    sector_id: 'sec-man',
    security_type: 'EQ',
    listed_date: '2019-03-10',
    listed_shares: 50270000,
    paid_up_capital: 5027000000,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-upper',
    symbol: 'UPPER',
    company_name: 'Upper Tamakoshi Hydropower Limited',
    sector_id: 'sec-hyd',
    security_type: 'EQ',
    listed_date: '2019-01-13',
    listed_shares: 211800000,
    paid_up_capital: 21180000000,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-nica',
    symbol: 'NICA',
    company_name: 'NIC Asia Bank Limited',
    sector_id: 'sec-cb',
    security_type: 'EQ',
    listed_date: '1999-03-21',
    listed_shares: 149175669,
    paid_up_capital: 14917566900,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-hdl',
    symbol: 'HDL',
    company_name: 'Himalayan Distillery Limited',
    sector_id: 'sec-man',
    security_type: 'EQ',
    listed_date: '2001-08-15',
    listed_shares: 26731000,
    paid_up_capital: 2673100000,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-cit',
    symbol: 'CIT',
    company_name: 'Citizen Investment Trust',
    sector_id: 'sec-inv',
    security_type: 'EQ',
    listed_date: '2000-01-20',
    listed_shares: 53137500,
    paid_up_capital: 5313750000,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-nlic',
    symbol: 'NLIC',
    company_name: 'Nepal Life Insurance Company Limited',
    sector_id: 'sec-li',
    security_type: 'EQ',
    listed_date: '2003-02-17',
    listed_shares: 82079666,
    paid_up_capital: 8207966600,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-ntc',
    symbol: 'NTC',
    company_name: 'Nepal Doorsanchar Company Limited',
    sector_id: 'sec-oth',
    security_type: 'EQ',
    listed_date: '2008-04-10',
    listed_shares: 180000000,
    paid_up_capital: 18000000000,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-gbime',
    symbol: 'GBIME',
    company_name: 'Global IME Bank Limited',
    sector_id: 'sec-cb',
    security_type: 'EQ',
    listed_date: '2007-06-25',
    listed_shares: 361287000,
    paid_up_capital: 36128700000,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-shpc',
    symbol: 'SHPC',
    company_name: 'Sanima Mai Hydropower Limited',
    sector_id: 'sec-hyd',
    security_type: 'EQ',
    listed_date: '2015-09-14',
    listed_shares: 30892500,
    paid_up_capital: 3089250000,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-bpcl',
    symbol: 'BPCL',
    company_name: 'Butwal Power Company Limited',
    sector_id: 'sec-hyd',
    security_type: 'EQ',
    listed_date: '2003-05-18',
    listed_shares: 34090000,
    paid_up_capital: 3409000000,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-stc',
    symbol: 'STC',
    company_name: 'Salt Trading Corporation Limited',
    sector_id: 'sec-man',
    security_type: 'EQ',
    listed_date: '1985-04-12',
    listed_shares: 2788282,
    paid_up_capital: 278828200,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-ebl',
    symbol: 'EBL',
    company_name: 'Everest Bank Limited',
    sector_id: 'sec-cb',
    security_type: 'EQ',
    listed_date: '1995-03-10',
    listed_shares: 117644000,
    paid_up_capital: 11764400000,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-sanima',
    symbol: 'SANIMA',
    company_name: 'Sanima Bank Limited',
    sector_id: 'sec-cb',
    security_type: 'EQ',
    listed_date: '2012-02-15',
    listed_shares: 135815000,
    paid_up_capital: 13581500000,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-rbcl',
    symbol: 'RBCL',
    company_name: 'Rastriya Beema Company Limited',
    sector_id: 'sec-nli',
    security_type: 'EQ',
    listed_date: '2016-08-11',
    listed_shares: 2666000,
    paid_up_capital: 266600000,
    face_value: 100,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
  {
    id: 'cmp-hath',
    symbol: 'HATH',
    company_name: 'Hathway Investment Nepal Limited',
    sector_id: 'sec-inv',
    security_type: 'EQ',
    listed_date: '2023-10-12',
    listed_shares: 70000000,
    paid_up_capital: 3500000000,
    face_value: 50,
    status: 'ACTIVE',
    created_at: '2020-01-01',
    updated_at: '2026-09-11',
  },
];

// ==========================================
// 3. Broker Master
// ==========================================
export const normalizedBrokers: BrokerMaster[] = [
  { id: 'brk-58', broker_number: 58, broker_name: 'Naasa Securities Co. Ltd.', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'brk-42', broker_number: 42, broker_name: 'Sani Securities Company Ltd.', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'brk-45', broker_number: 45, broker_name: 'Imperial Securities Co. Pvt. Ltd.', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'brk-34', broker_number: 34, broker_name: 'Vision Securities Pvt. Ltd.', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'brk-49', broker_number: 49, broker_name: 'Online Securities Ltd.', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'brk-28', broker_number: 28, broker_name: 'Shweta Securities Pvt. Ltd.', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'brk-38', broker_number: 38, broker_name: 'Dipshikha Dhitopatra Karobar Co.', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'brk-44', broker_number: 44, broker_name: 'Dynamic Technosoft / Broker 44', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'brk-17', broker_number: 17, broker_name: 'ABC Securities Pvt. Ltd.', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'brk-59', broker_number: 59, broker_name: 'Linch Stock Broking Ltd.', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'brk-14', broker_number: 14, broker_name: 'Nepal Stock House Pvt. Ltd.', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
  { id: 'brk-57', broker_number: 57, broker_name: 'Aryatara Investment & Securities', status: 'ACTIVE', created_at: '2020-01-01', updated_at: '2026-01-01' },
];

// ==========================================
// 4. Normalized Historical Price Data
// ==========================================
export const normalizedPrices: HistoricalPriceRecord[] = [
  // CHCL Recent 5 trading days
  { id: 'pr-chcl-5', company_id: 'cmp-chcl', symbol: 'CHCL', date: '2026-09-07', open: 502.0, high: 512.0, low: 498.0, close: 508.5, previous_close: 500.0, change: 8.5, change_percent: 1.7, volume: 182400, turnover: 92450000, transactions: 1120, created_at: '2026-09-07' },
  { id: 'pr-chcl-4', company_id: 'cmp-chcl', symbol: 'CHCL', date: '2026-09-08', open: 509.0, high: 518.0, low: 505.0, close: 515.0, previous_close: 508.5, change: 6.5, change_percent: 1.28, volume: 215600, turnover: 110540000, transactions: 1340, created_at: '2026-09-08' },
  { id: 'pr-chcl-3', company_id: 'cmp-chcl', symbol: 'CHCL', date: '2026-09-09', open: 516.0, high: 524.0, low: 512.0, close: 519.0, previous_close: 515.0, change: 4.0, change_percent: 0.78, volume: 245000, turnover: 126900000, transactions: 1480, created_at: '2026-09-09' },
  { id: 'pr-chcl-2', company_id: 'cmp-chcl', symbol: 'CHCL', date: '2026-09-10', open: 520.0, high: 531.0, low: 518.0, close: 528.0, previous_close: 519.0, change: 9.0, change_percent: 1.73, volume: 310500, turnover: 163500000, transactions: 1820, created_at: '2026-09-10' },
  { id: 'pr-chcl-1', company_id: 'cmp-chcl', symbol: 'CHCL', date: '2026-09-11', open: 529.0, high: 546.0, low: 526.0, close: 542.0, previous_close: 528.0, change: 14.0, change_percent: 2.65, volume: 428900, turnover: 231450000, transactions: 2450, created_at: '2026-09-11' },

  // NABIL
  { id: 'pr-nabil-2', company_id: 'cmp-nabil', symbol: 'NABIL', date: '2026-09-10', open: 588.0, high: 596.0, low: 586.0, close: 593.0, previous_close: 589.0, change: 4.0, change_percent: 0.68, volume: 245000, turnover: 144800000, transactions: 1250, created_at: '2026-09-10' },
  { id: 'pr-nabil-1', company_id: 'cmp-nabil', symbol: 'NABIL', date: '2026-09-11', open: 594.0, high: 602.0, low: 591.0, close: 598.0, previous_close: 593.0, change: 5.0, change_percent: 0.84, volume: 312000, turnover: 186264000, transactions: 1540, created_at: '2026-09-11' },

  // SHIVM
  { id: 'pr-shivm-2', company_id: 'cmp-shivm', symbol: 'SHIVM', date: '2026-09-10', open: 565.0, high: 580.0, low: 561.0, close: 574.0, previous_close: 562.0, change: 12.0, change_percent: 2.14, volume: 389000, turnover: 222119000, transactions: 2190, created_at: '2026-09-10' },
  { id: 'pr-shivm-1', company_id: 'cmp-shivm', symbol: 'SHIVM', date: '2026-09-11', open: 576.0, high: 592.0, low: 572.0, close: 587.0, previous_close: 574.0, change: 13.0, change_percent: 2.26, volume: 541200, turnover: 316000000, transactions: 3120, created_at: '2026-09-11' },

  // UPPER
  { id: 'pr-upper-1', company_id: 'cmp-upper', symbol: 'UPPER', date: '2026-09-11', open: 245.0, high: 251.0, low: 242.0, close: 248.5, previous_close: 244.0, change: 4.5, change_percent: 1.84, volume: 489000, turnover: 121516500, transactions: 1890, created_at: '2026-09-11' },

  // NICA
  { id: 'pr-nica-1', company_id: 'cmp-nica', symbol: 'NICA', date: '2026-09-11', open: 428.0, high: 432.0, low: 422.0, close: 425.0, previous_close: 427.0, change: -2.0, change_percent: -0.47, volume: 189000, turnover: 80514000, transactions: 890, created_at: '2026-09-11' },

  // HDL
  { id: 'pr-hdl-1', company_id: 'cmp-hdl', symbol: 'HDL', date: '2026-09-11', open: 1460.0, high: 1485.0, low: 1445.0, close: 1475.0, previous_close: 1450.0, change: 25.0, change_percent: 1.72, volume: 68400, turnover: 100890000, transactions: 650, created_at: '2026-09-11' },

  // CIT
  { id: 'pr-cit-1', company_id: 'cmp-cit', symbol: 'CIT', date: '2026-09-11', open: 2240.0, high: 2280.0, low: 2235.0, close: 2265.0, previous_close: 2240.0, change: 25.0, change_percent: 1.12, volume: 41200, turnover: 93318000, transactions: 480, created_at: '2026-09-11' },

  // NLIC
  { id: 'pr-nlic-1', company_id: 'cmp-nlic', symbol: 'NLIC', date: '2026-09-11', open: 675.0, high: 688.0, low: 672.0, close: 684.0, previous_close: 674.0, change: 10.0, change_percent: 1.48, volume: 112000, turnover: 76384000, transactions: 780, created_at: '2026-09-11' },

  // NTC
  { id: 'pr-ntc-1', company_id: 'cmp-ntc', symbol: 'NTC', date: '2026-09-11', open: 885.0, high: 896.0, low: 882.0, close: 892.0, previous_close: 886.0, change: 6.0, change_percent: 0.68, volume: 88900, turnover: 79298800, transactions: 590, created_at: '2026-09-11' },
];

// ==========================================
// 5. Market Index Records
// ==========================================
export const normalizedIndices: MarketIndexRecord[] = [
  { id: 'idx-nepse', index_id: 'NEPSE', name: 'NEPSE Index', date: '2026-09-11', open: 2715.4, high: 2742.8, low: 2710.2, close: 2738.45, change: 24.12, change_percent: 0.89, turnover: 8421500000, volume: 19450000, transactions: 89400, created_at: '2026-09-11' },
  { id: 'idx-sens', index_id: 'SENSITIVE', name: 'Sensitive Index', date: '2026-09-11', open: 488.2, high: 494.5, low: 487.1, close: 493.18, change: 4.82, change_percent: 0.99, turnover: 4120000000, volume: 9250000, created_at: '2026-09-11' },
  { id: 'idx-float', index_id: 'FLOAT', name: 'Float Index', date: '2026-09-11', open: 186.2, high: 189.4, low: 185.8, close: 188.72, change: 2.14, change_percent: 1.15, turnover: 7950000000, volume: 18100000, created_at: '2026-09-11' },
  { id: 'idx-bank', index_id: 'BANKING', name: 'Banking Sub-Index', date: '2026-09-11', open: 1480.0, high: 1495.0, low: 1478.0, close: 1492.4, change: 11.2, change_percent: 0.76, turnover: 2150000000, volume: 4600000, created_at: '2026-09-11' },
  { id: 'idx-hyd', index_id: 'HYDRO', name: 'Hydropower Sub-Index', date: '2026-09-11', open: 3410.0, high: 3495.0, low: 3395.0, close: 3482.6, change: 68.4, change_percent: 2.0, turnover: 2840000000, volume: 7200000, created_at: '2026-09-11' },
  { id: 'idx-man', index_id: 'MANUFACTURING', name: 'Manufacturing & Processing Sub-Index', date: '2026-09-11', open: 6820.0, high: 6940.0, low: 6810.0, close: 6915.2, change: 89.5, change_percent: 1.31, turnover: 1180000000, volume: 1850000, created_at: '2026-09-11' },
];

// ==========================================
// 6. Daily Market Statistics
// ==========================================
export const normalizedDailyStats: DailyMarketStatistics = {
  id: 'dms-2026-09-11',
  date: '2026-09-11',
  advancers: 168,
  decliners: 64,
  unchanged: 12,
  total_turnover: 8421500000, // 8.42 Arba
  total_volume: 19450000,
  total_transactions: 89400,
  listed_companies: 244,
  traded_companies: 232,
  advance_decline_ratio: 2.625,
  market_breadth: 'BULLISH',
  stocks_above_20ema: 72.4,
  stocks_above_50sma: 64.8,
  stocks_above_200sma: 58.2,
  created_at: '2026-09-11 15:30:00',
};

// ==========================================
// 7. Raw Financial Statements
// ==========================================
export const normalizedRawFinancials: RawFinancialStatement[] = [
  {
    id: 'rfs-chcl-q4-2080',
    company_id: 'cmp-chcl',
    symbol: 'CHCL',
    fiscal_year: '2080/081',
    quarter: 'Q4',
    revenue: 1485.2, // NPR Millions
    operating_profit: 965.4,
    net_profit: 785.6,
    paid_up_capital: 7983.69,
    reserve_and_surplus: 4210.5,
    total_assets: 15420.0,
    total_liabilities: 3225.81,
    equity: 12194.19, // Paid up + reserves
    current_assets: 4120.0,
    current_liabilities: 1250.0,
    cash_and_equivalents: 2150.0,
    total_shares: 79.836936, // Millions
    declared_cash_dividend: 10.0,
    declared_bonus_dividend: 5.0,
    created_at: '2026-08-15',
  },
  {
    id: 'rfs-nabil-q4-2080',
    company_id: 'cmp-nabil',
    symbol: 'NABIL',
    fiscal_year: '2080/081',
    quarter: 'Q4',
    revenue: 16420.5,
    operating_profit: 9840.0,
    net_profit: 7040.2,
    paid_up_capital: 27056.99,
    reserve_and_surplus: 19850.4,
    total_assets: 485000.0,
    total_liabilities: 438092.61,
    equity: 46907.39,
    current_assets: 312000.0,
    current_liabilities: 298000.0,
    cash_and_equivalents: 42500.0,
    total_shares: 270.569973,
    declared_cash_dividend: 11.5,
    declared_bonus_dividend: 0.0,
    created_at: '2026-08-20',
  },
  {
    id: 'rfs-shivm-q4-2080',
    company_id: 'cmp-shivm',
    symbol: 'SHIVM',
    fiscal_year: '2080/081',
    quarter: 'Q4',
    revenue: 9450.0,
    operating_profit: 1420.0,
    net_profit: 890.4,
    paid_up_capital: 5027.0,
    reserve_and_surplus: 3450.0,
    total_assets: 14250.0,
    total_liabilities: 5773.0,
    equity: 8477.0,
    current_assets: 4850.0,
    current_liabilities: 2650.0,
    cash_and_equivalents: 1120.0,
    total_shares: 50.27,
    declared_cash_dividend: 8.0,
    declared_bonus_dividend: 0.0,
    created_at: '2026-08-22',
  },
];

// ==========================================
// 8. Broker Transactions
// ==========================================
export const normalizedBrokerTransactions: BrokerTransactionRecord[] = [
  { id: 'bt-1', date: '2026-09-11', company_id: 'cmp-chcl', symbol: 'CHCL', broker_id: 'brk-58', broker_number: 58, buy_quantity: 118400, buy_value: 63936000, sell_quantity: 24200, sell_value: 13068000, net_quantity: 94200, net_value: 50868000, transaction_count: 384, created_at: '2026-09-11' },
  { id: 'bt-2', date: '2026-09-11', company_id: 'cmp-chcl', symbol: 'CHCL', broker_id: 'brk-42', broker_number: 42, buy_quantity: 34500, buy_value: 18630000, sell_quantity: 96800, sell_value: 52272000, net_quantity: -62300, net_value: -33642000, transaction_count: 295, created_at: '2026-09-11' },
  { id: 'bt-3', date: '2026-09-11', company_id: 'cmp-nabil', symbol: 'NABIL', broker_id: 'brk-34', broker_number: 34, buy_quantity: 84200, buy_value: 50351600, sell_quantity: 18500, sell_value: 11063000, net_quantity: 65700, net_value: 39288600, transaction_count: 240, created_at: '2026-09-11' },
  { id: 'bt-4', date: '2026-09-11', company_id: 'cmp-shivm', symbol: 'SHIVM', broker_id: 'brk-45', broker_number: 45, buy_quantity: 145000, buy_value: 85115000, sell_quantity: 32000, sell_value: 18784000, net_quantity: 113000, net_value: 66331000, transaction_count: 512, created_at: '2026-09-11' },
  { id: 'bt-5', date: '2026-09-11', company_id: 'cmp-upper', symbol: 'UPPER', broker_id: 'brk-58', broker_number: 58, buy_quantity: 98000, buy_value: 24353000, sell_quantity: 42000, sell_value: 10437000, net_quantity: 56000, net_value: 13916000, transaction_count: 310, created_at: '2026-09-11' },
];

// ==========================================
// 9. Standardized OHLCV Bar Provider Function
// ==========================================
export function getNormalizedStockBars(symbol: string): OHLCVBar[] {
  const upper = symbol.toUpperCase();
  // Base LTP map
  const basePrices: Record<string, number> = {
    CHCL: 548,
    NABIL: 598,
    SHIVM: 587,
    UPPER: 248.5,
    NICA: 425,
    HDL: 1475,
    CIT: 2265,
    NLIC: 684,
    NTC: 892
  };

  const targetLtp = basePrices[upper] || 500;
  const ratio = targetLtp / 548;

  // Base raw daily points for 50 trading days to satisfy SMA 50 and all warmup periods
  const dailyBase = [
    { d: '2026-06-25', c: 450, v: 120000 }, { d: '2026-06-26', c: 454, v: 135000 },
    { d: '2026-06-29', c: 452, v: 110000 }, { d: '2026-06-30', c: 458, v: 145000 },
    { d: '2026-07-01', c: 462, v: 155000 }, { d: '2026-07-02', c: 460, v: 130000 },
    { d: '2026-07-05', c: 465, v: 140000 }, { d: '2026-07-06', c: 468, v: 160000 },
    { d: '2026-07-07', c: 464, v: 125000 }, { d: '2026-07-08', c: 470, v: 170000 },
    { d: '2026-07-09', c: 474, v: 180000 }, { d: '2026-07-12', c: 472, v: 142000 },
    { d: '2026-07-13', c: 476, v: 156000 }, { d: '2026-07-14', c: 475, v: 135000 },
    { d: '2026-07-15', c: 479, v: 162000 }, { d: '2026-07-16', c: 483, v: 175000 },
    { d: '2026-07-19', c: 481, v: 140000 }, { d: '2026-07-20', c: 485, v: 168000 },
    { d: '2026-07-21', c: 488, v: 182000 }, { d: '2026-07-22', c: 484, v: 145000 },
    { d: '2026-07-23', c: 482, v: 138000 }, { d: '2026-07-26', c: 480, v: 130000 },
    { d: '2026-07-27', c: 486, v: 154000 }, { d: '2026-07-28', c: 489, v: 160000 },
    { d: '2026-07-29', c: 485, v: 141000 }, { d: '2026-07-30', c: 488, v: 158000 },
    { d: '2026-08-02', c: 492, v: 172000 }, { d: '2026-08-03', c: 495, v: 180000 },
    { d: '2026-08-04', c: 490, v: 152000 }, { d: '2026-08-05', c: 493, v: 164000 },
    { d: '2026-08-06', c: 489, v: 143000 }, { d: '2026-08-09', c: 494, v: 166000 },
    { d: '2026-08-10', c: 498, v: 185000 }, { d: '2026-08-11', c: 492, v: 150000 },
    { d: '2026-08-12', c: 496, v: 178000 }, { d: '2026-08-13', c: 501, v: 195000 },
    { d: '2026-08-16', c: 497, v: 160000 }, { d: '2026-08-17', c: 503, v: 188000 },
    { d: '2026-08-18', c: 508, v: 215000 }, { d: '2026-08-19', c: 505, v: 190000 },
    { d: '2026-08-20', c: 512, v: 224000 }, { d: '2026-08-23', c: 510, v: 195000 },
    { d: '2026-08-24', c: 518, v: 245000 }, { d: '2026-08-25', c: 515, v: 210000 },
    { d: '2026-08-26', c: 522, v: 260000 }, { d: '2026-08-27', c: 520, v: 230000 },
    { d: '2026-08-30', c: 526, v: 280000 }, { d: '2026-08-31', c: 524, v: 240000 },
    { d: '2026-09-01', c: 528, v: 290000 }, { d: '2026-09-02', c: 531, v: 310000 },
    { d: '2026-09-03', c: 530, v: 275000 }, { d: '2026-09-06', c: 529, v: 250000 },
    { d: '2026-09-07', c: 535, v: 330000 }, { d: '2026-09-08', c: 538, v: 345000 },
    { d: '2026-09-09', c: 536, v: 310000 }, { d: '2026-09-10', c: 542, v: 380000 },
    { d: '2026-09-11', c: 548, v: 428000 }
  ];

  return dailyBase.map((b, idx) => {
    const scaledClose = Math.round(b.c * ratio * 10) / 10;
    const prevC = idx > 0 ? Math.round(dailyBase[idx - 1].c * ratio * 10) / 10 : scaledClose;
    const open = idx === 0 ? scaledClose : prevC;
    const high = Math.round(Math.max(open, scaledClose) * 1.015 * 10) / 10;
    const low = Math.round(Math.min(open, scaledClose) * 0.985 * 10) / 10;
    const volume = Math.round(b.v * (0.85 + (idx % 5) * 0.08));
    const turnover = Math.round(volume * scaledClose);

    return {
      date: b.d,
      open,
      high,
      low,
      close: scaledClose,
      volume,
      turnover
    };
  });
}
