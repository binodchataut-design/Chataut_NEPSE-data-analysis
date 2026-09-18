export type MarketRegimeType = 'BULL' | 'BEAR' | 'SIDEWAYS' | 'ALL' | string;
export type HoldingHorizon = number;
export type TransactionCostModel = 'FIXED' | 'PERCENTAGE' | 'NONE' | string;

export interface ResearchRunConfig {
  [key: string]: any;
}

export interface ResearchSetup {
  id: string;
  name: string;
  description?: string;
  conditionTree?: any;
}

export interface TargetStopParams {
  targetPercent: number;
  stopPercent: number;
}

export interface ResearchObservation {
  id: string;
  symbol: string;
  date?: string;
  returnPct?: number;
  maxExcursion?: number;
  maxFavorableExcursion?: number;
  maxAdverseExcursion?: number;
  holdingDays?: number;
  marketRegime?: MarketRegimeType;
  entryModel?: string;
  entryPrice?: number;
  [key: string]: any;
}

export interface ResearchResult {
  setupId?: string;
  totalSignals?: number;
  winRate?: number;
  avgReturn?: number;
  observations?: ResearchObservation[];
  expectancy?: number;
  profitFactor?: number;
  runConfig?: any;
  observationsCount?: number;
  confidenceInterval?: { lower: number; upper: number };
  drawdown?: number;
  [key: string]: any;
}

export interface ParameterSweepResult {
  paramName?: string;
  value?: number;
  winRate?: number;
  totalReturn?: number;
  signalsCount?: number;
  [key: string]: any;
}
