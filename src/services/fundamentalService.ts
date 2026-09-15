import { FundamentalMetrics, FundamentalScoreBreakdown } from '../types';
import { mockFundamentalCHCL, mockFundamentalScoreCHCL } from '../data/mockData';
import { stockService } from './stockService';
import { fundamentalRepository } from '../repositories/fundamentalRepository';
import { fundamentalCalculationService } from './fundamentalCalculationService';
import { dataService } from './dataService';
import { LiveDataSourceUnavailableError } from '../types/dataInfrastructure';

class FundamentalService {
  public async getMetrics(symbol: string): Promise<FundamentalMetrics> {
    if (dataService.getMode() === 'REAL_DATA') {
      const raw = await fundamentalRepository.getLatestStatement(symbol);
      if (!raw) {
        throw new LiveDataSourceUnavailableError(
          'LiveFundamentalDataProvider',
          `Quarterly disclosure statements for ${symbol} unavailable on live exchange feed.`
        );
      }
      const stock = await stockService.getStockBySymbol(symbol);
      const ltp = stock ? stock.ltp : 0;
      const calculated = fundamentalCalculationService.calculateRatios(raw, ltp);
      const totalShares = raw.total_shares > 0 ? raw.total_shares : 10;
      return {
        symbol: symbol.toUpperCase(),
        fiscalYear: raw.fiscal_year,
        quarter: raw.quarter,
        revenue: raw.revenue,
        revenueGrowthYoY: 0,
        netProfit: raw.net_profit,
        netProfitGrowthYoY: 0,
        eps: calculated.eps,
        epsGrowthYoY: 0,
        peRatio: calculated.pe_ratio,
        pbRatio: calculated.pb_ratio,
        bookValuePerShare: calculated.book_value,
        roe: calculated.roe,
        roa: calculated.roa,
        debtToEquity: calculated.debt_to_equity,
        currentRatio: calculated.current_ratio,
        dividendYield: calculated.dividend_yield,
        lastCashDividendPercent: raw.declared_cash_dividend,
        lastBonusDividendPercent: raw.declared_bonus_dividend,
        marketCap: Math.round((ltp * totalShares) / 1000) / 10,
      };
    }

    const raw = await fundamentalRepository.getLatestStatement(symbol);
    const stock = await stockService.getStockBySymbol(symbol);
    const ltp = stock ? stock.ltp : 500;

    if (raw) {
      const calculated = fundamentalCalculationService.calculateRatios(raw, ltp);
      const totalShares = raw.total_shares > 0 ? raw.total_shares : 10;
      return {
        symbol: symbol.toUpperCase(),
        fiscalYear: raw.fiscal_year,
        quarter: raw.quarter,
        revenue: raw.revenue,
        revenueGrowthYoY: 10.5,
        netProfit: raw.net_profit,
        netProfitGrowthYoY: 12.2,
        eps: calculated.eps,
        epsGrowthYoY: 9.8,
        peRatio: calculated.pe_ratio,
        pbRatio: calculated.pb_ratio,
        bookValuePerShare: calculated.book_value,
        roe: calculated.roe,
        roa: calculated.roa,
        debtToEquity: calculated.debt_to_equity,
        currentRatio: calculated.current_ratio,
        dividendYield: calculated.dividend_yield,
        lastCashDividendPercent: raw.declared_cash_dividend,
        lastBonusDividendPercent: raw.declared_bonus_dividend,
        marketCap: Math.round((ltp * totalShares) / 1000) / 10, // Billion NPR
      };
    }

    if (symbol.toUpperCase() === 'CHCL') {
      return { ...mockFundamentalCHCL };
    }

    // Default calculated approximation for other symbols
    const eps = Math.round((ltp / (18 + (stock ? stock.changePercent * 2 : 4))) * 10) / 10;
    const pe = Math.round((ltp / (eps || 1)) * 10) / 10;
    const bookValue = Math.round(ltp * 0.35 * 10) / 10;
    const pb = Math.round((ltp / (bookValue || 1)) * 10) / 10;

    return {
      symbol: symbol.toUpperCase(),
      fiscalYear: '2081/082',
      quarter: 'Q4',
      revenue: Math.round(ltp * 4.5),
      revenueGrowthYoY: 10.5,
      netProfit: Math.round(ltp * 1.8),
      netProfitGrowthYoY: 12.2,
      eps,
      epsGrowthYoY: 9.8,
      peRatio: pe,
      pbRatio: pb,
      bookValuePerShare: bookValue,
      roe: 13.5,
      roa: 7.8,
      debtToEquity: 0.55,
      currentRatio: 1.65,
      dividendYield: 2.5,
      lastCashDividendPercent: 10,
      lastBonusDividendPercent: 5,
      marketCap: Math.round((ltp * 50) / 1000) / 10,
    };
  }

  public calculateFundamentalScore(metrics: FundamentalMetrics): FundamentalScoreBreakdown {
    // 1. Profitability (Max 25)
    let profitabilityScore = 0;
    if (metrics.roe >= 15) profitabilityScore += 12;
    else if (metrics.roe >= 10) profitabilityScore += 8;
    else profitabilityScore += 5;

    if (metrics.roa >= 8) profitabilityScore += 13;
    else if (metrics.roa >= 4) profitabilityScore += 8;
    else profitabilityScore += 4;

    // 2. Growth (Max 25)
    let growthScore = 0;
    if (metrics.netProfitGrowthYoY >= 15) growthScore += 13;
    else if (metrics.netProfitGrowthYoY > 5) growthScore += 9;
    else growthScore += 4;

    if (metrics.epsGrowthYoY >= 10) growthScore += 12;
    else if (metrics.epsGrowthYoY > 0) growthScore += 8;
    else growthScore += 3;

    // 3. Valuation (Max 25)
    let valuationScore = 0;
    if (metrics.peRatio > 0 && metrics.peRatio <= 25) valuationScore += 13;
    else if (metrics.peRatio <= 35) valuationScore += 9;
    else valuationScore += 5;

    if (metrics.pbRatio <= 3.5) valuationScore += 12;
    else if (metrics.pbRatio <= 5.0) valuationScore += 8;
    else valuationScore += 4;

    // 4. Financial Health (Max 25)
    let financialHealthScore = 0;
    if (metrics.debtToEquity <= 0.8) financialHealthScore += 13;
    else if (metrics.debtToEquity <= 1.5) financialHealthScore += 8;
    else financialHealthScore += 4;

    if (metrics.currentRatio >= 1.5) financialHealthScore += 12;
    else if (metrics.currentRatio >= 1.0) financialHealthScore += 8;
    else financialHealthScore += 4;

    const totalScore = profitabilityScore + growthScore + valuationScore + financialHealthScore;

    let grade: 'A' | 'B' | 'C' | 'D' = 'C';
    if (totalScore >= 80) grade = 'A';
    else if (totalScore >= 65) grade = 'B';
    else if (totalScore >= 50) grade = 'C';
    else grade = 'D';

    return {
      totalScore: Math.min(100, Math.max(0, totalScore)),
      profitabilityScore,
      growthScore,
      valuationScore,
      financialHealthScore,
      grade,
      keyStrengths: [
        `ROE of ${metrics.roe}% with solid equity return`,
        `Solvency debt structure (D/E: ${metrics.debtToEquity}x)`,
        `Dividend yield: ${metrics.dividendYield}% (Cash: ${metrics.lastCashDividendPercent}%, Bonus: ${metrics.lastBonusDividendPercent}%)`,
      ],
      keyRisks: [
        metrics.peRatio > 30 ? `Elevated P/E multiple (${metrics.peRatio}x)` : 'Subject to NEPSE macro-credit interest rate cycles',
        'Working capital and liquidity fluctuations in interim quarters',
      ],
    };
  }

  public async getScoreForSymbol(symbol: string): Promise<FundamentalScoreBreakdown> {
    if (symbol.toUpperCase() === 'CHCL') {
      return { ...mockFundamentalScoreCHCL };
    }
    const metrics = await this.getMetrics(symbol);
    return this.calculateFundamentalScore(metrics);
  }
}

export const fundamentalService = new FundamentalService();
