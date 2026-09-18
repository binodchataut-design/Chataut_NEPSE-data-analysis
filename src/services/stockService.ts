import { getCachedBars, getCachedCompany, getCachedCompanies } from '../data/liveBarsCache';
import { Company, CandleData } from '../types';
import { CompanyMaster } from '../types/dataInfrastructure';

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function buildCompanyView(companyMaster: CompanyMaster): Company {
  const bars = getCachedBars(companyMaster.symbol);

  if (bars.length === 0) {
    return {
      id: companyMaster.id,
      symbol: companyMaster.symbol,
      name: companyMaster.company_name,
      sectorId: companyMaster.sector_id,
      sectorName: companyMaster.sector_id,
      listingDate: companyMaster.listed_date || '',
      paidUpCapital: companyMaster.paid_up_capital ?? 0,
      sharesOutstanding: companyMaster.listed_shares ?? 0,
      promoterHoldingPercent: 0,
      publicHoldingPercent: 0,
      ltp: 0,
      openPrice: 0,
      highPrice: 0,
      lowPrice: 0,
      previousClose: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      turnover: 0,
      transactions: 0,
      fiftyTwoWeekHigh: 0,
      fiftyTwoWeekLow: 0,
      isActive: companyMaster.status === 'ACTIVE',
    };
  }

  const lastBar = bars[bars.length - 1];
  const prevBar = bars.length > 1 ? bars[bars.length - 2] : null;
  const previousClose = prevBar ? prevBar.close : lastBar.open;
  const change = round(lastBar.close - previousClose, 2);
  const changePercent = previousClose !== 0 ? round((change / previousClose) * 100, 2) : 0;

  const recentBars = bars.slice(-252);
  let fiftyTwoWeekHigh = recentBars[0].high;
  let fiftyTwoWeekLow = recentBars[0].low;
  for (let i = 1; i < recentBars.length; i++) {
    if (recentBars[i].high > fiftyTwoWeekHigh) fiftyTwoWeekHigh = recentBars[i].high;
    if (recentBars[i].low < fiftyTwoWeekLow) fiftyTwoWeekLow = recentBars[i].low;
  }

  return {
    id: companyMaster.id,
    symbol: companyMaster.symbol,
    name: companyMaster.company_name,
    sectorId: companyMaster.sector_id,
    sectorName: companyMaster.sector_id,
    listingDate: companyMaster.listed_date || '',
    paidUpCapital: companyMaster.paid_up_capital ?? 0,
    sharesOutstanding: companyMaster.listed_shares ?? 0,
    promoterHoldingPercent: 0,
    publicHoldingPercent: 0,
    ltp: lastBar.close,
    openPrice: lastBar.open,
    highPrice: lastBar.high,
    lowPrice: lastBar.low,
    previousClose,
    change,
    changePercent,
    volume: lastBar.volume,
    turnover: lastBar.turnover || (lastBar.close * lastBar.volume),
    transactions: 0,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    isActive: companyMaster.status === 'ACTIVE',
  };
}

export const stockService = {
  async getHistory(symbol: string) {
    return getCachedBars(symbol);
  },
  async getHistoricalPrices(symbol: string) {
    return getCachedBars(symbol);
  },
  async getCompany(symbol: string) {
    return getCachedCompany(symbol);
  },
  async getAllCompanies() {
    return getCachedCompanies();
  },

  async getAllStocks(): Promise<Company[]> {
    const companies = getCachedCompanies();
    return companies.map(buildCompanyView);
  },

  async getStockBySymbol(symbol: string): Promise<Company | null> {
    const companyMaster = getCachedCompany(symbol);
    if (!companyMaster) {
      return null;
    }
    return buildCompanyView(companyMaster);
  },

  async getStockCandles(symbol: string, timeframe?: 'INTRA' | '1D' | '1W' | '1M' | string): Promise<CandleData[]> {
    const bars = getCachedBars(symbol);
    return bars.map(bar => ({
      timestamp: bar.date,
      date: bar.date,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
      turnover: bar.turnover,
    }));
  },

  async searchStocks(query: string): Promise<Company[]> {
    const allStocks = await this.getAllStocks();
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      return allStocks.slice(0, 20);
    }
    return allStocks
      .filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .slice(0, 20);
  }
};

