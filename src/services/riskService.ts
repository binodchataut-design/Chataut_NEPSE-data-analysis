import { RiskAlert } from '../types';
import { mockRiskAlerts } from '../data/mockData';

export interface PositionSizeResult {
  recommendedShares: number;
  totalPositionValue: number;
  potentialLossAmount: number;
  stopDistancePercent: number;
  riskRewardRatio: number;
  potentialProfitAmount: number;
  portfolioExposurePercent: number;
  warnings: string[];
}

export const riskService = {
  async getActiveRiskAlerts(): Promise<RiskAlert[]> {
    return mockRiskAlerts;
  },

  calculatePositionSize(
    capital: number,
    riskPercent: number,
    entryPrice: number,
    stopPrice: number,
    targetPrice: number
  ): PositionSizeResult {
    const maxRiskAmount = capital * (riskPercent / 100);
    const riskPerShare = Math.max(0.1, entryPrice - stopPrice);
    const rawShares = Math.floor(maxRiskAmount / riskPerShare);
    const recommendedShares = Math.max(10, Math.floor(rawShares / 10) * 10); // round to lot of 10
    const totalPositionValue = recommendedShares * entryPrice;
    const potentialLossAmount = recommendedShares * riskPerShare;
    const stopDistancePercent = ((entryPrice - stopPrice) / entryPrice) * 100;
    const rewardPerShare = Math.max(0, targetPrice - entryPrice);
    const potentialProfitAmount = recommendedShares * rewardPerShare;
    const riskRewardRatio = Number((rewardPerShare / riskPerShare).toFixed(2));
    const portfolioExposurePercent = Number(((totalPositionValue / capital) * 100).toFixed(1));

    const warnings: string[] = [];
    if (portfolioExposurePercent > 25) {
      warnings.push(`Single stock exposure (${portfolioExposurePercent}%) exceeds standard 25% portfolio limit.`);
    }
    if (stopDistancePercent > 10) {
      warnings.push(`Stop distance is wide (${stopDistancePercent.toFixed(1)}%). Consider tightening stop or seeking higher timeframe confirmation.`);
    }
    if (riskRewardRatio < 1.5) {
      warnings.push(`Risk-to-reward ratio (${riskRewardRatio}:1) is below the minimum favorable threshold of 1.5:1.`);
    }

    return {
      recommendedShares,
      totalPositionValue,
      potentialLossAmount,
      stopDistancePercent,
      riskRewardRatio,
      potentialProfitAmount,
      portfolioExposurePercent,
      warnings,
    };
  }
};

