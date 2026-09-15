import { RawFinancialStatement, CalculatedFinancialRatios } from '../types/dataInfrastructure';

/**
 * FundamentalCalculationService
 * Pure deterministic calculation engine for financial ratios.
 * Strict separation of raw balance-sheet/income statement metrics from calculated financial ratios.
 */
export class FundamentalCalculationService {
  /**
   * Calculates all standard financial valuation and solvency ratios from a raw financial statement
   */
  public calculateRatios(
    raw: RawFinancialStatement,
    currentMarketPrice: number
  ): CalculatedFinancialRatios {
    // Total Shares in nominal count
    const totalShares = raw.total_shares > 0 ? raw.total_shares * 1_000_000 : 1;

    // 1. Earnings Per Share (EPS in NPR)
    // Net profit is reported in NPR Millions
    const eps = (raw.net_profit * 1_000_000) / totalShares;

    // 2. Book Value Per Share (in NPR)
    // Equity is reported in NPR Millions
    const bookValue = (raw.equity * 1_000_000) / totalShares;

    // 3. Return on Equity (ROE %)
    const roe = raw.equity > 0 ? (raw.net_profit / raw.equity) * 100 : 0;

    // 4. Return on Assets (ROA %)
    const roa = raw.total_assets > 0 ? (raw.net_profit / raw.total_assets) * 100 : 0;

    // 5. Debt to Equity Ratio (Solvency)
    const debtToEquity = raw.equity > 0 ? raw.total_liabilities / raw.equity : 0;

    // 6. Current Ratio (Liquidity)
    const currentRatio =
      raw.current_liabilities > 0 ? raw.current_assets / raw.current_liabilities : 0;

    // 7. Price to Earnings (P/E) Ratio
    const peRatio = eps > 0 ? currentMarketPrice / eps : 0;

    // 8. Price to Book (P/B) Ratio
    const pbRatio = bookValue > 0 ? currentMarketPrice / bookValue : 0;

    // 9. Dividend Yield %
    const totalDividendPercent = (raw.declared_cash_dividend || 0) + (raw.declared_bonus_dividend || 0);
    // On face value 100
    const totalDividendPerShareNpr = (totalDividendPercent / 100) * 100;
    const dividendYield = currentMarketPrice > 0 ? (totalDividendPerShareNpr / currentMarketPrice) * 100 : 0;

    return {
      id: `ratio-${raw.id}`,
      company_id: raw.company_id,
      symbol: raw.symbol,
      fiscal_year: raw.fiscal_year,
      quarter: raw.quarter,
      eps: Math.round(eps * 100) / 100,
      book_value: Math.round(bookValue * 100) / 100,
      roe: Math.round(roe * 100) / 100,
      roa: Math.round(roa * 100) / 100,
      debt_to_equity: Math.round(debtToEquity * 100) / 100,
      current_ratio: Math.round(currentRatio * 100) / 100,
      pe_ratio: Math.round(peRatio * 100) / 100,
      pb_ratio: Math.round(pbRatio * 100) / 100,
      dividend_yield: Math.round(dividendYield * 100) / 100,
      calculated_at: new Date().toISOString(),
    };
  }

  /**
   * Helper to calculate Year-over-Year growth
   */
  public calculateYoYGrowth(currentPeriod: number, priorPeriod: number): number {
    if (priorPeriod === 0) return 0;
    const growth = ((currentPeriod - priorPeriod) / Math.abs(priorPeriod)) * 100;
    return Math.round(growth * 100) / 100;
  }
}

export const fundamentalCalculationService = new FundamentalCalculationService();
