/**
 * Conditional Probability Engine for Phase 3C
 * Calculates transparent empirical probabilities P(outcome | conditions),
 * historical similarity matching, Bayesian smoothing, multi-regime breakdowns,
 * and out-of-sample partition filtering.
 */

import {
  ConditionTree,
  FeatureCondition,
  ConditionalProbabilityQuery,
  ConditionalProbabilityResult,
  HistoricalSimilarityMatch,
  CurrentConditionComparison,
  FeatureStabilityMetrics,
  FeatureObservation,
  OutcomeType
} from '../../types/featureEngine';
import {
  ResearchObservation,
  HoldingHorizon,
  SampleSizeTier,
  MarketRegimeType
} from '../../types/historicalResearch';
import { ResearchStatisticsEngine } from '../research/researchStatisticsEngine';
import { FeatureStatisticsEngine } from './featureStatisticsEngine';

export class ConditionalProbabilityEngine {
  /**
   * Evaluates a single FeatureCondition against a feature map
   */
  public static evaluateCondition(
    condition: FeatureCondition,
    features: Map<string, FeatureObservation>
  ): boolean {
    const obs = features.get(condition.featureId);
    if (!obs || obs.value === null || isNaN(obs.value)) return false;

    const val = obs.normalizedValue !== null ? obs.normalizedValue : obs.value;

    switch (condition.comparator) {
      case '>':
        return condition.value !== undefined && val > condition.value;
      case '<':
        return condition.value !== undefined && val < condition.value;
      case '>=':
        return condition.value !== undefined && val >= condition.value;
      case '<=':
        return condition.value !== undefined && val <= condition.value;
      case '==':
        return condition.value !== undefined && Math.abs(val - condition.value) < 0.001;
      case 'BETWEEN':
        return (
          condition.minValue !== undefined &&
          condition.maxValue !== undefined &&
          val >= condition.minValue &&
          val <= condition.maxValue
        );
      case 'IN_BIN':
        return condition.binId !== undefined && obs.binId === condition.binId;
      default:
        return false;
    }
  }

  /**
   * Recursively evaluates a ConditionTree
   */
  public static evaluateConditionTree(
    tree: ConditionTree,
    features: Map<string, FeatureObservation>
  ): boolean {
    if (!tree.conditions || tree.conditions.length === 0) return true;

    if (tree.operator === 'AND') {
      return tree.conditions.every(c => {
        if ('operator' in c) {
          return this.evaluateConditionTree(c as ConditionTree, features);
        } else {
          return this.evaluateCondition(c as FeatureCondition, features);
        }
      });
    } else {
      return tree.conditions.some(c => {
        if ('operator' in c) {
          return this.evaluateConditionTree(c as ConditionTree, features);
        } else {
          return this.evaluateCondition(c as FeatureCondition, features);
        }
      });
    }
  }

  /**
   * Counts the number of atomic conditions in a tree (complexity tracking)
   */
  public static countConditions(tree: ConditionTree): number {
    let count = 0;
    for (const c of tree.conditions) {
      if ('operator' in c) {
        count += this.countConditions(c as ConditionTree);
      } else {
        count += 1;
      }
    }
    return count;
  }

  /**
   * Evaluates if a historical observation meets the outcome criteria
   */
  public static evaluateOutcome(
    obs: ResearchObservation,
    horizon: HoldingHorizon,
    outcomeType: OutcomeType,
    threshold?: number
  ): boolean {
    const forward = obs.forwardOutcomes[horizon];
    if (!forward) return false;

    const netRet = forward.netReturnPercent;

    switch (outcomeType) {
      case 'POSITIVE_RETURN':
        return netRet > 0;
      case 'RETURN_GT_2':
        return netRet >= 2.0;
      case 'RETURN_GT_5':
        return netRet >= 5.0;
      case 'RETURN_GT_10':
        return netRet >= 10.0;
      case 'TARGET_BEFORE_STOP':
        return obs.simulation?.outcome === 'TARGET_HIT';
      case 'MFE_GT_5':
        return (obs.mfe[horizon]?.favorablePercent ?? 0) >= 5.0;
      case 'MAE_LT_MINUS_3':
        return (obs.mae[horizon]?.adversePercent ?? 0) > -3.0; // Controlled drawdown
      default:
        return netRet > (threshold ?? 0);
    }
  }

  /**
   * Core Conditional Probability Execution
   */
  public static calculateConditionalProbability(
    query: ConditionalProbabilityQuery,
    observations: {
      obs: ResearchObservation;
      features: Map<string, FeatureObservation>;
    }[],
    totalUniverseBars: number,
    hypothesesTestedCount: number = 1
  ): ConditionalProbabilityResult {
    const horizon = query.horizon;
    const conditionCount = this.countConditions(query.conditionTree);

    // 1. Filter observations by partition
    const partitioned = observations.filter(item => {
      const date = item.obs.timestamp;
      if (query.partition === 'TRAIN') {
        return date <= '2023-12-31';
      } else if (query.partition === 'VALIDATION') {
        return date > '2023-12-31' && date <= '2025-06-30';
      } else if (query.partition === 'TEST') {
        return date > '2025-06-30';
      }
      return true; // FULL
    });

    // 2. Filter observations that satisfy the condition tree
    const matching = partitioned.filter(item =>
      this.evaluateConditionTree(query.conditionTree, item.features)
    );

    const obsCount = matching.length;
    let positiveCount = 0;
    const returns: number[] = [];
    const mfes: number[] = [];
    const maes: number[] = [];

    matching.forEach(item => {
      const isPositive = this.evaluateOutcome(
        item.obs,
        horizon,
        query.outcome.type,
        query.outcome.thresholdPercent
      );
      if (isPositive) positiveCount++;

      const netRet = item.obs.forwardOutcomes[horizon]?.netReturnPercent;
      if (netRet !== undefined) returns.push(netRet);

      const mfeVal = item.obs.mfe[horizon]?.favorablePercent;
      if (mfeVal !== undefined) mfes.push(mfeVal);

      const maeVal = item.obs.mae[horizon]?.adversePercent;
      if (maeVal !== undefined) maes.push(maeVal);
    });

    const negativeCount = obsCount - positiveCount;
    const rawProb = obsCount > 0 ? (positiveCount / obsCount) * 100 : 0;

    // Wilson 95% Confidence Interval
    const ci = ResearchStatisticsEngine.calculateWilsonScoreInterval(positiveCount, obsCount);

    // Bayesian Beta-Binomial Smoothing
    const bayes = FeatureStatisticsEngine.calculateBayesianSmoothedProbability(
      positiveCount,
      obsCount,
      5,
      5
    );

    // Return distribution stats
    const dist = ResearchStatisticsEngine.calculateDistribution(returns);
    const mfeDist = ResearchStatisticsEngine.calculateDistribution(mfes);
    const maeDist = ResearchStatisticsEngine.calculateDistribution(maes);
    const expResult = ResearchStatisticsEngine.calculateExpectancy(returns);

    // Sample size classification
    const sampleTier = ResearchStatisticsEngine.classifySampleSize(obsCount);

    // Multiple testing warning calculation
    let multipleTestingRisk: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
    let warningMsg = 'Condition complexity within standard limits.';
    if (conditionCount >= 4 || hypothesesTestedCount > 15) {
      multipleTestingRisk = 'HIGH';
      warningMsg = `High risk of data snooping: ${conditionCount} active conditions tested across ${hypothesesTestedCount} queries.`;
    } else if (conditionCount >= 3 || hypothesesTestedCount > 5) {
      multipleTestingRisk = 'MODERATE';
      warningMsg = `Moderate testing complexity: ${conditionCount} conditions combined. Validate out-of-sample.`;
    }

    // Regime Breakdown
    const regimeMap = new Map<MarketRegimeType, { count: number; pos: number; returns: number[] }>();
    const allRegimes: MarketRegimeType[] = ['BULL', 'BEAR', 'SIDEWAYS', 'HIGH_VOLATILITY', 'LOW_VOLATILITY'];
    allRegimes.forEach(r => regimeMap.set(r, { count: 0, pos: 0, returns: [] }));

    matching.forEach(item => {
      const reg = item.obs.marketRegime;
      const entry = regimeMap.get(reg);
      if (entry) {
        entry.count++;
        const isPos = this.evaluateOutcome(item.obs, horizon, query.outcome.type);
        if (isPos) entry.pos++;
        const ret = item.obs.forwardOutcomes[horizon]?.netReturnPercent;
        if (ret !== undefined) entry.returns.push(ret);
      }
    });

    const regimeBreakdown = Array.from(regimeMap.entries())
      .filter(([_, data]) => data.count > 0)
      .map(([regime, data]) => ({
        regime,
        observations: data.count,
        probability: Math.round((data.pos / data.count) * 1000) / 10,
        meanReturn:
          data.returns.length > 0
            ? Math.round((data.returns.reduce((a, b) => a + b, 0) / data.returns.length) * 100) / 100
            : 0
      }));

    // Sector Breakdown
    const sectorMap = new Map<string, { count: number; pos: number; returns: number[] }>();
    matching.forEach(item => {
      const sec = item.obs.sector;
      if (!sectorMap.has(sec)) {
        sectorMap.set(sec, { count: 0, pos: 0, returns: [] });
      }
      const entry = sectorMap.get(sec)!;
      entry.count++;
      if (this.evaluateOutcome(item.obs, horizon, query.outcome.type)) entry.pos++;
      const ret = item.obs.forwardOutcomes[horizon]?.netReturnPercent;
      if (ret !== undefined) entry.returns.push(ret);
    });

    const sectorBreakdown = Array.from(sectorMap.entries()).map(([sector, data]) => ({
      sector,
      observations: data.count,
      probability: Math.round((data.pos / data.count) * 1000) / 10,
      meanReturn:
        data.returns.length > 0
          ? Math.round((data.returns.reduce((a, b) => a + b, 0) / data.returns.length) * 100) / 100
          : 0
    }));

    // Time stability by year
    const yearMap = new Map<string, { count: number; pos: number; returns: number[] }>();
    matching.forEach(item => {
      const year = item.obs.timestamp.substring(0, 4);
      if (!yearMap.has(year)) {
        yearMap.set(year, { count: 0, pos: 0, returns: [] });
      }
      const entry = yearMap.get(year)!;
      entry.count++;
      if (this.evaluateOutcome(item.obs, horizon, query.outcome.type)) entry.pos++;
      const ret = item.obs.forwardOutcomes[horizon]?.netReturnPercent;
      if (ret !== undefined) entry.returns.push(ret);
    });

    const timeStability = Array.from(yearMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, data]) => ({
        period,
        observations: data.count,
        probability: Math.round((data.pos / data.count) * 1000) / 10,
        meanReturn:
          data.returns.length > 0
            ? Math.round((data.returns.reduce((a, b) => a + b, 0) / data.returns.length) * 100) / 100
            : 0
      }));

    return {
      researchRunId: query.queryId,
      query,
      conditionsLabel: `Conditions [${conditionCount} rules] on ${query.outcome.label}`,
      symbolUniverse: query.universe === 'SINGLE' ? query.selectedSymbol || 'CHCL' : 'ALL_NEPSE',
      timeframe: query.timeframe,
      horizon,
      entryModel: query.entryModel,
      totalUniverseBars,
      observations: obsCount,
      positiveCount,
      negativeCount,
      rawProbability: Math.round(rawProb * 10) / 10,
      smoothedProbability: bayes.smoothedRate,
      bayesianPrior: {
        alpha: bayes.priorAlpha,
        beta: bayes.priorBeta,
        priorMean: bayes.priorMean
      },
      confidenceInterval: ci,
      meanReturn: dist.mean,
      medianReturn: dist.median,
      mfe: { mean: mfeDist.mean, median: mfeDist.median },
      mae: { mean: maeDist.mean, median: maeDist.median },
      expectancy: expResult.expectancy,
      profitFactor: expResult.profitFactor,
      sampleTier: sampleTier.tier,
      smallSampleWarning: sampleTier.isWarning,
      multipleTestingWarning: {
        hypothesesTestedCount,
        riskLevel: multipleTestingRisk,
        message: warningMsg
      },
      regimeBreakdown,
      sectorBreakdown,
      timeStability,
      datasetVersion: 'NEPSE-NORM-2026.1',
      featureCalculationVersion: 'FEAT_V1'
    };
  }

  /**
   * Matches current market conditions of a stock to comparable historical setups
   */
  public static matchCurrentConditions(
    currentFeatures: Map<string, FeatureObservation>,
    historicalPool: {
      obs: ResearchObservation;
      features: Map<string, FeatureObservation>;
    }[],
    targetConditions: FeatureCondition[],
    symbol: string,
    horizon: HoldingHorizon = 20
  ): CurrentConditionComparison {
    const matches: HistoricalSimilarityMatch[] = [];

    for (const item of historicalPool) {
      const matchedConds: string[] = [];
      const unmatchedConds: string[] = [];

      let totalScore = 0;

      for (const cond of targetConditions) {
        const histFeat = item.features.get(cond.featureId);
        const currFeat = currentFeatures.get(cond.featureId);

        const histVal = histFeat?.normalizedValue ?? histFeat?.value;
        const currVal = currFeat?.normalizedValue ?? currFeat?.value;

        const passes = this.evaluateCondition(cond, item.features);
        if (passes) {
          matchedConds.push(cond.label);
          totalScore += 1;
        } else {
          unmatchedConds.push(cond.label);
          // Partial distance score if numeric values exist
          if (histVal !== undefined && currVal !== undefined && currVal !== null && histVal !== null) {
            const diffRatio = Math.abs(histVal - currVal) / (Math.abs(currVal) + 1);
            const partial = Math.max(0, 1 - diffRatio);
            totalScore += partial * 0.5;
          }
        }
      }

      const matchPercent =
        targetConditions.length > 0 ? (totalScore / targetConditions.length) * 100 : 100;

      // Retain matches with at least 70% structural similarity
      if (matchPercent >= 70) {
        matches.push({
          observationId: item.obs.id,
          symbol: item.obs.symbol,
          date: item.obs.timestamp,
          similarityScore: Math.round(matchPercent * 10) / 10,
          matchedConditions: matchedConds,
          unmatchedConditions: unmatchedConds,
          marketRegime: item.obs.marketRegime,
          forwardReturn: item.obs.forwardOutcomes[horizon]?.netReturnPercent ?? 0,
          mfe: item.obs.mfe[horizon]?.favorablePercent ?? 0,
          mae: item.obs.mae[horizon]?.adversePercent ?? 0,
          entryPrice: item.obs.entryPrice
        });
      }
    }

    // Sort by highest similarity
    matches.sort((a, b) => b.similarityScore - a.similarityScore);

    // Format current features for display
    const currentFeaturesRecord: Record<string, { value: number | null; binLabel?: string }> = {};
    currentFeatures.forEach((obs, key) => {
      currentFeaturesRecord[key] = {
        value: obs.value,
        binLabel: obs.binLabel
      };
    });

    // Create a mock synthetic conditional query for summary metrics
    const tree: ConditionTree = {
      operator: 'AND',
      conditions: targetConditions
    };

    const query: ConditionalProbabilityQuery = {
      queryId: `SIMILARITY-${symbol}`,
      conditionTree: tree,
      outcome: {
        type: 'POSITIVE_RETURN',
        label: 'Positive Return (>0%)',
        description: 'Trade finishes in positive territory'
      },
      horizon,
      entryModel: 'SIGNAL_CLOSE',
      universe: 'ALL_NEPSE',
      timeframe: 'DAILY',
      partition: 'FULL',
      costs: {
        includeCosts: true,
        brokeragePercent: 0.35,
        sebonFeePercent: 0.015,
        dpFeeNpr: 25,
        capitalGainsTaxPercent: 5.0,
        slippagePercent: 0.1
      }
    };

    const probResult = this.calculateConditionalProbability(
      query,
      historicalPool,
      historicalPool.length
    );

    return {
      symbol,
      asOfDate: new Date().toISOString().substring(0, 10),
      currentFeatures: currentFeaturesRecord,
      matchedConditionsCount: targetConditions.length,
      totalConditionsCount: targetConditions.length,
      matchesCount: matches.length,
      historicalMatches: matches.slice(0, 50), // Top 50 matches
      probabilityResult: probResult
    };
  }

  /**
   * Evaluates feature stability across years, regimes, and rolling decay windows
   */
  public static calculateFeatureStability(
    featureId: string,
    featureName: string,
    historicalPool: {
      obs: ResearchObservation;
      features: Map<string, FeatureObservation>;
    }[],
    horizon: HoldingHorizon = 20
  ): FeatureStabilityMetrics {
    const yearMap = new Map<string, { count: number; wins: number; rets: number[]; fVals: number[] }>();
    const regimeMap = new Map<MarketRegimeType, { count: number; wins: number; rets: number[] }>();
    const sectorMap = new Map<string, { count: number; wins: number; rets: number[] }>();

    for (const item of historicalPool) {
      const feat = item.features.get(featureId);
      if (!feat || feat.value === null) continue;

      const ret = item.obs.forwardOutcomes[horizon]?.netReturnPercent;
      if (ret === undefined) continue;

      const isWin = ret > 0;
      const year = item.obs.timestamp.substring(0, 4);
      const reg = item.obs.marketRegime;
      const sec = item.obs.sector;

      // Year
      if (!yearMap.has(year)) yearMap.set(year, { count: 0, wins: 0, rets: [], fVals: [] });
      const yData = yearMap.get(year)!;
      yData.count++;
      if (isWin) yData.wins++;
      yData.rets.push(ret);
      yData.fVals.push(feat.normalizedValue ?? feat.value);

      // Regime
      if (!regimeMap.has(reg)) regimeMap.set(reg, { count: 0, wins: 0, rets: [] });
      const rData = regimeMap.get(reg)!;
      rData.count++;
      if (isWin) rData.wins++;
      rData.rets.push(ret);

      // Sector
      if (!sectorMap.has(sec)) sectorMap.set(sec, { count: 0, wins: 0, rets: [] });
      const sData = sectorMap.get(sec)!;
      sData.count++;
      if (isWin) sData.wins++;
      sData.rets.push(ret);
    }

    // By Year array
    const byYear = Array.from(yearMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, d]) => {
        const icCalc = FeatureStatisticsEngine.calculateInformationCoefficient(d.fVals, d.rets);
        return {
          year,
          observations: d.count,
          winRate: Math.round((d.wins / d.count) * 1000) / 10,
          meanReturn: Math.round((d.rets.reduce((a, b) => a + b, 0) / d.count) * 100) / 100,
          ic: icCalc.ic
        };
      });

    // By Regime array
    const byRegime = Array.from(regimeMap.entries()).map(([regime, d]) => ({
      regime,
      observations: d.count,
      winRate: Math.round((d.wins / d.count) * 1000) / 10,
      meanReturn: Math.round((d.rets.reduce((a, b) => a + b, 0) / d.count) * 100) / 100
    }));

    // By Sector array
    const bySector = Array.from(sectorMap.entries()).map(([sector, d]) => ({
      sector,
      observations: d.count,
      winRate: Math.round((d.wins / d.count) * 1000) / 10,
      meanReturn: Math.round((d.rets.reduce((a, b) => a + b, 0) / d.count) * 100) / 100
    }));

    // Rolling decay windows
    const rollingWindows = [
      { label: '2020-2021', startYear: '2020', endYear: '2021' },
      { label: '2022-2023', startYear: '2022', endYear: '2023' },
      { label: '2024-2025', startYear: '2024', endYear: '2025' }
    ];

    const decayRollingWindows = rollingWindows.map(rw => {
      let winCount = 0;
      let total = 0;
      const rets: number[] = [];
      const fVals: number[] = [];

      for (const item of historicalPool) {
        const year = item.obs.timestamp.substring(0, 4);
        if (year >= rw.startYear && year <= rw.endYear) {
          const feat = item.features.get(featureId);
          const ret = item.obs.forwardOutcomes[horizon]?.netReturnPercent;
          if (feat && feat.value !== null && ret !== undefined) {
            total++;
            if (ret > 0) winCount++;
            rets.push(ret);
            fVals.push(feat.normalizedValue ?? feat.value);
          }
        }
      }

      const icRes = FeatureStatisticsEngine.calculateInformationCoefficient(fVals, rets);
      return {
        windowLabel: rw.label,
        winRate: total > 0 ? Math.round((winCount / total) * 1000) / 10 : 0,
        meanReturn: total > 0 ? Math.round((rets.reduce((a, b) => a + b, 0) / total) * 100) / 100 : 0,
        ic: icRes.ic,
        sampleSize: total
      };
    });

    // Compute stability score (0-100)
    // Measures consistency of win rates and IC across years
    const yearlyWinRates = byYear.map(y => y.winRate);
    let stabilityScore = 50;
    if (yearlyWinRates.length >= 3) {
      const avgWin = yearlyWinRates.reduce((a, b) => a + b, 0) / yearlyWinRates.length;
      const variance =
        yearlyWinRates.reduce((sum, w) => sum + Math.pow(w - avgWin, 2), 0) / yearlyWinRates.length;
      const std = Math.sqrt(variance);
      // Lower standard deviation across years = higher stability
      stabilityScore = Math.max(0, Math.min(100, Math.round(100 - std * 4)));
    }

    return {
      featureId,
      featureName,
      byYear,
      byRegime,
      bySector,
      decayRollingWindows,
      stabilityScore,
      isPersistent: stabilityScore >= 60
    };
  }
}
