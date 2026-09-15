import { WatchlistItem, PortfolioPosition, PortfolioSummary, WatchlistStatus } from '../types';
import { mockWatchlistItems, mockPortfolioPositions, mockPortfolioSummary } from '../data/mockData';
import { stockService } from './stockService';

class PortfolioService {
  private watchlist: WatchlistItem[] = [...mockWatchlistItems];
  private positions: PortfolioPosition[] = [...mockPortfolioPositions];

  // ==========================================
  // Watchlist Methods
  // ==========================================
  public async getWatchlist(): Promise<WatchlistItem[]> {
    return [...this.watchlist];
  }

  public async addToWatchlist(symbol: string, thesis: string = '', notes: string = ''): Promise<WatchlistItem> {
    const stock = await stockService.getStockBySymbol(symbol);
    const existing = this.watchlist.find(w => w.symbol.toUpperCase() === symbol.toUpperCase());
    if (existing) return existing;

    const newItem: WatchlistItem = {
      id: `wl-${Date.now()}`,
      symbol: symbol.toUpperCase(),
      companyName: stock ? stock.name : symbol.toUpperCase(),
      sectorName: stock ? stock.sectorName : 'Unknown',
      currentPrice: stock ? stock.ltp : 500,
      priceChange: stock ? stock.change : 0,
      priceChangePercent: stock ? stock.changePercent : 0,
      targetPrice: stock ? Math.round(stock.ltp * 1.15) : undefined,
      stopLossPrice: stock ? Math.round(stock.ltp * 0.94) : undefined,
      status: 'WATCHING',
      opportunityScore: 70,
      thesis: thesis || 'Candidate for technical continuation and broker accumulation.',
      notes: notes || 'Tracking volume behavior around key moving averages.',
      addedAt: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    this.watchlist = [newItem, ...this.watchlist];
    return newItem;
  }

  public async removeFromWatchlist(id: string): Promise<void> {
    this.watchlist = this.watchlist.filter(w => w.id !== id);
  }

  public async updateWatchlistStatus(id: string, status: WatchlistStatus): Promise<void> {
    this.watchlist = this.watchlist.map(w => {
      if (w.id === id) {
        return { ...w, status, lastUpdated: new Date().toISOString().split('T')[0] };
      }
      return w;
    });
  }

  public async updateWatchlistItem(id: string, updates: Partial<WatchlistItem>): Promise<void> {
    this.watchlist = this.watchlist.map(w => {
      if (w.id === id) {
        return { ...w, ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
      }
      return w;
    });
  }

  // ==========================================
  // Portfolio Positions Methods
  // ==========================================
  public async getPortfolioPositions(): Promise<PortfolioPosition[]> {
    // Re-calculate weights and unrealized PL
    const totalVal = this.positions.reduce((acc, p) => acc + p.quantity * p.currentPrice, 0);
    return this.positions.map(p => {
      const curVal = p.quantity * p.currentPrice;
      const unPL = curVal - p.investedAmount;
      const unPLPct = p.investedAmount > 0 ? (unPL / p.investedAmount) * 100 : 0;
      const totRet = unPL + p.dividendReceived;
      const totRetPct = p.investedAmount > 0 ? (totRet / p.investedAmount) * 100 : 0;
      return {
        ...p,
        currentValue: curVal,
        unrealizedPL: unPL,
        unrealizedPLPercent: Math.round(unPLPct * 100) / 100,
        totalReturn: totRet,
        totalReturnPercent: Math.round(totRetPct * 100) / 100,
        weightPercent: totalVal > 0 ? Math.round((curVal / totalVal) * 1000) / 10 : 0,
      };
    });
  }

  public async getPortfolioSummary(): Promise<PortfolioSummary> {
    const positions = await this.getPortfolioPositions();
    const totalInvested = positions.reduce((acc, p) => acc + p.investedAmount, 0);
    const totalCurrentValue = positions.reduce((acc, p) => acc + p.currentValue, 0);
    const totalUnrealizedPL = totalCurrentValue - totalInvested;
    const totalUnrealizedPLPercent = totalInvested > 0 ? (totalUnrealizedPL / totalInvested) * 100 : 0;
    const totalDividends = positions.reduce((acc, p) => acc + p.dividendReceived, 0);

    return {
      ...mockPortfolioSummary,
      totalInvested,
      totalCurrentValue,
      totalUnrealizedPL,
      totalUnrealizedPLPercent: Math.round(totalUnrealizedPLPercent * 100) / 100,
      totalDividends,
      positionsCount: positions.length,
    };
  }

  public async addPosition(symbol: string, quantity: number, averagePurchasePrice: number): Promise<void> {
    const stock = await stockService.getStockBySymbol(symbol);
    const curPrice = stock ? stock.ltp : averagePurchasePrice;
    const invested = quantity * averagePurchasePrice;
    const curVal = quantity * curPrice;
    const unPL = curVal - invested;

    const newPos: PortfolioPosition = {
      id: `pos-${Date.now()}`,
      symbol: symbol.toUpperCase(),
      companyName: stock ? stock.name : symbol.toUpperCase(),
      sectorName: stock ? stock.sectorName : 'Equities',
      quantity,
      averagePurchasePrice,
      currentPrice: curPrice,
      investedAmount: invested,
      currentValue: curVal,
      unrealizedPL: unPL,
      unrealizedPLPercent: (unPL / invested) * 100,
      dividendReceived: 0,
      totalReturn: unPL,
      totalReturnPercent: (unPL / invested) * 100,
      weightPercent: 0,
      entryDate: new Date().toISOString().split('T')[0],
    };

    this.positions = [...this.positions, newPos];
  }

  public async removePosition(id: string): Promise<void> {
    this.positions = this.positions.filter(p => p.id !== id);
  }
}

export const portfolioService = new PortfolioService();
