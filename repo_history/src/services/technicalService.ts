export const technicalService = {
  async getTechnicalAnalysis(symbol: string) {
    return {
      symbol,
      score: 75,
      rsi: 58.4,
      macd: 'Bullish Crossover',
    };
  }
};
