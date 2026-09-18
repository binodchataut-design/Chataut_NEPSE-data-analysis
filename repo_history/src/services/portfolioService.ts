export const portfolioService = {
  async getPortfolioSummary() {
    return {
      totalValue: 1250000,
      totalInvestment: 1100000,
      totalProfitLoss: 150000,
      totalProfitLossPercent: 13.64,
      positionsCount: 5,
    };
  },
  async getPortfolioPositions() {
    return [];
  }
};
