import { ScoringWeights } from '../types';
import { dataService } from './dataService';

export interface ScoreInput {
  technicalScore: number; // 0-100
  fundamentalScore: number; // 0-100
  marketScore: number; // 0-100
  brokerScore: number; // 0-100
  riskScore: number; // 0-100 (where 100 means lowest risk/most favorable risk profile)
}

export interface ScoreOutput {
  overallScore: number; // 0-100
  weightsUsed: ScoringWeights;
  componentContributions: {
    technical: number;
    fundamental: number;
    market: number;
    broker: number;
    risk: number;
  };
}

class ScoringService {
  public getWeights(): ScoringWeights {
    return dataService.getSettings().scoringWeights;
  }

  public setWeights(newWeights: ScoringWeights): void {
    dataService.updateScoringWeights(newWeights);
  }

  /**
   * Transparent Deterministic Opportunity Score Calculator
   * Normalizes weights dynamically to 100%
   */
  public calculateOpportunityScore(input: ScoreInput, customWeights?: ScoringWeights): ScoreOutput {
    const weights = customWeights || this.getWeights();
    const sumWeights = weights.technical + weights.fundamental + weights.market + weights.broker + weights.risk;
    const normFactor = sumWeights > 0 ? 100 / sumWeights : 1;

    const normTechnical = weights.technical * normFactor;
    const normFundamental = weights.fundamental * normFactor;
    const normMarket = weights.market * normFactor;
    const normBroker = weights.broker * normFactor;
    const normRisk = weights.risk * normFactor;

    const technicalContribution = (input.technicalScore * normTechnical) / 100;
    const fundamentalContribution = (input.fundamentalScore * normFundamental) / 100;
    const marketContribution = (input.marketScore * normMarket) / 100;
    const brokerContribution = (input.brokerScore * normBroker) / 100;
    const riskContribution = (input.riskScore * normRisk) / 100;

    const overall = technicalContribution + fundamentalContribution + marketContribution + brokerContribution + riskContribution;

    return {
      overallScore: Math.round(Math.min(100, Math.max(0, overall))),
      weightsUsed: {
        technical: Math.round(normTechnical),
        fundamental: Math.round(normFundamental),
        market: Math.round(normMarket),
        broker: Math.round(normBroker),
        risk: Math.round(normRisk),
      },
      componentContributions: {
        technical: Math.round(technicalContribution * 10) / 10,
        fundamental: Math.round(fundamentalContribution * 10) / 10,
        market: Math.round(marketContribution * 10) / 10,
        broker: Math.round(brokerContribution * 10) / 10,
        risk: Math.round(riskContribution * 10) / 10,
      }
    };
  }
}

export const scoringService = new ScoringService();
