/**
 * NEPSE Research & Trading Intelligence System
 * Database-ready TypeScript Domain Models & Relational Schema Types
 * Designed for seamless eventual mapping to PostgreSQL / Supabase
 */

// ==========================================
// 1. Core Market & Entity Models
// ==========================================

export interface Sector {
  id: string;
  name: string;
  code: string;
  indexValue: number;
  change: number;
  changePercent: number;
  turnover: number; // in NPR
  volume: number;
  weightPercent: number;
}

export interface Company {
  id: string;
  symbol: string; // Ticker (e.g., NABIL, CHCL, SHIVM)
  name: string;
  sectorId: string;
  sectorName: string;
  listingDate: string;
  paidUpCapital: number; // in NPR
  sharesOutstanding: number;
  promoterHoldingPercent: number;
  publicHoldingPercent: number;
  ltp: number; // Last Traded Price
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  turnover: number;
  transactions: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  isActive: boolean;
}

export interface MarketIndex {
  symbol: 'NEPSE' | 'SENSETIVE' | 'FLOAT' | 'SEN_FLOAT';
  name: string;
  currentValue: number;
  previousClose: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  turnover: number; // in NPR
  volume: number;
  totalTransactions: number;
  timestamp: string;
}

export interface CandleData {
  timestamp: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover?: number;
}

// ==========================================
// 2. Analytical & Indicator Models
// ==========================================

export interface TechnicalIndicators {
  symbol: string;
  date: string;
  price: number;
  sma20: number;
  sma50: number;
  sma200: number;
  ema20: number;
  rsi14: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  };
  atr14: number;
  adx14: number;
  plusDI: number;
  minusDI: number;
  obv: number;
  volumeMA20: number;
  roc14: number;
  momentum10: number;
  vwap: number;
}

export interface TechnicalScoreBreakdown {
  totalScore: number; // 0 - 100
  trendScore: number; // 0 - 20
  momentumScore: number; // 0 - 20
  volumeScore: number; // 0 - 20
  structureScore: number; // 0 - 20
  volatilityScore: number; // 0 - 20
  trendCondition: 'Strong Uptrend' | 'Uptrend' | 'Consolidation' | 'Downtrend' | 'Strong Downtrend';
  momentumCondition: 'Strongly Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Oversold';
  volumeConfirmation: boolean;
  supportLevel: number;
  resistanceLevel: number;
  keyObservations: string[];
}

export interface FundamentalMetrics {
  symbol: string;
  fiscalYear: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  revenue: number; // in Millions NPR
  revenueGrowthYoY: number; // %
  netProfit: number; // in Millions NPR
  netProfitGrowthYoY: number; // %
  eps: number;
  epsGrowthYoY: number;
  peRatio: number;
  pbRatio: number;
  bookValuePerShare: number;
  roe: number; // %
  roa: number; // %
  debtToEquity: number;
  currentRatio: number;
  nplPercent?: number; // For banks & financial institutions
  capitalAdequacyRatio?: number; // For banks
  dividendYield: number; // %
  lastCashDividendPercent: number;
  lastBonusDividendPercent: number;
  marketCap: number; // in Billions NPR
}

export interface FundamentalScoreBreakdown {
  totalScore: number; // 0 - 100
  profitabilityScore: number; // 0 - 25
  growthScore: number; // 0 - 25
  valuationScore: number; // 0 - 25
  financialHealthScore: number; // 0 - 25
  grade: 'A' | 'B' | 'C' | 'D';
  keyStrengths: string[];
  keyRisks: string[];
}

// ==========================================
// 3. Broker Analytics Models
// ==========================================

export interface BrokerActivity {
  brokerNumber: number;
  brokerName: string;
  buyQuantity: number;
  sellQuantity: number;
  buyValue: number; // NPR
  sellValue: number; // NPR
  netQuantity: number;
  netValue: number; // NPR
  transactionsCount: number;
  status: 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL';
  topBoughtSymbols?: string[];
  topSoldSymbols?: string[];
}

export interface StockBrokerConcentration {
  symbol: string;
  topBuyerBroker: number;
  topSellerBroker: number;
  top5BuyerSharePercent: number;
  top5SellerSharePercent: number;
  institutionalAccumulationStatus: 'HEAVY_ACCUMULATION' | 'ACCUMULATION' | 'BALANCED' | 'DISTRIBUTION';
  brokerScore: number; // 0 - 100
}

// ==========================================
// 4. Market Regime & Breadth Models
// ==========================================

export type MarketRegimeType = 
  | 'STRONG_BULLISH'
  | 'BULLISH'
  | 'NEUTRAL'
  | 'WEAK'
  | 'BEARISH'
  | 'STRONG_BEARISH';

export interface MarketBreadth {
  advancers: number;
  decliners: number;
  unchanged: number;
  advanceDeclineRatio: number;
  aboveSma20Percent: number;
  aboveSma50Percent: number;
  aboveSma200Percent: number;
  new52WeekHighs: number;
  new52WeekLows: number;
  totalTurnover: number;
  turnoverChangePercent: number;
  marketRegime: MarketRegimeType;
  regimeScore: number; // 0 - 100
  rationale: string[];
}

// ==========================================
// 5. Setup Engine Models
// ==========================================

export type SetupType =
  | 'BREAKOUT'
  | 'BREAKOUT_VOLUME'
  | 'PULLBACK_EMA'
  | 'TREND_CONTINUATION'
  | 'SUPPORT_BOUNCE'
  | 'OVERSOLD_RECOVERY'
  | 'MOMENTUM_CONTINUATION'
  | 'MA_CROSSOVER'
  | 'ACCUMULATION_BASE'
  | 'REVERSAL';

export interface SetupDetection {
  id: string;
  symbol: string;
  companyName: string;
  sectorName: string;
  setupType: SetupType;
  setupName: string;
  detectionDate: string;
  currentPrice: number;
  entryZoneLow: number;
  entryZoneHigh: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskRewardRatio: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  scores: {
    technical: number;
    fundamental: number;
    broker: number;
    market: number;
    overall: number;
  };
  reasons: string[];
  invalidationCriteria: string;
  confidencePercent: number;
}

// ==========================================
// 6. Risk Engine Models
// ==========================================

export type RiskAlertSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type RiskAlertType =
  | 'MARKET_OVERHEATED'
  | 'HIGH_VOLATILITY'
  | 'WEAK_BREADTH'
  | 'BREAKDOWN_RISK'
  | 'EXCESSIVE_CONCENTRATION'
  | 'POOR_RR'
  | 'EARNINGS_DETERIORATION';

export interface RiskAlert {
  id: string;
  type: RiskAlertType;
  severity: RiskAlertSeverity;
  title: string;
  description: string;
  affectedEntity: string; // 'NEPSE', Sector name, or Ticker
  metricValue: string;
  thresholdValue: string;
  timestamp: string;
  actionRecommendation: string;
}

// ==========================================
// 7. Watchlist & Portfolio Models
// ==========================================

export type WatchlistStatus =
  | 'WATCHING'
  | 'SETUP_FORMING'
  | 'READY'
  | 'ENTERED'
  | 'INVALIDATED'
  | 'EXITED';

export interface WatchlistItem {
  id: string;
  symbol: string;
  companyName: string;
  sectorName: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  targetPrice?: number;
  stopLossPrice?: number;
  status: WatchlistStatus;
  setupType?: SetupType;
  opportunityScore: number;
  thesis: string;
  notes: string;
  addedAt: string;
  lastUpdated: string;
}

export interface PortfolioPosition {
  id: string;
  symbol: string;
  companyName: string;
  sectorName: string;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  dividendReceived: number;
  totalReturn: number;
  totalReturnPercent: number;
  weightPercent: number;
  entryDate: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalUnrealizedPL: number;
  totalUnrealizedPLPercent: number;
  totalDividends: number;
  totalRealizedPL: number;
  cashBalance: number;
  positionsCount: number;
  topPerformingSymbol: string;
  worstPerformingSymbol: string;
  nepseBenchmarkReturnPercent: number;
}

// ==========================================
// 8. Trade Journal Model
// ==========================================

export interface TradeJournalEntry {
  id: string;
  date: string;
  symbol: string;
  setupType: SetupType;
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  exitPrice?: number;
  exitDate?: string;
  plAmount?: number;
  plPercent?: number;
  plannedRiskReward: number;
  achievedRiskReward?: number;
  reason: string;
  technicalScore: number;
  fundamentalScore: number;
  marketCondition: MarketRegimeType;
  brokerCondition: string;
  lessonsLearned?: string;
}

// ==========================================
// 9. Scoring & System Configuration
// ==========================================

export interface ScoringWeights {
  technical: number; // e.g. 30%
  fundamental: number; // e.g. 25%
  market: number; // e.g. 15%
  broker: number; // e.g. 15%
  risk: number; // e.g. 15%
}

export type DataSourceMode = 'MOCK_DATA' | 'REAL_DATA';

export interface SystemSettings {
  dataSourceMode: DataSourceMode;
  scoringWeights: ScoringWeights;
  theme: 'dark' | 'light';
  autoRefreshIntervalSeconds: number;
  currency: 'NPR';
  userRiskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  maxPortfolioRiskPercentPerTrade: number;
}
