import { Company, CandleData } from '../types';
import { mockCompanies, mockCandlesCHCL } from '../data/mockData';
import { priceHistoryService } from './priceHistoryService';
import { companyRepository } from '../repositories/companyRepository';
import { providerRegistry } from '../providers/providerRegistry';

class StockService {
  public async getAllStocks(): Promise<Company[]> {
    if (providerRegistry.getMode() === 'MOCK_DATA') {
      return [...mockCompanies];
    }
    // Live mode: call companyRepository. LiveDataSourceUnavailableError will be thrown if unauthenticated.
    const companies = await companyRepository.getAllCompanies();
    return companies.map(c => ({
      id: c.id,
      symbol: c.symbol,
      name: c.company_name || c.symbol,
      sectorId: c.sector_id,
      sectorName: c.sector_id,
      listingDate: c.listed_date || '2020-01-01',
      paidUpCapital: c.paid_up_capital || 0,
      sharesOutstanding: c.listed_shares || 0,
      promoterHoldingPercent: 51,
      publicHoldingPercent: 49,
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
      isActive: c.status === 'ACTIVE',
    }));
  }

  public async getStockBySymbol(symbol: string): Promise<Company | null> {
    const stocks = await this.getAllStocks();
    const found = stocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
    return found || null;
  }

  public async searchStocks(query: string): Promise<Company[]> {
    const q = query.trim().toUpperCase();
    if (!q) return this.getAllStocks();
    const stocks = await this.getAllStocks();
    return stocks.filter(
      s => s.symbol.toUpperCase().includes(q) || s.name.toUpperCase().includes(q) || s.sectorName.toUpperCase().includes(q)
    );
  }

  /**
   * Data pipeline: stockService -> priceHistoryService -> priceRepository -> provider
   */
  public async getStockCandles(symbol: string, timeframe: '1D' | '1W' | '1M' | 'INTRA' = '1D'): Promise<CandleData[]> {
    if (providerRegistry.getMode() === 'REAL_DATA') {
      // Live mode: strictly inquire priceHistoryService, never substitute mock candles
      const historicalRecords = await priceHistoryService.getHistoricalPrices(symbol);
      const sortedAsc = [...historicalRecords].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      return sortedAsc.map(p => ({
        timestamp: `${p.date} 15:00:00`,
        date: p.date,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
        turnover: p.turnover,
      }));
    }

    // 1. Inquire priceHistoryService for normalized price records in MOCK mode
    const historicalRecords = await priceHistoryService.getHistoricalPrices(symbol);
    const stock = await this.getStockBySymbol(symbol);
    const targetLTP = stock ? stock.ltp : 500;

    // If historical price records exist for this symbol, format them into candle series
    if (historicalRecords.length >= 3 && timeframe === '1D') {
      const sortedAsc = [...historicalRecords].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      return sortedAsc.map(p => ({
        timestamp: `${p.date} 15:00:00`,
        date: p.date,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
        turnover: p.turnover,
      }));
    }

    // Otherwise use calibrated base series relative to stock LTP
    const base = mockCandlesCHCL;
    const scale = targetLTP / 548.0;

    if (timeframe === '1D') {
      return base.map(c => ({
        ...c,
        open: Math.round(c.open * scale * 10) / 10,
        high: Math.round(c.high * scale * 10) / 10,
        low: Math.round(c.low * scale * 10) / 10,
        close: Math.round(c.close * scale * 10) / 10,
        volume: Math.round(c.volume * (stock ? stock.volume / 384500 : 1)),
      }));
    }

    if (timeframe === 'INTRA') {
      // 15-minute intraday snapshots
      const times = ['11:15', '11:45', '12:15', '12:45', '13:15', '13:45', '14:15', '14:45', '15:00'];
      let current = stock ? stock.openPrice : targetLTP * 0.98;
      return times.map(t => {
        const step = (Math.random() - 0.45) * 4;
        const open = Math.round(current * 10) / 10;
        const close = Math.round((current + step) * 10) / 10;
        const high = Math.round((Math.max(open, close) + Math.random() * 2) * 10) / 10;
        const low = Math.round((Math.min(open, close) - Math.random() * 2) * 10) / 10;
        current = close;
        return {
          timestamp: `2026-09-11 ${t}:00`,
          date: t,
          open,
          high,
          low,
          close,
          volume: Math.round(20000 + Math.random() * 40000),
        };
      });
    }

    // Weekly or monthly aggregates
    return base.slice(-12).map((c, idx) => ({
      ...c,
      date: timeframe === '1W' ? `Wk ${idx + 1}` : `M${idx + 1}`,
      open: Math.round(c.open * scale * 10) / 10,
      high: Math.round(c.high * scale * 1.02 * 10) / 10,
      low: Math.round(c.low * scale * 0.98 * 10) / 10,
      close: Math.round(c.close * scale * 10) / 10,
      volume: Math.round(c.volume * 3.5),
    }));
  }
}

export const stockService = new StockService();
