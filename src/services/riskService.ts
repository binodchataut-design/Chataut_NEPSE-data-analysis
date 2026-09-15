import { RiskAlert } from '../types';
import { mockRiskAlerts } from '../data/mockData';

export interface PositionSizeResult {
  riskCapitalAmount: number; // in NPR
  stopDistancePoints: number; // in NPR
  stopDistancePercent: number; // %
  recommendedShares: number; // quantity of shares to buy
  totalPositionValue: number; // in NPR
  portfolioExposurePercent: number; // % of total account
  riskRewardRatio: number;
  potentialProfitAmount: number;
  potentialLossAmount: number;
  isWithinRiskParameters: boolean;
  warnings: string[];
}

class RiskService {
  public async getActiveRiskAlerts(): Promise<RiskAlert[]> {
    return [...mockRiskAlerts];
  }

  /**
   * Deterministic Risk Management Position Sizing Engine
   * Calculates mathematical position size based on dollar risk per trade
   */
  public calculatePositionSize(
    accountCapital: number,
    riskPercentPerTrade: number,
    entryPrice: number,
    stopLossPrice: number,
    targetPrice?: number
  ): PositionSizeResult {
    const riskCapitalAmount = (accountCapital * riskPercentPerTrade) / 100;
    const stopDistancePoints = Math.max(0.1, entryPrice - stopLossPrice);
    const stopDistancePercent = (stopDistancePoints / entryPrice) * 100;

    // Shares = Dollar Risk / Risk Per Share
    const rawShares = riskCapitalAmount / stopDistancePoints;
    const recommendedShares = Math.floor(rawShares);
    const totalPositionValue = recommendedShares * entryPrice;
    const portfolioExposurePercent = accountCapital > 0 ? (totalPositionValue / accountCapital) * 100 : 0;

    const potentialLossAmount = recommendedShares * stopDistancePoints;
    const targetDistance = targetPrice && targetPrice > entryPrice ? targetPrice - entryPrice : stopDistancePoints * 2;
    const potentialProfitAmount = recommendedShares * targetDistance;
    const riskRewardRatio = Math.round((targetDistance / stopDistancePoints) * 100) / 100;

    const warnings: string[] = [];
    if (portfolioExposurePercent > 35) {
      warnings.push(`Position size (${portfolioExposurePercent.toFixed(1)}% of capital) exceeds prudent 35% single-stock concentration.`);
    }
    if (stopDistancePercent > 12) {
      warnings.push(`Stop loss distance (${stopDistancePercent.toFixed(1)}%) is wider than standard 8% threshold. High volatility risk.`);
    }
    if (riskRewardRatio < 1.8) {
      warnings.push(`Risk/Reward (${riskRewardRatio}:1) is below recommended 2:1 ratio for NEPSE trend trades.`);
    }

    return {
      riskCapitalAmount: Math.round(riskCapitalAmount),
      stopDistancePoints: Math.round(stopDistancePoints * 10) / 10,
      stopDistancePercent: Math.round(stopDistancePercent * 100) / 100,
      recommendedShares,
      totalPositionValue: Math.round(totalPositionValue),
      portfolioExposurePercent: Math.round(portfolioExposurePercent * 10) / 10,
      riskRewardRatio,
      potentialProfitAmount: Math.round(potentialProfitAmount),
      potentialLossAmount: Math.round(potentialLossAmount),
      isWithinRiskParameters: warnings.length === 0,
      warnings,
    };
  }
}

export const riskService = new RiskService();
