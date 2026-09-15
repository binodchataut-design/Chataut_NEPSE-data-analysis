import { MarketIndex, Sector, MarketBreadth, MarketRegimeType } from '../types';
import { mockMarketIndices, mockSectors, mockMarketBreadth } from '../data/mockData';
import { dataService } from './dataService';
import { marketRepository } from '../repositories/marketRepository';
import { companyRepository } from '../repositories/companyRepository';

class MarketService {
  public async getMarketIndices(): Promise<MarketIndex[]> {
    if (dataService.isMockData()) {
      return [...mockMarketIndices];
    }
    const records = await marketRepository.getIndices();
    return records.map(r => ({
      symbol: (r.index_id as any),
      name: r.name || r.index_id,
      currentValue: r.close,
      previousClose: r.close - r.change,
      change: r.change,
      changePercent: r.change_percent,
      high: r.high,
      low: r.low,
      turnover: r.turnover,
      volume: r.volume || 0,
      totalTransactions: r.transactions || 0,
      timestamp: r.date,
    }));
  }

  public async getNepseIndex(): Promise<MarketIndex> {
    const indices = await this.getMarketIndices();
    return indices.find(i => i.symbol === 'NEPSE') || indices[0];
  }

  public async getSectors(): Promise<Sector[]> {
    if (dataService.isMockData()) {
      return [...mockSectors];
    }
    const sectors = await companyRepository.getAllSectors();
    return sectors.map(s => ({
      id: s.id,
      name: s.name,
      code: s.index_symbol || s.name.toUpperCase().slice(0, 4),
      indexValue: 0,
      change: 0,
      changePercent: 0,
      turnover: 0,
      volume: 0,
      weightPercent: 0,
    }));
  }

  public async getMarketBreadth(): Promise<MarketBreadth> {
    if (dataService.isMockData()) {
      return { ...mockMarketBreadth };
    }
    const stats = await marketRepository.getDailyStatistics();
    return {
      advancers: stats.advancers,
      decliners: stats.decliners,
      unchanged: stats.unchanged,
      advanceDeclineRatio: stats.advance_decline_ratio || (stats.decliners > 0 ? stats.advancers / stats.decliners : 1),
      aboveSma20Percent: 0,
      aboveSma50Percent: 0,
      aboveSma200Percent: 0,
      new52WeekHighs: 0,
      new52WeekLows: 0,
      totalTurnover: stats.total_turnover,
      turnoverChangePercent: 0,
      marketRegime: 'NEUTRAL',
      regimeScore: 50,
      rationale: ['Live market statistics snapshot'],
    };
  }

  /**
   * Deterministic Market Regime Calculator
   * Transparent rule-based calculation without black-box AI
   */
  public calculateDeterministicRegime(
    nepseCurrent: number,
    sma20: number,
    sma50: number,
    advancers: number,
    decliners: number,
    turnoverRatioTo20DayAvg: number
  ): {
    regime: MarketRegimeType;
    score: number;
    criteriaPassed: { rule: string; passed: boolean; weight: number }[];
  } {
    const totalIssues = advancers + decliners;
    const adRatio = decliners > 0 ? advancers / decliners : 3;

    const criteria = [
      {
        rule: 'NEPSE Index is above 20-day SMA/EMA',
        passed: nepseCurrent > sma20,
        weight: 25,
      },
      {
        rule: 'NEPSE Index is above 50-day SMA',
        passed: nepseCurrent > sma50,
        weight: 25,
      },
      {
        rule: 'Advance/Decline Ratio >= 1.50 (Advancers dominate)',
        passed: adRatio >= 1.5,
        weight: 20,
      },
      {
        rule: 'Daily turnover exceeds 20-day average volume (+10% buffer)',
        passed: turnoverRatioTo20DayAvg >= 1.10,
        weight: 15,
      },
      {
        rule: 'Advancers constitute > 60% of active participating stocks',
        passed: totalIssues > 0 ? (advancers / totalIssues) >= 0.6 : true,
        weight: 15,
      }
    ];

    let totalScore = 0;
    criteria.forEach(c => {
      if (c.passed) totalScore += c.weight;
    });

    let regime: MarketRegimeType = 'NEUTRAL';
    if (totalScore >= 85) regime = 'STRONG_BULLISH';
    else if (totalScore >= 65) regime = 'BULLISH';
    else if (totalScore >= 45) regime = 'NEUTRAL';
    else if (totalScore >= 30) regime = 'WEAK';
    else if (totalScore >= 15) regime = 'BEARISH';
    else regime = 'STRONG_BEARISH';

    return {
      regime,
      score: totalScore,
      criteriaPassed: criteria
    };
  }
}

export const marketService = new MarketService();
