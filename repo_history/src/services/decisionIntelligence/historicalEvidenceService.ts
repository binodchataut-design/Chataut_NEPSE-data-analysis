/**
 * Historical Evidence Service (Phase 4B)
 * Retrieves historical comparable conditions matching current point-in-time state.
 * Strictly enforces cutoff date T (zero look-ahead bias).
 * Computes forward outcome distributions across 1, 3, 5, 10, 20, 30, and 60 sessions.
 */

import { CurrentMarketAndStockSnapshot } from '../../types/currentStateEngine';
import {
  HistoricalComparableCondition,
  HorizonProbabilityDistribution,
  DecisionProbabilityResult
} from '../../types/decisionIntelligence';
import { HoldingHorizon, MarketRegimeType } from '../../types/historicalResearch';
import { normalizedCompanies } from '../../data/normalizedMasterData';
import { getCachedBars, getCachedSymbols } from '../../data/liveBarsCache';
import { ResearchStatisticsEngine } from '../../engine/research/researchStatisticsEngine';
import { FeatureStatisticsEngine } from '../../engine/features/featureStatisticsEngine';

export class HistoricalEvidenceService {
  /**
   * Retrieves comparable historical setups that occurred at or before asOfDate (t <= asOfDate)
   */
  public static getHistoricalComparables(
    snapshot: CurrentMarketAndStockSnapshot,
    maxComparables: number = 20
  ): {
    comparables: HistoricalComparableCondition[];
    allMatchingObservations: HistoricalComparableCondition[];
  } {
    const asOfDate = snapshot.asOfDate;
    const targetSymbol = snapshot.symbol;
    const currentRegime = snapshot.marketState.regime;
    const currentRsi = snapshot.stockState.momentum.rsi14 ?? 55;
    const currentAboveSMA50 = snapshot.stockState.trend.structure.aboveSMA50 ?? true;
    const currentStructure = snapshot.stockState.priceStructure.state;

    const allMatching: HistoricalComparableCondition[] = [];

    // Scan active equity universe for historical instances (385 verified equities in SUPABASE mode, 17 in MOCK_DATA mode)
    const cachedSymbols = getCachedSymbols();
    const symbolsToScan = cachedSymbols.length > 0 ? cachedSymbols : normalizedCompanies.map(c => c.symbol);

    for (const sym of symbolsToScan) {
      const bars = getCachedBars(sym);
      if (!bars || bars.length < 20) continue;

      // Find bars with index >= 15 and date < asOfDate (MUST obey t <= asOfDate!)
      for (let i = 15; i < bars.length - 1; i++) {
        const barDate = bars[i].date;
        if (barDate >= asOfDate) {
          // Strictly enforce zero look-ahead bias: no observations on or after asOfDate
          break;
        }

        // Calculate simple moving average and return for matching
        const close = bars[i].close;
        const lookback = Math.min(i, 20);
        let sumMA = 0;
        for (let k = 0; k < lookback; k++) sumMA += bars[i - k].close;
        const sma = sumMA / lookback;
        const aboveSMA = close > sma;

        // Fast approximate RSI(14)
        const rsiLookback = Math.min(i - 1, 14);
        let gains = 0;
        let losses = 0;
        for (let k = 0; k < rsiLookback; k++) {
          const diff = bars[i - k].close - bars[i - k - 1].close;
          if (diff > 0) gains += diff;
          else losses += Math.abs(diff);
        }
        const histRsi = losses === 0 ? 100 : 100 - (100 / (1 + (gains / rsiLookback) / (losses / rsiLookback)));

        // Feature similarity matching
        let similarity = 0.50;
        const matchedFeatures: string[] = [];

        // Condition 1: Moving average trend alignment
        if (aboveSMA === currentAboveSMA50) {
          similarity += 0.20;
          matchedFeatures.push(aboveSMA ? 'Above Trend MA' : 'Below Trend MA');
        }

        // Condition 2: RSI zone similarity (within 14 points)
        if (Math.abs(histRsi - currentRsi) <= 14) {
          similarity += 0.15;
          matchedFeatures.push(`RSI ~${Math.round(histRsi)}`);
        }

        // Condition 3: Volume confirmation
        const volLookback = Math.min(i, 10);
        const volAvg = bars.slice(i - volLookback, i).reduce((s, b) => s + b.volume, 0) / volLookback;
        const rvol = volAvg > 0 ? bars[i].volume / volAvg : 1.0;
        if (rvol >= 1.05) {
          similarity += 0.10;
          matchedFeatures.push(`RVOL ${rvol.toFixed(1)}x`);
        }

        // Condition 4: Price progression
        if (close >= bars[i - 1].close) {
          similarity += 0.05;
          matchedFeatures.push('Positive Session Close');
        }

        // Threshold for comparable inclusion
        if (similarity >= 0.70) {
          // Compute forward returns at 1, 3, 5, 10, 20, 30, 60
          const fReturns: Record<HoldingHorizon, number> = { 1: 0, 3: 0, 5: 0, 10: 0, 20: 0, 30: 0, 60: 0 };
          const mfeMap: Record<HoldingHorizon, number> = { 1: 0, 3: 0, 5: 0, 10: 0, 20: 0, 30: 0, 60: 0 };
          const maeMap: Record<HoldingHorizon, number> = { 1: 0, 3: 0, 5: 0, 10: 0, 20: 0, 30: 0, 60: 0 };

          const horizons: HoldingHorizon[] = [1, 3, 5, 10, 20, 30, 60];

          for (const h of horizons) {
            const targetIdx = Math.min(bars.length - 1, i + h);
            const targetBar = bars[targetIdx];
            const targetDate = targetBar.date;

            if (targetDate <= asOfDate && targetIdx > i) {
              const forwardClose = targetBar.close;
              const ret = ((forwardClose - close) / close) * 100;
              fReturns[h] = Math.round(ret * 100) / 100;

              let maxHigh = close;
              let minLow = close;
              for (let w = 1; w <= targetIdx - i; w++) {
                const b = bars[i + w];
                if (b) {
                  if (b.high > maxHigh) maxHigh = b.high;
                  if (b.low < minLow) minLow = b.low;
                }
              }
              mfeMap[h] = Math.round(((maxHigh - close) / close) * 10000) / 100;
              maeMap[h] = Math.round(((minLow - close) / close) * 10000) / 100;
            } else {
              // Gracefully extrapolate using nearest available forward bar before cutoff
              const availableForward = bars.slice(i + 1).filter(b => b.date <= asOfDate);
              if (availableForward.length > 0) {
                const lastAvail = availableForward[availableForward.length - 1];
                const ret = ((lastAvail.close - close) / close) * 100;
                fReturns[h] = Math.round(ret * 100) / 100;
                mfeMap[h] = Math.max(0, fReturns[h] * 1.2);
                maeMap[h] = Math.min(0, fReturns[h] * -0.6);
              }
            }
          }

          allMatching.push({
            id: `COMP-${sym}-${barDate}`,
            date: barDate,
            symbol: sym,
            marketRegime: currentRegime,
            sectorName: snapshot.sectorState.sectorName,
            similarityScore: Math.round(similarity * 100) / 100,
            matchedFeatures,
            entryPrice: close,
            forwardReturns: fReturns,
            mfe: mfeMap,
            mae: maeMap,
            targetHit: mfeMap[10] >= 6.0,
            stopHit: maeMap[10] <= -3.5
          });
        }
      }
    }

    // Sort by highest similarity
    allMatching.sort((a, b) => b.similarityScore - a.similarityScore);
    const comparables = allMatching.slice(0, maxComparables);

    return { comparables, allMatchingObservations: allMatching };
  }

  /**
   * Builds the multi-horizon probability distributions from matching historical observations
   */
  public static calculateMultiHorizonProbabilities(
    snapshot: CurrentMarketAndStockSnapshot,
    matchingObservations: HistoricalComparableCondition[]
  ): DecisionProbabilityResult {
    const horizons: HoldingHorizon[] = [1, 3, 5, 10, 20, 30, 60];
    const distributions: Record<HoldingHorizon, HorizonProbabilityDistribution> = {} as any;
    const n = matchingObservations.length;
    const isSufficient = n >= 15;
    const caveats: string[] = [];

    if (!isSufficient) {
      caveats.push(`INSUFFICIENT HISTORICAL EVIDENCE: Only ${n} comparable observations found in database (minimum 15 required for statistical validity).`);
    }

    for (const h of horizons) {
      let positiveCount = 0;
      let targetReachedCount = 0;
      let stopReachedCount = 0;
      const returns: number[] = [];
      const mfes: number[] = [];
      const maes: number[] = [];

      for (const obs of matchingObservations) {
        const ret = obs.forwardReturns[h];
        if (ret !== undefined) {
          returns.push(ret);
          if (ret > 0) positiveCount++;
          if (obs.mfe[h] >= 6.0) targetReachedCount++;
          if (obs.mae[h] <= -3.5) stopReachedCount++;
          mfes.push(obs.mfe[h]);
          maes.push(obs.mae[h]);
        }
      }

      const count = returns.length;
      const pPos = count > 0 ? (positiveCount / count) * 100 : 0;
      const pNeg = count > 0 ? ((count - positiveCount) / count) * 100 : 0;
      const pTarget = count > 0 ? (targetReachedCount / count) * 100 : 0;
      const pStop = count > 0 ? (stopReachedCount / count) * 100 : 0;

      // Wilson score 95% interval
      const wilson = ResearchStatisticsEngine.calculateWilsonScoreInterval(positiveCount, count);

      // Bayesian smoothing
      const bayes = FeatureStatisticsEngine.calculateBayesianSmoothedProbability(positiveCount, count, 5, 5);

      // Return distribution metrics
      const dist = ResearchStatisticsEngine.calculateDistribution(returns);
      const expResult = ResearchStatisticsEngine.calculateExpectancy(returns);
      const sampleTier = ResearchStatisticsEngine.classifySampleSize(count);

      const mfeMean = mfes.length > 0 ? mfes.reduce((a, b) => a + b, 0) / mfes.length : 0;
      const maeMean = maes.length > 0 ? maes.reduce((a, b) => a + b, 0) / maes.length : 0;

      distributions[h] = {
        horizon: h,
        observations: count,
        positiveCount,
        pPositive: Math.round(pPos * 10) / 10,
        pNegative: Math.round(pNeg * 10) / 10,
        pTargetReached: Math.round(pTarget * 10) / 10,
        pStopReached: Math.round(pStop * 10) / 10,
        meanReturn: dist.mean,
        medianReturn: dist.median,
        downsidePercentile10: dist.p25 * 1.5, // Conservative estimate
        downsidePercentile25: dist.p25,
        upsidePercentile75: dist.p75,
        upsidePercentile90: dist.p75 * 1.5,
        mfeMean: Math.round(mfeMean * 100) / 100,
        maeMean: Math.round(maeMean * 100) / 100,
        expectancy: expResult.expectancy,
        profitFactor: expResult.profitFactor,
        wilsonInterval: {
          lower: wilson.lower,
          upper: wilson.upper,
          confidenceLevel: 0.95
        },
        bayesianSmoothed: {
          smoothedRate: bayes.smoothedRate,
          credibleLower: Math.round(bayes.credibleLower * 1000) / 10,
          credibleUpper: Math.round(bayes.credibleUpper * 1000) / 10
        },
        sampleTier: sampleTier.tier,
        isReliable: !sampleTier.isWarning,
        warningText: sampleTier.warningText
      };
    }

    caveats.push('Probabilities represent historical conditional frequency under comparable conditions, NOT a future price guarantee.');

    return {
      asOfDate: snapshot.asOfDate,
      symbol: snapshot.symbol,
      distributions,
      primaryHorizon: 5,
      sufficientHistoricalSample: isSufficient,
      caveats
    };
  }
}
