export interface DecisionIntelligenceResult {
  score: number;
  [key: string]: any;
}

export interface DecisionAssessment {
  symbol?: string;
  verdict?: string;
  confidence?: number;
  [key: string]: any;
}

export interface MarketWideEvidenceRankingItem {
  symbol: string;
  score: number;
  [key: string]: any;
}

export interface RiskRewardParameters {
  target?: number;
  stop?: number;
  ratio?: number;
  [key: string]: any;
}

export type DecisionIntelligenceEventType = string;

export interface DecisionIntelligenceEvent {
  type: DecisionIntelligenceEventType;
  timestamp: string;
  data?: any;
  [key: string]: any;
}

export interface HistoricalComparableCondition {
  [key: string]: any;
}

export interface HorizonProbabilityDistribution {
  [key: string]: any;
}

export interface DecisionProbabilityResult {
  [key: string]: any;
}
