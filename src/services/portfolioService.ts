import { PortfolioPosition, PortfolioSummary, WatchlistItem, WatchlistStatus } from '../types';
import { mockPortfolioPositions, mockPortfolioSummary, mockWatchlistItems, mockCompanies } from '../data/mockData';

let positions: PortfolioPosition[] = [...mockPortfolioPositions];
let watchlist: WatchlistItem[] = [...mockWatchlistItems];

function recalculateSummary(): PortfolioSummary {
  const totalInvested = positions.reduce((acc, p) => acc + p.investedAmount, 0);
  const totalCurrentValue = positions.reduce((acc, p) => acc + p.currentValue, 0);
  const totalUnrealizedPL = totalCurrentValue - totalInvested;
  const totalUnrealizedPLPercent = totalInvested > 0 ? (totalUnrealizedPL / totalInvested) * 100 : 0;

  return {
    ...mockPortfolioSummary,
    totalInvested,
    totalCurrentValue,
    totalUnrealizedPL,
    totalUnrealizedPLPercent,
    positionsCount: positions.length,
  };
}

export const portfolioService = {
  async getPortfolioSummary(): Promise<PortfolioSummary> {
    return recalculateSummary();
  },

  async getPortfolioPositions(): Promise<PortfolioPosition[]> {
    return [...positions];
  },

  async addPosition(symbol: string, quantity: number, averagePurchasePrice: number): Promise<PortfolioPosition> {
    const sym = symbol.toUpperCase().trim();
    const company = mockCompanies.find(c => c.symbol.toUpperCase() === sym);
    const currentPrice = company ? company.ltp : averagePurchasePrice;
    const investedAmount = quantity * averagePurchasePrice;
    const currentValue = quantity * currentPrice;
    const unrealizedPL = currentValue - investedAmount;
    const unrealizedPLPercent = investedAmount > 0 ? (unrealizedPL / investedAmount) * 100 : 0;

    const newPos: PortfolioPosition = {
      id: `pos-${Date.now()}`,
      symbol: sym,
      companyName: company ? company.name : sym,
      sectorName: company ? company.sectorName : 'Other',
      quantity,
      averagePurchasePrice,
      currentPrice,
      investedAmount,
      currentValue,
      unrealizedPL,
      unrealizedPLPercent,
      dividendReceived: 0,
      totalReturn: unrealizedPL,
      totalReturnPercent: unrealizedPLPercent,
      weightPercent: 0,
      entryDate: new Date().toISOString().split('T')[0],
    };

    positions.unshift(newPos);
    return newPos;
  },

  async removePosition(id: string): Promise<void> {
    positions = positions.filter(p => p.id !== id);
  },

  async getWatchlist(): Promise<WatchlistItem[]> {
    return [...watchlist];
  },

  async addToWatchlist(symbol: string, thesis?: string, notes?: string): Promise<WatchlistItem> {
    const sym = symbol.toUpperCase().trim();
    const existing = watchlist.find(w => w.symbol.toUpperCase() === sym);
    if (existing) {
      if (thesis) existing.thesis = thesis;
      if (notes) existing.notes = notes;
      existing.lastUpdated = new Date().toISOString().split('T')[0];
      return existing;
    }

    const company = mockCompanies.find(c => c.symbol.toUpperCase() === sym);
    const currentPrice = company ? company.ltp : 100;
    const priceChange = company ? company.change : 0;
    const priceChangePercent = company ? company.changePercent : 0;

    const newItem: WatchlistItem = {
      id: `wl-${Date.now()}`,
      symbol: sym,
      companyName: company ? company.name : sym,
      sectorName: company ? company.sectorName : 'Other',
      currentPrice,
      priceChange,
      priceChangePercent,
      status: 'WATCHING',
      opportunityScore: 75,
      thesis: thesis || `Added for technical and trend monitoring`,
      notes: notes || 'Monitored via workspace',
      addedAt: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    watchlist.unshift(newItem);
    return newItem;
  },

  async updateWatchlistStatus(id: string, newStatus: WatchlistStatus): Promise<void> {
    const item = watchlist.find(w => w.id === id);
    if (item) {
      item.status = newStatus;
      item.lastUpdated = new Date().toISOString().split('T')[0];
    }
  },

  async removeFromWatchlist(id: string): Promise<void> {
    watchlist = watchlist.filter(w => w.id !== id);
  }
};

