import { TechnicalIndicators, TechnicalScoreBreakdown } from '../types';
import { mockTechnicalIndicatorsCHCL, mockTechnicalScoreCHCL } from '../data/mockData';
import { stockService } from './stockService';

class TechnicalService {
  public async getIndicators(symbol: string): Promise<TechnicalIndicators> {
    if (symbol.toUpperCase() === 'CHCL') {
      return { ...mockTechnicalIndicatorsCHCL };
    }
    const stock = await stockService.getStockBySymbol(symbol);
    const ltp = stock ? stock.ltp : 500;
    
    // Generate deterministic technical values relative to price
    return {
      symbol: symbol.toUpperCase(),
      date: '2026-09-11',
      price: ltp,
      sma20: Math.round(ltp * 0.96 * 10) / 10,
      sma50: Math.round(ltp * 0.92 * 10) / 10,
      sma200: Math.round(ltp * 0.85 * 10) / 10,
      ema20: Math.round(ltp * 0.97 * 10) / 10,
      rsi14: Math.min(78, Math.max(34, Math.round((55 + (stock ? stock.changePercent * 3.5 : 0)) * 10) / 10)),
      macd: {
        macdLine: Math.round(ltp * 0.02 * 10) / 10,
        signalLine: Math.round(ltp * 0.015 * 10) / 10,
        histogram: Math.round(ltp * 0.005 * 10) / 10,
      },
      bollingerBands: {
        upper: Math.round(ltp * 1.05 * 10) / 10,
        middle: Math.round(ltp * 0.96 * 10) / 10,
        lower: Math.round(ltp * 0.88 * 10) / 10,
        bandwidth: 12.4,
      },
      atr14: Math.round(ltp * 0.03 * 10) / 10,
      adx14: 26.4,
      plusDI: 29.5,
      minusDI: 16.2,
      obv: 3200000,
      volumeMA20: stock ? Math.round(stock.volume * 0.85) : 200000,
      roc14: stock ? stock.changePercent * 2 : 5.4,
      momentum10: Math.round(ltp * 0.04 * 10) / 10,
      vwap: Math.round(ltp * 0.99 * 10) / 10,
    };
  }

  /**
   * Deterministic Technical Scoring Engine
   * Calculates sub-scores (0-20 each, total 100) based on mathematical indicator rules
   */
  public calculateTechnicalScore(indicators: TechnicalIndicators): TechnicalScoreBreakdown {
    const { price, sma20, sma50, sma200, ema20, rsi14, macd, volumeMA20, bollingerBands } = indicators;

    // 1. Trend Score (Max 20)
    let trendScore = 0;
    if (price > ema20) trendScore += 6;
    if (price > sma50) trendScore += 6;
    if (price > sma200) trendScore += 5;
    if (ema20 > sma50) trendScore += 3;

    // 2. Momentum Score (Max 20)
    let momentumScore = 0;
    if (rsi14 >= 50 && rsi14 <= 70) momentumScore += 8; // Healthy bullish zone
    else if (rsi14 > 70 && rsi14 <= 80) momentumScore += 6; // Strong momentum but nearing extended
    else if (rsi14 < 35) momentumScore += 4; // Oversold potential
    else momentumScore += 3;

    if (macd.histogram > 0) momentumScore += 6;
    if (macd.macdLine > macd.signalLine) momentumScore += 6;

    // 3. Volume Score (Max 20)
    // Compare against 20-day moving average
    let volumeScore = 14;
    const isVolumeSurging = indicators.price >= sma20;
    if (isVolumeSurging) volumeScore += 4;
    if (indicators.obv > 0) volumeScore += 2;

    // 4. Structure Score (Max 20)
    let structureScore = 0;
    const isAboveBollingerMid = price > bollingerBands.middle;
    if (isAboveBollingerMid) structureScore += 8;
    if (price <= bollingerBands.upper) structureScore += 6; // Not pierced extreme band
    if (indicators.adx14 > 22) structureScore += 6; // Established directional trend

    // 5. Volatility Score (Max 20)
    let volatilityScore = 0;
    if (indicators.atr14 > 0) {
      const atrPercent = (indicators.atr14 / price) * 100;
      if (atrPercent <= 4.0) volatilityScore += 16; // manageable risk
      else if (atrPercent <= 6.5) volatilityScore += 12;
      else volatilityScore += 8;
    } else {
      volatilityScore = 14;
    }

    const totalScore = trendScore + momentumScore + volumeScore + structureScore + volatilityScore;

    const keyObservations: string[] = [];
    if (price > sma200) keyObservations.push(`Trading above long-term 200 SMA (${sma200.toFixed(1)} NPR)`);
    if (price > ema20) keyObservations.push(`Holding above short-term 20 EMA (${ema20.toFixed(1)} NPR)`);
    if (rsi14 >= 60) keyObservations.push(`RSI(14) at ${rsi14.toFixed(1)} denotes bullish buying pressure`);
    if (macd.histogram > 0) keyObservations.push(`Positive MACD histogram (+${macd.histogram.toFixed(2)}) indicates expanding momentum`);

    return {
      totalScore: Math.min(100, Math.max(0, totalScore)),
      trendScore,
      momentumScore,
      volumeScore,
      structureScore,
      volatilityScore,
      trendCondition: totalScore >= 75 ? 'Strong Uptrend' : totalScore >= 55 ? 'Uptrend' : totalScore >= 40 ? 'Consolidation' : 'Downtrend',
      momentumCondition: rsi14 > 65 ? 'Strongly Bullish' : rsi14 > 50 ? 'Bullish' : rsi14 > 40 ? 'Neutral' : 'Bearish',
      volumeConfirmation: volumeScore >= 14,
      supportLevel: Math.round(sma20 * 0.99),
      resistanceLevel: Math.round(bollingerBands.upper * 1.01),
      keyObservations
    };
  }

  public async getScoreForSymbol(symbol: string): Promise<TechnicalScoreBreakdown> {
    if (symbol.toUpperCase() === 'CHCL') {
      return { ...mockTechnicalScoreCHCL };
    }
    const indicators = await this.getIndicators(symbol);
    return this.calculateTechnicalScore(indicators);
  }
}

export const technicalService = new TechnicalService();
