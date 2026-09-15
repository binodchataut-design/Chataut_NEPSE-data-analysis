import {
  Company,
  Sector,
  MarketIndex,
  CandleData,
  TechnicalIndicators,
  TechnicalScoreBreakdown,
  FundamentalMetrics,
  FundamentalScoreBreakdown,
  BrokerActivity,
  StockBrokerConcentration,
  MarketBreadth,
  SetupDetection,
  RiskAlert,
  WatchlistItem,
  PortfolioPosition,
  PortfolioSummary,
  SystemSettings
} from '../types';

// ==========================================
// Sectors
// ==========================================
export const mockSectors: Sector[] = [
  { id: 'sec-1', name: 'Commercial Banks', code: 'BANKING', indexValue: 1485.40, change: 18.20, changePercent: 1.24, turnover: 2150400000, volume: 5400000, weightPercent: 32.5 },
  { id: 'sec-2', name: 'Hydropower', code: 'HYDRO', indexValue: 3120.15, change: 54.80, changePercent: 1.79, turnover: 2480000000, volume: 6800000, weightPercent: 24.1 },
  { id: 'sec-3', name: 'Manufacturing & Processing', code: 'MANUFACTURING', indexValue: 7420.90, change: -12.40, changePercent: -0.17, turnover: 680000000, volume: 920000, weightPercent: 11.2 },
  { id: 'sec-4', name: 'Life Insurance', code: 'LIFE_INS', indexValue: 11840.50, change: 112.30, changePercent: 0.96, turnover: 540000000, volume: 640000, weightPercent: 9.8 },
  { id: 'sec-5', name: 'Non-Life Insurance', code: 'NON_LIFE', indexValue: 12950.10, change: 84.50, changePercent: 0.66, turnover: 410000000, volume: 510000, weightPercent: 7.4 },
  { id: 'sec-6', name: 'Microfinance', code: 'MICROFINANCE', indexValue: 5120.30, change: 42.10, changePercent: 0.83, turnover: 490000000, volume: 480000, weightPercent: 6.2 },
  { id: 'sec-7', name: 'Hotels & Tourism', code: 'HOTELS', indexValue: 5680.75, change: 95.20, changePercent: 1.70, turnover: 320000000, volume: 380000, weightPercent: 3.5 },
  { id: 'sec-8', name: 'Investment', code: 'INVESTMENT', indexValue: 118.40, change: 1.45, changePercent: 1.24, turnover: 380000000, volume: 1200000, weightPercent: 3.1 },
  { id: 'sec-9', name: 'Others', code: 'OTHERS', indexValue: 1820.60, change: -4.80, changePercent: -0.26, turnover: 370000000, volume: 430000, weightPercent: 2.2 },
];

// ==========================================
// Market Indices
// ==========================================
export const mockMarketIndices: MarketIndex[] = [
  {
    symbol: 'NEPSE',
    name: 'NEPSE Index',
    currentValue: 2684.52,
    previousClose: 2652.34,
    change: 32.18,
    changePercent: 1.21,
    high: 2698.40,
    low: 2649.10,
    turnover: 7820400000, // ~7.82 Arba
    volume: 18450290,
    totalTransactions: 89420,
    timestamp: '2026-09-11 15:00:00',
  },
  {
    symbol: 'SENSETIVE',
    name: 'Sensitive Index',
    currentValue: 472.35,
    previousClose: 467.45,
    change: 4.90,
    changePercent: 1.05,
    high: 474.10,
    low: 466.80,
    turnover: 3410200000,
    volume: 7200150,
    totalTransactions: 34210,
    timestamp: '2026-09-11 15:00:00',
  },
  {
    symbol: 'FLOAT',
    name: 'Float Index',
    currentValue: 184.62,
    previousClose: 182.41,
    change: 2.21,
    changePercent: 1.21,
    high: 185.30,
    low: 182.10,
    turnover: 5210000000,
    volume: 12400000,
    totalTransactions: 62100,
    timestamp: '2026-09-11 15:00:00',
  },
  {
    symbol: 'SEN_FLOAT',
    name: 'Sensitive Float',
    currentValue: 156.40,
    previousClose: 154.80,
    change: 1.60,
    changePercent: 1.03,
    high: 157.10,
    low: 154.50,
    turnover: 2890000000,
    volume: 6100000,
    totalTransactions: 28400,
    timestamp: '2026-09-11 15:00:00',
  }
];

// ==========================================
// Market Breadth & Deterministic Regime
// ==========================================
export const mockMarketBreadth: MarketBreadth = {
  advancers: 164,
  decliners: 72,
  unchanged: 8,
  advanceDeclineRatio: 2.28,
  aboveSma20Percent: 68.4,
  aboveSma50Percent: 61.2,
  aboveSma200Percent: 54.7,
  new52WeekHighs: 19,
  new52WeekLows: 3,
  totalTurnover: 7820400000,
  turnoverChangePercent: 18.4,
  marketRegime: 'BULLISH',
  regimeScore: 76,
  rationale: [
    'NEPSE closed above 20 EMA (2630) and 50 SMA (2580) with upward momentum.',
    'Market breadth is healthy with Advance/Decline ratio of 2.28:1 (164 advancers vs 72 decliners).',
    'Daily turnover expanded +18.4% above the 20-day moving average volume (7.82 Arba vs 6.60 Arba avg).',
    '68.4% of universe actively trading above 20-day SMA, indicating broad participation.'
  ]
};

// ==========================================
// Listed Companies
// ==========================================
export const mockCompanies: Company[] = [
  {
    id: 'c-1',
    symbol: 'CHCL',
    name: 'Chilime Hydropower Co. Ltd.',
    sectorId: 'sec-2',
    sectorName: 'Hydropower',
    listingDate: '2004-03-15',
    paidUpCapital: 7984000000,
    sharesOutstanding: 79840000,
    promoterHoldingPercent: 51.0,
    publicHoldingPercent: 49.0,
    ltp: 548.0,
    openPrice: 532.0,
    highPrice: 555.0,
    lowPrice: 530.0,
    previousClose: 529.0,
    change: 19.0,
    changePercent: 3.59,
    volume: 384500,
    turnover: 209500000,
    transactions: 2450,
    fiftyTwoWeekHigh: 585.0,
    fiftyTwoWeekLow: 395.0,
    isActive: true
  },
  {
    id: 'c-2',
    symbol: 'NABIL',
    name: 'Nabil Bank Limited',
    sectorId: 'sec-1',
    sectorName: 'Commercial Banks',
    listingDate: '1986-07-12',
    paidUpCapital: 27056000000,
    sharesOutstanding: 270560000,
    promoterHoldingPercent: 60.0,
    publicHoldingPercent: 40.0,
    ltp: 592.0,
    openPrice: 585.0,
    highPrice: 596.0,
    lowPrice: 584.0,
    previousClose: 584.0,
    change: 8.0,
    changePercent: 1.37,
    volume: 245800,
    turnover: 145022000,
    transactions: 1820,
    fiftyTwoWeekHigh: 640.0,
    fiftyTwoWeekLow: 475.0,
    isActive: true
  },
  {
    id: 'c-3',
    symbol: 'SHIVM',
    name: 'Shivam Cements Limited',
    sectorId: 'sec-3',
    sectorName: 'Manufacturing & Processing',
    listingDate: '2019-03-10',
    paidUpCapital: 5027000000,
    sharesOutstanding: 50270000,
    promoterHoldingPercent: 88.0,
    publicHoldingPercent: 12.0,
    ltp: 615.0,
    openPrice: 598.0,
    highPrice: 622.0,
    lowPrice: 596.0,
    previousClose: 597.0,
    change: 18.0,
    changePercent: 3.02,
    volume: 412000,
    turnover: 252000000,
    transactions: 3120,
    fiftyTwoWeekHigh: 680.0,
    fiftyTwoWeekLow: 440.0,
    isActive: true
  },
  {
    id: 'c-4',
    symbol: 'UPPER',
    name: 'Upper Tamakoshi Hydropower Ltd.',
    sectorId: 'sec-2',
    sectorName: 'Hydropower',
    listingDate: '2019-01-14',
    paidUpCapital: 21180000000,
    sharesOutstanding: 211800000,
    promoterHoldingPercent: 51.0,
    publicHoldingPercent: 49.0,
    ltp: 284.0,
    openPrice: 275.0,
    highPrice: 288.0,
    lowPrice: 274.0,
    previousClose: 274.0,
    change: 10.0,
    changePercent: 3.65,
    volume: 890000,
    turnover: 251000000,
    transactions: 4200,
    fiftyTwoWeekHigh: 340.0,
    fiftyTwoWeekLow: 198.0,
    isActive: true
  },
  {
    id: 'c-5',
    symbol: 'NICA',
    name: 'NIC Asia Bank Limited',
    sectorId: 'sec-1',
    sectorName: 'Commercial Banks',
    listingDate: '2000-02-18',
    paidUpCapital: 14917000000,
    sharesOutstanding: 149170000,
    promoterHoldingPercent: 51.0,
    publicHoldingPercent: 49.0,
    ltp: 442.0,
    openPrice: 438.0,
    highPrice: 446.0,
    lowPrice: 436.0,
    previousClose: 437.0,
    change: 5.0,
    changePercent: 1.14,
    volume: 310500,
    turnover: 137000000,
    transactions: 2150,
    fiftyTwoWeekHigh: 545.0,
    fiftyTwoWeekLow: 382.0,
    isActive: true
  },
  {
    id: 'c-6',
    symbol: 'HDL',
    name: 'Himalayan Distillery Limited',
    sectorId: 'sec-3',
    sectorName: 'Manufacturing & Processing',
    listingDate: '2001-08-20',
    paidUpCapital: 2674000000,
    sharesOutstanding: 26740000,
    promoterHoldingPercent: 60.0,
    publicHoldingPercent: 40.0,
    ltp: 1620.0,
    openPrice: 1610.0,
    highPrice: 1635.0,
    lowPrice: 1605.0,
    previousClose: 1612.0,
    change: 8.0,
    changePercent: 0.50,
    volume: 45200,
    turnover: 73200000,
    transactions: 680,
    fiftyTwoWeekHigh: 2150.0,
    fiftyTwoWeekLow: 1390.0,
    isActive: true
  },
  {
    id: 'c-7',
    symbol: 'CIT',
    name: 'Citizen Investment Trust',
    sectorId: 'sec-8',
    sectorName: 'Investment',
    listingDate: '1992-05-10',
    paidUpCapital: 5310000000,
    sharesOutstanding: 53100000,
    promoterHoldingPercent: 80.0,
    publicHoldingPercent: 20.0,
    ltp: 2315.0,
    openPrice: 2280.0,
    highPrice: 2340.0,
    lowPrice: 2275.0,
    previousClose: 2270.0,
    change: 45.0,
    changePercent: 1.98,
    volume: 68400,
    turnover: 158000000,
    transactions: 1120,
    fiftyTwoWeekHigh: 2650.0,
    fiftyTwoWeekLow: 1980.0,
    isActive: true
  },
  {
    id: 'c-8',
    symbol: 'NLIC',
    name: 'Nepal Life Insurance Co. Ltd.',
    sectorId: 'sec-4',
    sectorName: 'Life Insurance',
    listingDate: '2003-02-15',
    paidUpCapital: 8207000000,
    sharesOutstanding: 82070000,
    promoterHoldingPercent: 60.0,
    publicHoldingPercent: 40.0,
    ltp: 742.0,
    openPrice: 735.0,
    highPrice: 748.0,
    lowPrice: 732.0,
    previousClose: 734.0,
    change: 8.0,
    changePercent: 1.09,
    volume: 82100,
    turnover: 60800000,
    transactions: 940,
    fiftyTwoWeekHigh: 880.0,
    fiftyTwoWeekLow: 610.0,
    isActive: true
  }
];

// ==========================================
// Historical Daily Candle Data (CHCL sample)
// ==========================================
export const mockCandlesCHCL: CandleData[] = [
  { timestamp: '2026-08-15', date: 'Aug 15', open: 480, high: 492, low: 476, close: 488, volume: 182000, turnover: 88500000 },
  { timestamp: '2026-08-18', date: 'Aug 18', open: 489, high: 504, low: 485, close: 498, volume: 224000, turnover: 111500000 },
  { timestamp: '2026-08-19', date: 'Aug 19', open: 500, high: 512, low: 495, close: 505, volume: 248000, turnover: 125200000 },
  { timestamp: '2026-08-20', date: 'Aug 20', open: 506, high: 515, low: 501, close: 508, volume: 195000, turnover: 99000000 },
  { timestamp: '2026-08-21', date: 'Aug 21', open: 509, high: 518, low: 502, close: 514, volume: 231000, turnover: 118200000 },
  { timestamp: '2026-08-22', date: 'Aug 22', open: 515, high: 524, low: 510, close: 512, volume: 189000, turnover: 97100000 },
  { timestamp: '2026-08-25', date: 'Aug 25', open: 511, high: 518, low: 504, close: 509, volume: 165000, turnover: 84100000 },
  { timestamp: '2026-08-26', date: 'Aug 26', open: 510, high: 522, low: 508, close: 519, volume: 242000, turnover: 124800000 },
  { timestamp: '2026-08-27', date: 'Aug 27', open: 520, high: 531, low: 516, close: 526, volume: 310000, turnover: 162500000 },
  { timestamp: '2026-08-28', date: 'Aug 28', open: 527, high: 534, low: 522, close: 525, volume: 215000, turnover: 113500000 },
  { timestamp: '2026-08-29', date: 'Aug 29', open: 524, high: 530, low: 520, close: 522, volume: 178000, turnover: 93200000 },
  { timestamp: '2026-09-01', date: 'Sep 01', open: 523, high: 532, low: 520, close: 528, volume: 220000, turnover: 115700000 },
  { timestamp: '2026-09-02', date: 'Sep 02', open: 529, high: 538, low: 525, close: 531, volume: 254000, turnover: 135100000 },
  { timestamp: '2026-09-03', date: 'Sep 03', open: 532, high: 541, low: 528, close: 530, volume: 210000, turnover: 112000000 },
  { timestamp: '2026-09-04', date: 'Sep 04', open: 530, high: 536, low: 524, close: 529, volume: 198000, turnover: 104700000 },
  { timestamp: '2026-09-08', date: 'Sep 08', open: 528, high: 535, low: 525, close: 532, volume: 235000, turnover: 124500000 },
  { timestamp: '2026-09-09', date: 'Sep 09', open: 534, high: 545, low: 530, close: 538, volume: 290000, turnover: 155800000 },
  { timestamp: '2026-09-10', date: 'Sep 10', open: 536, high: 542, low: 527, close: 529, volume: 215000, turnover: 114700000 },
  { timestamp: '2026-09-11', date: 'Today', open: 532, high: 555, low: 530, close: 548, volume: 384500, turnover: 209500000 }
];

// ==========================================
// Technical Indicators & Score (CHCL)
// ==========================================
export const mockTechnicalIndicatorsCHCL: TechnicalIndicators = {
  symbol: 'CHCL',
  date: '2026-09-11',
  price: 548,
  sma20: 521.4,
  sma50: 494.8,
  sma200: 452.1,
  ema20: 526.8,
  rsi14: 68.4,
  macd: {
    macdLine: 12.8,
    signalLine: 8.4,
    histogram: 4.4
  },
  bollingerBands: {
    upper: 552.0,
    middle: 521.4,
    lower: 490.8,
    bandwidth: 11.7
  },
  atr14: 16.2,
  adx14: 28.5,
  plusDI: 32.1,
  minusDI: 14.2,
  obv: 4820000,
  volumeMA20: 225000,
  roc14: 8.9,
  momentum10: 24.0,
  vwap: 542.8
};

export const mockTechnicalScoreCHCL: TechnicalScoreBreakdown = {
  totalScore: 78,
  trendScore: 17, // out of 20
  momentumScore: 16, // out of 20
  volumeScore: 15, // out of 20
  structureScore: 14, // out of 20
  volatilityScore: 16, // out of 20
  trendCondition: 'Strong Uptrend',
  momentumCondition: 'Bullish',
  volumeConfirmation: true,
  supportLevel: 520.0,
  resistanceLevel: 560.0,
  keyObservations: [
    'Price trading cleanly above 20 EMA (526.8), 50 SMA (494.8), and 200 SMA (452.1)',
    'RSI(14) at 68.4 indicates bullish momentum with no bearish divergence yet',
    'MACD histogram expanding positively (+4.4), MACD line above signal line',
    'Daily volume (384.5k) is 1.71x above 20-day average volume (225k)',
    'Testing resistance boundary at 555-560 range; breakout candidate'
  ]
};

// ==========================================
// Fundamental Metrics & Score (CHCL)
// ==========================================
export const mockFundamentalCHCL: FundamentalMetrics = {
  symbol: 'CHCL',
  fiscalYear: '2081/082',
  quarter: 'Q4',
  revenue: 1420.5,
  revenueGrowthYoY: 12.4,
  netProfit: 785.2,
  netProfitGrowthYoY: 16.8,
  eps: 22.4,
  epsGrowthYoY: 14.2,
  peRatio: 24.46,
  pbRatio: 3.12,
  bookValuePerShare: 175.6,
  roe: 14.8,
  roa: 8.9,
  debtToEquity: 0.42,
  currentRatio: 1.84,
  dividendYield: 2.74,
  lastCashDividendPercent: 10.0,
  lastBonusDividendPercent: 5.0,
  marketCap: 43.75
};

export const mockFundamentalScoreCHCL: FundamentalScoreBreakdown = {
  totalScore: 74,
  profitabilityScore: 20, // out of 25
  growthScore: 18, // out of 25
  valuationScore: 17, // out of 25
  financialHealthScore: 19, // out of 25
  grade: 'B',
  keyStrengths: [
    'Consistent cash generation and debt-to-equity ratio of 0.42x',
    'Consistent track record of 15%+ dividend payout history',
    'Steady operating margins across run-of-river plants'
  ],
  keyRisks: [
    'Hydrology variation during winter dry seasons',
    'Transmission line congestion constraints affecting dispatch'
  ]
};

// ==========================================
// Broker Activity (Top brokers in NEPSE)
// ==========================================
export const mockBrokerActivities: BrokerActivity[] = [
  {
    brokerNumber: 58,
    brokerName: 'Naasa Securities Co. Ltd.',
    buyQuantity: 840200,
    sellQuantity: 512000,
    buyValue: 485000000,
    sellValue: 295000000,
    netQuantity: 328200,
    netValue: 190000000,
    transactionsCount: 8420,
    status: 'ACCUMULATION',
    topBoughtSymbols: ['CHCL', 'SHIVM', 'UPPER'],
    topSoldSymbols: ['NABIL', 'GBIME']
  },
  {
    brokerNumber: 45,
    brokerName: 'Imperial Securities Co. Ltd.',
    buyQuantity: 620000,
    sellQuantity: 410000,
    buyValue: 342000000,
    sellValue: 225000000,
    netQuantity: 210000,
    netValue: 117000000,
    transactionsCount: 6150,
    status: 'ACCUMULATION',
    topBoughtSymbols: ['CHCL', 'CIT'],
    topSoldSymbols: ['NICA']
  },
  {
    brokerNumber: 34,
    brokerName: 'Vision Securities Pvt. Ltd.',
    buyQuantity: 540000,
    sellQuantity: 580000,
    buyValue: 298000000,
    sellValue: 320000000,
    netQuantity: -40000,
    netValue: -22000000,
    transactionsCount: 5800,
    status: 'NEUTRAL',
    topBoughtSymbols: ['UPPER'],
    topSoldSymbols: ['SHIVM']
  },
  {
    brokerNumber: 42,
    brokerName: 'Sani Securities Co. Ltd.',
    buyQuantity: 310000,
    sellQuantity: 520000,
    buyValue: 175000000,
    sellValue: 295000000,
    netQuantity: -210000,
    netValue: -120000000,
    transactionsCount: 4100,
    status: 'DISTRIBUTION',
    topBoughtSymbols: ['NICA'],
    topSoldSymbols: ['HDL', 'NLIC']
  },
  {
    brokerNumber: 49,
    brokerName: 'Online Securities Ltd.',
    buyQuantity: 450000,
    sellQuantity: 380000,
    buyValue: 260000000,
    sellValue: 215000000,
    netQuantity: 70000,
    netValue: 45000000,
    transactionsCount: 4700,
    status: 'ACCUMULATION',
    topBoughtSymbols: ['SHIVM', 'CHCL'],
    topSoldSymbols: ['NTC']
  }
];

export const mockConcentrationCHCL: StockBrokerConcentration = {
  symbol: 'CHCL',
  topBuyerBroker: 58,
  topSellerBroker: 42,
  top5BuyerSharePercent: 58.4,
  top5SellerSharePercent: 24.1,
  institutionalAccumulationStatus: 'HEAVY_ACCUMULATION',
  brokerScore: 82
};

// ==========================================
// Setup Detections (Predefined Trading Setups)
// ==========================================
export const mockDetectedSetups: SetupDetection[] = [
  {
    id: 'setup-1',
    symbol: 'CHCL',
    companyName: 'Chilime Hydropower Co. Ltd.',
    sectorName: 'Hydropower',
    setupType: 'BREAKOUT_VOLUME',
    setupName: 'Breakout + Volume Expansion',
    detectionDate: '2026-09-11',
    currentPrice: 548.0,
    entryZoneLow: 545.0,
    entryZoneHigh: 552.0,
    stopLoss: 518.0,
    target1: 595.0,
    target2: 640.0,
    riskRewardRatio: 2.85,
    riskLevel: 'MODERATE',
    scores: {
      technical: 78,
      fundamental: 74,
      broker: 82,
      market: 76,
      overall: 77
    },
    reasons: [
      'Price testing 6-month horizontal resistance at 550 NPR',
      'Daily turnover expanding to 20.9 Crore NPR (1.71x 20-day moving average)',
      'Broker #58 & #45 exhibiting heavy net accumulation (+32.8 Crore NPR)',
      'Hydropower sector index gaining +1.79% with strong breadth'
    ],
    invalidationCriteria: 'Daily candle closing below 518.0 NPR (below 20-day EMA support).',
    confidencePercent: 82
  },
  {
    id: 'setup-2',
    symbol: 'SHIVM',
    companyName: 'Shivam Cements Limited',
    sectorName: 'Manufacturing',
    setupType: 'PULLBACK_EMA',
    setupName: 'Pullback to 20 EMA in Strong Uptrend',
    detectionDate: '2026-09-11',
    currentPrice: 615.0,
    entryZoneLow: 605.0,
    entryZoneHigh: 618.0,
    stopLoss: 580.0,
    target1: 675.0,
    target2: 720.0,
    riskRewardRatio: 2.60,
    riskLevel: 'MODERATE',
    scores: {
      technical: 81,
      fundamental: 68,
      broker: 75,
      market: 76,
      overall: 76
    },
    reasons: [
      'Clean retest and rejection wick off the 20-day exponential moving average',
      'RSI cooled off from 74 to 62 during the healthy 3-day shallow pullback',
      'Volume dried up during the dip and spiked on today’s reversal candle'
    ],
    invalidationCriteria: 'Sustained hourly print below 580.0 NPR.',
    confidencePercent: 79
  },
  {
    id: 'setup-3',
    symbol: 'UPPER',
    companyName: 'Upper Tamakoshi Hydropower Ltd.',
    sectorName: 'Hydropower',
    setupType: 'SUPPORT_BOUNCE',
    setupName: 'Key Support Bounce with Bullish Divergence',
    detectionDate: '2026-09-10',
    currentPrice: 284.0,
    entryZoneLow: 278.0,
    entryZoneHigh: 286.0,
    stopLoss: 262.0,
    target1: 320.0,
    target2: 345.0,
    riskRewardRatio: 2.55,
    riskLevel: 'HIGH',
    scores: {
      technical: 74,
      fundamental: 58,
      broker: 70,
      market: 76,
      overall: 71
    },
    reasons: [
      'Defended 270 NPR multi-month demand zone with high transaction counts',
      'RSI posted higher low while price posted equal low (hidden bullish divergence)',
      'Volume increased +45% on green recovery day'
    ],
    invalidationCriteria: 'Daily close breaking below 262.0 NPR.',
    confidencePercent: 73
  },
  {
    id: 'setup-4',
    symbol: 'NABIL',
    companyName: 'Nabil Bank Limited',
    sectorName: 'Commercial Banks',
    setupType: 'ACCUMULATION_BASE',
    setupName: 'Multi-Week Stage 1 Accumulation Base',
    detectionDate: '2026-09-09',
    currentPrice: 592.0,
    entryZoneLow: 585.0,
    entryZoneHigh: 595.0,
    stopLoss: 565.0,
    target1: 645.0,
    target2: 685.0,
    riskRewardRatio: 3.10,
    riskLevel: 'LOW',
    scores: {
      technical: 72,
      fundamental: 88,
      broker: 68,
      market: 76,
      overall: 76
    },
    reasons: [
      'Volatility contraction pattern (VCP) across 6 weeks with contracting spreads',
      'Superior fundamental profile: CAR > 13%, low NPL, steady dividend return',
      'Low downside beta compared to high-beta sectors'
    ],
    invalidationCriteria: 'Breakdown below 565.0 NPR base floor.',
    confidencePercent: 78
  }
];

// ==========================================
// Risk Alerts
// ==========================================
export const mockRiskAlerts: RiskAlert[] = [
  {
    id: 'risk-1',
    type: 'EXCESSIVE_CONCENTRATION',
    severity: 'MEDIUM',
    title: 'Hydropower Sector Turnover Concentration',
    description: 'Hydropower sector captured 31.7% of total daily NEPSE turnover. Historical data shows sector exhaustion typically precedes short-term corrections when sector volume exceeds 30%.',
    affectedEntity: 'Hydropower Sector',
    metricValue: '31.7%',
    thresholdValue: '> 30.0%',
    timestamp: '2026-09-11 14:45:00',
    actionRecommendation: 'Avoid chasing extended hydro scrips with RSI > 75; look for pullback setups.'
  },
  {
    id: 'risk-2',
    type: 'HIGH_VOLATILITY',
    severity: 'LOW',
    title: 'Average True Range Expansion in Speculative Scrips',
    description: 'ATR in low-cap hydropower and microfinance scrips widened +24% over the 5-day moving average.',
    affectedEntity: 'Market-Wide',
    metricValue: '+24% ATR',
    thresholdValue: '> 20.0%',
    timestamp: '2026-09-11 13:30:00',
    actionRecommendation: 'Tighten position sizing parameters; adjust stop-losses according to widened ATR.'
  },
  {
    id: 'risk-3',
    type: 'BREAKDOWN_RISK',
    severity: 'HIGH',
    title: 'Manufacturing Sub-Index Testing Crucial 200 SMA',
    description: 'Manufacturing index closed below its 20 EMA and is testing the 200 SMA at 7,380. High risk of breakdown if heavy volume distribution continues.',
    affectedEntity: 'Manufacturing Sector',
    metricValue: '7,420.90 (-0.17%)',
    thresholdValue: '7,380.00 Floor',
    timestamp: '2026-09-11 12:15:00',
    actionRecommendation: 'Restrict fresh long entries in cement and distillery scrips until reversal confirmation.'
  }
];

// ==========================================
// Watchlist Mock Items
// ==========================================
export const mockWatchlistItems: WatchlistItem[] = [
  {
    id: 'wl-1',
    symbol: 'CHCL',
    companyName: 'Chilime Hydropower Co. Ltd.',
    sectorName: 'Hydropower',
    currentPrice: 548.0,
    priceChange: 19.0,
    priceChangePercent: 3.59,
    targetPrice: 620.0,
    stopLossPrice: 518.0,
    status: 'READY',
    setupType: 'BREAKOUT_VOLUME',
    opportunityScore: 77,
    thesis: 'Breakout above 550 resistance zone supported by strong broker accumulation from Naasa (#58).',
    notes: 'Enter between 545-552. Initial target 595, secondary 640. Stop loss 518 daily close.',
    addedAt: '2026-09-08',
    lastUpdated: '2026-09-11'
  },
  {
    id: 'wl-2',
    symbol: 'SHIVM',
    companyName: 'Shivam Cements Limited',
    sectorName: 'Manufacturing',
    currentPrice: 615.0,
    priceChange: 18.0,
    priceChangePercent: 3.02,
    targetPrice: 700.0,
    stopLossPrice: 580.0,
    status: 'SETUP_FORMING',
    setupType: 'PULLBACK_EMA',
    opportunityScore: 76,
    thesis: '20-day EMA touch with hammer reversal pattern. Watching for next day volume confirmation.',
    notes: 'Wait for volume to cross 350k shares before sizing full position.',
    addedAt: '2026-09-09',
    lastUpdated: '2026-09-11'
  },
  {
    id: 'wl-3',
    symbol: 'NABIL',
    companyName: 'Nabil Bank Limited',
    sectorName: 'Commercial Banks',
    currentPrice: 592.0,
    priceChange: 8.0,
    priceChangePercent: 1.37,
    targetPrice: 660.0,
    stopLossPrice: 565.0,
    status: 'WATCHING',
    setupType: 'ACCUMULATION_BASE',
    opportunityScore: 76,
    thesis: 'Sound core fundamental holding with high safety margin. Base consolidation wrapping up.',
    notes: 'Accumulate in batches below 590.',
    addedAt: '2026-09-01',
    lastUpdated: '2026-09-11'
  },
  {
    id: 'wl-4',
    symbol: 'CIT',
    companyName: 'Citizen Investment Trust',
    sectorName: 'Investment',
    currentPrice: 2315.0,
    priceChange: 45.0,
    priceChangePercent: 1.98,
    targetPrice: 2600.0,
    stopLossPrice: 2190.0,
    status: 'WATCHING',
    opportunityScore: 73,
    thesis: 'Investment sector rotation beneficiary as market liquidity expands.',
    notes: 'Watch broker buy concentration from Broker 45.',
    addedAt: '2026-09-05',
    lastUpdated: '2026-09-11'
  }
];

// ==========================================
// Portfolio Positions & Summary
// ==========================================
export const mockPortfolioPositions: PortfolioPosition[] = [
  {
    id: 'pos-1',
    symbol: 'NABIL',
    companyName: 'Nabil Bank Limited',
    sectorName: 'Commercial Banks',
    quantity: 1200,
    averagePurchasePrice: 540.0,
    currentPrice: 592.0,
    investedAmount: 648000,
    currentValue: 710400,
    unrealizedPL: 62400,
    unrealizedPLPercent: 9.63,
    dividendReceived: 24000,
    totalReturn: 86400,
    totalReturnPercent: 13.33,
    weightPercent: 38.2,
    entryDate: '2026-05-14'
  },
  {
    id: 'pos-2',
    symbol: 'CHCL',
    companyName: 'Chilime Hydropower Co. Ltd.',
    sectorName: 'Hydropower',
    quantity: 1500,
    averagePurchasePrice: 495.0,
    currentPrice: 548.0,
    investedAmount: 742500,
    currentValue: 822000,
    unrealizedPL: 79500,
    unrealizedPLPercent: 10.71,
    dividendReceived: 0,
    totalReturn: 79500,
    totalReturnPercent: 10.71,
    weightPercent: 44.2,
    entryDate: '2026-08-20'
  },
  {
    id: 'pos-3',
    symbol: 'SHIVM',
    companyName: 'Shivam Cements Limited',
    sectorName: 'Manufacturing',
    quantity: 500,
    averagePurchasePrice: 620.0,
    currentPrice: 615.0,
    investedAmount: 310000,
    currentValue: 307500,
    unrealizedPL: -2500,
    unrealizedPLPercent: -0.81,
    dividendReceived: 0,
    totalReturn: -2500,
    totalReturnPercent: -0.81,
    weightPercent: 16.5,
    entryDate: '2026-09-02'
  },
  {
    id: 'pos-4',
    symbol: 'UPPER',
    companyName: 'Upper Tamakoshi Hydropower',
    sectorName: 'Hydropower',
    quantity: 1000,
    averagePurchasePrice: 265.0,
    currentPrice: 284.0,
    investedAmount: 265000,
    currentValue: 284000,
    unrealizedPL: 19000,
    unrealizedPLPercent: 7.17,
    dividendReceived: 0,
    totalReturn: 19000,
    totalReturnPercent: 7.17,
    weightPercent: 15.3,
    entryDate: '2026-09-04'
  }
];

export const mockPortfolioSummary: PortfolioSummary = {
  totalInvested: 1700500,
  totalCurrentValue: 1839900,
  totalUnrealizedPL: 139400,
  totalUnrealizedPLPercent: 8.20,
  totalDividends: 24000,
  totalRealizedPL: 45000,
  cashBalance: 420000, // Available NPR liquidity
  positionsCount: 4,
  topPerformingSymbol: 'CHCL (+10.71%)',
  worstPerformingSymbol: 'SHIVM (-0.81%)',
  nepseBenchmarkReturnPercent: 4.85
};

// ==========================================
// Default System Settings
// ==========================================
export const defaultSystemSettings: SystemSettings = {
  dataSourceMode: 'MOCK_DATA',
  scoringWeights: {
    technical: 30,
    fundamental: 25,
    market: 15,
    broker: 15,
    risk: 15
  },
  theme: 'dark',
  autoRefreshIntervalSeconds: 30,
  currency: 'NPR',
  userRiskTolerance: 'MODERATE',
  maxPortfolioRiskPercentPerTrade: 2.0
};
