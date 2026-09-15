/**
 * Feature Research Service for Phase 3C
 * Orchestrates feature calculations, redundancy matrices, IC computations,
 * conditional probability queries, and current market similarity matching.
 */

import {
  FeatureDefinition,
  FeatureObservation,
  FeatureRedundancyPair,
  FeaturePerformanceMetrics,
  FeatureStabilityMetrics,
  ConditionalProbabilityQuery,
  ConditionalProbabilityResult,
  CurrentConditionComparison,
  FeatureSelectionReportItem,
  FeatureSelectionCriterion,
  ProbabilityCalibrationBucket
} from '../types/featureEngine';
import {
  ResearchObservation,
  HoldingHorizon
} from '../types/historicalResearch';
import { FeatureRegistry } from '../engine/features/featureRegistry';
import { FeatureCalculationEngine } from '../engine/features/featureCalculationEngine';
import { FeatureStatisticsEngine } from '../engine/features/featureStatisticsEngine';
import { ConditionalProbabilityEngine } from '../engine/features/conditionalProbabilityEngine';
import { historicalResearchService } from './historicalResearchService';
import {
  normalizedCompanies,
  getNormalizedStockBars
} from '../data/normalizedMasterData';
import { ForwardOutcomeEngine } from '../engine/research/forwardOutcomeEngine';

export interface EnrichedHistoricalItem {
  obs: ResearchObservation;
  features: Map<string, FeatureObservation>;
}

class FeatureResearchService {
  private historicalPool: EnrichedHistoricalItem[] = [];
  private isInitialized = false;
  private redundancyCache: FeatureRedundancyPair[] | null = null;
  private hypothesesTestedCount = 0;

  /**
   * Initializes or gets the enriched historical observations pool across NEPSE universe
   */
  public async getHistoricalPool(): Promise<EnrichedHistoricalItem[]> {
    if (this.isInitialized && this.historicalPool.length > 0) {
      return this.historicalPool;
    }

    const pool: EnrichedHistoricalItem[] = [];
    const targetCompanies = normalizedCompanies.slice(0, 15); // Broad representative NEPSE universe sample

    for (const company of targetCompanies) {
      const symbol = company.symbol;
      const indicators = historicalResearchService.getOrComputeIndicators(symbol);
      const bars = indicators.bars;
      if (bars.length < 50) continue;

      const allDefs = FeatureRegistry.getAllFeatures();
      const horizons: HoldingHorizon[] = [1, 3, 5, 10, 20, 30, 60];

      // Bar loop from 40 to N-1 (warmup respected)
      for (let t = 40; t < bars.length; t++) {
        const bar = bars[t];
        const featureMap = new Map<string, FeatureObservation>();

        for (const def of allDefs) {
          const featObs = FeatureCalculationEngine.calculateFeatureObservation(
            def,
            indicators,
            t,
            symbol
          );
          featureMap.set(def.featureId, featObs);
        }

        // Forward outcomes
        const forwardOutcomes = ForwardOutcomeEngine.calculateForwardReturns(
          bars,
          t,
          bar.close,
          horizons,
          {
            includeCosts: true,
            brokeragePercent: 0.35,
            sebonFeePercent: 0.015,
            dpFeeNpr: 25,
            capitalGainsTaxPercent: 5.0,
            slippagePercent: 0.1
          }
        );

        const { mfe, mae } = ForwardOutcomeEngine.calculateExcursions(
          bars,
          t,
          bar.close,
          horizons
        );

        const simulation = ForwardOutcomeEngine.simulateTargetStop(
          bars,
          t,
          bar.close,
          {
            targetPercent: 8,
            stopLossPercent: 4,
            maxHoldingBars: 20,
            ambiguousBarRule: 'CONSERVATIVE_STOP'
          },
          {
            includeCosts: true,
            brokeragePercent: 0.35,
            sebonFeePercent: 0.015,
            dpFeeNpr: 25,
            capitalGainsTaxPercent: 5.0,
            slippagePercent: 0.1
          }
        );

        // Determine Market Regime
        let regime = 'SIDEWAYS';
        if (indicators.sma20[t] !== null && indicators.sma50[t] !== null) {
          if (bar.close > indicators.sma50[t]! && indicators.sma20[t]! > indicators.sma50[t]!) {
            regime = 'BULL';
          } else if (bar.close < indicators.sma50[t]! && indicators.sma20[t]! < indicators.sma50[t]!) {
            regime = 'BEAR';
          }
        }

        const obs: ResearchObservation = {
          id: `OBS-${symbol}-${bar.date}-${t}`,
          symbol,
          companyId: `cmp-${symbol.toLowerCase()}`,
          timestamp: bar.date,
          barIndex: t,
          timeframe: 'DAILY',
          close: bar.close,
          volume: bar.volume,
          marketRegime: regime as any,
          sector: company.sector_id || 'Commercial Banks',
          features: {},
          signalConditions: [],
          entryModel: 'SIGNAL_CLOSE',
          entryPrice: bar.close,
          entryDate: bar.date,
          forwardOutcomes,
          mfe,
          mae,
          simulation,
          calculationVersion: 'FEAT_V1',
          dataVersion: 'NEPSE-NORM-2026.1'
        };

        pool.push({ obs, features: featureMap });
      }
    }

    this.historicalPool = pool;
    this.isInitialized = true;
    return this.historicalPool;
  }

  /**
   * Computes Redundancy Matrix for all pairs of features
   */
  public async computeRedundancyMatrix(): Promise<FeatureRedundancyPair[]> {
    if (this.redundancyCache) return this.redundancyCache;

    const pool = await this.getHistoricalPool();
    const allDefs = FeatureRegistry.getAllFeatures();
    const pairs: FeatureRedundancyPair[] = [];

    for (let i = 0; i < allDefs.length; i++) {
      for (let j = i + 1; j < allDefs.length; j++) {
        const defA = allDefs[i];
        const defB = allDefs[j];

        const valsA: number[] = [];
        const valsB: number[] = [];

        for (const item of pool) {
          const obsA = item.features.get(defA.featureId);
          const obsB = item.features.get(defB.featureId);
          if (
            obsA &&
            obsB &&
            obsA.value !== null &&
            obsB.value !== null &&
            !isNaN(obsA.value) &&
            !isNaN(obsB.value)
          ) {
            valsA.push(obsA.normalizedValue ?? obsA.value);
            valsB.push(obsB.normalizedValue ?? obsB.value);
          }
        }

        if (valsA.length >= 20) {
          const pearson = FeatureStatisticsEngine.calculatePearsonCorrelation(valsA, valsB);
          const spearman = FeatureStatisticsEngine.calculateSpearmanCorrelation(valsA, valsB);
          const redundancyFlag = Math.abs(spearman) >= 0.70 || Math.abs(pearson) >= 0.70;

          let interpretation = 'Complementary information (Low overlap)';
          if (Math.abs(spearman) >= 0.85) {
            interpretation = 'Severe redundancy (Nearly identical information)';
          } else if (redundancyFlag) {
            interpretation = 'High redundancy (Overlapping momentum or trend signal)';
          } else if (Math.abs(spearman) >= 0.45) {
            interpretation = 'Moderate co-movement';
          }

          pairs.push({
            featureA: defA.featureId,
            featureB: defB.featureId,
            featureAName: defA.name,
            featureBName: defB.name,
            categoryA: defA.category,
            categoryB: defB.category,
            pearsonCorrelation: pearson,
            spearmanCorrelation: spearman,
            sampleSize: valsA.length,
            redundancyFlag,
            interpretation
          });
        }
      }
    }

    pairs.sort((a, b) => Math.abs(b.spearmanCorrelation) - Math.abs(a.spearmanCorrelation));
    this.redundancyCache = pairs;
    return pairs;
  }

  /**
   * Evaluates Feature Historical Performance & Information Coefficient (IC) across features
   */
  public async computeFeaturePerformanceMetrics(
    horizon: HoldingHorizon = 20
  ): Promise<FeaturePerformanceMetrics[]> {
    const pool = await this.getHistoricalPool();
    const allDefs = FeatureRegistry.getAllFeatures();
    const metrics: FeaturePerformanceMetrics[] = [];
    const pValuesForFdr: { id: string; pValue: number }[] = [];

    for (const def of allDefs) {
      const featVals: number[] = [];
      const returns: number[] = [];
      const mfes: number[] = [];
      const maes: number[] = [];
      let positiveCount = 0;

      for (const item of pool) {
        const obs = item.features.get(def.featureId);
        const ret = item.obs.forwardOutcomes[horizon]?.netReturnPercent;
        if (obs && obs.value !== null && ret !== undefined) {
          featVals.push(obs.normalizedValue ?? obs.value);
          returns.push(ret);
          if (ret > 0) positiveCount++;
          const m = item.obs.mfe[horizon]?.favorablePercent;
          if (m !== undefined) mfes.push(m);
          const a = item.obs.mae[horizon]?.adversePercent;
          if (a !== undefined) maes.push(a);
        }
      }

      const count = returns.length;
      if (count >= 10) {
        const icResult = FeatureStatisticsEngine.calculateInformationCoefficient(featVals, returns);
        const winRate = (positiveCount / count) * 100;
        const meanRet = returns.reduce((a, b) => a + b, 0) / count;
        const medianRet = [...returns].sort((a, b) => a - b)[Math.floor(count / 2)];

        const wins = returns.filter(r => r > 0);
        const losses = returns.filter(r => r < 0);
        const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
        const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 1;
        const pWin = wins.length / count;
        const pLoss = losses.length / count;
        const expectancy = pWin * avgWin - pLoss * avgLoss;
        const grossGains = wins.reduce((a, b) => a + b, 0);
        const grossLosses = Math.abs(losses.reduce((a, b) => a + b, 0));
        const profitFactor = grossLosses > 0 ? grossGains / grossLosses : null;

        const mfeMean = mfes.length > 0 ? mfes.reduce((a, b) => a + b, 0) / mfes.length : 0;
        const maeMean = maes.length > 0 ? maes.reduce((a, b) => a + b, 0) / maes.length : 0;

        // Baseline returns for effect size
        const allReturns = pool
          .map(p => p.obs.forwardOutcomes[horizon]?.netReturnPercent)
          .filter((r): r is number => r !== undefined);
        const effectSize = FeatureStatisticsEngine.calculateEffectSize(returns, allReturns);

        // Wilson Confidence Interval
        const p_hat = positiveCount / count;
        const z = 1.96;
        const denom = 1 + (z * z) / count;
        const center = p_hat + (z * z) / (2 * count);
        const margin = z * Math.sqrt((p_hat * (1 - p_hat) + (z * z) / (4 * count)) / count);
        const ci = {
          rate: Math.round(p_hat * 1000) / 10,
          lower: Math.max(0, Math.round(((center - margin) / denom) * 1000) / 10),
          upper: Math.min(100, Math.round(((center + margin) / denom) * 1000) / 10),
          confidenceLevel: 0.95
        };

        pValuesForFdr.push({ id: def.featureId, pValue: icResult.pValue });

        metrics.push({
          featureId: def.featureId,
          featureName: def.name,
          category: def.category,
          horizon,
          observationsCount: count,
          winRate: Math.round(winRate * 10) / 10,
          wilsonCI: ci,
          meanReturn: Math.round(meanRet * 100) / 100,
          medianReturn: Math.round(medianRet * 100) / 100,
          expectancy: Math.round(expectancy * 100) / 100,
          profitFactor: profitFactor ? Math.round(profitFactor * 100) / 100 : null,
          mfeMean: Math.round(mfeMean * 100) / 100,
          maeMean: Math.round(maeMean * 100) / 100,
          informationCoefficient: icResult.ic,
          icPValue: icResult.pValue,
          effectSize,
          benjaminiHochbergSignificant: false,
          multipleTestingAdjustedPVal: icResult.pValue
        });
      }
    }

    // Apply Benjamini-Hochberg FDR
    const fdrMap = FeatureStatisticsEngine.benjaminiHochbergAdjustment(pValuesForFdr, 0.05);
    metrics.forEach(m => {
      const fdr = fdrMap.get(m.featureId);
      if (fdr) {
        m.multipleTestingAdjustedPVal = fdr.adjustedPValue;
        m.benjaminiHochbergSignificant = fdr.isSignificant;
      }
    });

    metrics.sort((a, b) => Math.abs(b.informationCoefficient) - Math.abs(a.informationCoefficient));
    return metrics;
  }

  /**
   * Executes a conditional probability query
   */
  public async executeConditionalQuery(
    query: ConditionalProbabilityQuery
  ): Promise<ConditionalProbabilityResult> {
    this.hypothesesTestedCount++;
    const pool = await this.getHistoricalPool();
    return ConditionalProbabilityEngine.calculateConditionalProbability(
      query,
      pool,
      pool.length,
      this.hypothesesTestedCount
    );
  }

  /**
   * Inspects current state of a stock and finds historical comparable matches
   */
  public async matchCurrentMarketCondition(
    symbol: string,
    horizon: HoldingHorizon = 20
  ): Promise<CurrentConditionComparison> {
    const pool = await this.getHistoricalPool();
    const indicators = historicalResearchService.getOrComputeIndicators(symbol);
    const bars = indicators.bars;
    const lastBarIdx = bars.length - 1;

    const allDefs = FeatureRegistry.getAllFeatures();
    const currentFeatures = new Map<string, FeatureObservation>();

    allDefs.forEach(def => {
      const feat = FeatureCalculationEngine.calculateFeatureObservation(
        def,
        indicators,
        lastBarIdx,
        symbol
      );
      currentFeatures.set(def.featureId, feat);
    });

    // Extract default condition criteria based on stock's current regime
    const currentRsi = currentFeatures.get('FEAT_RSI_14_ZONE')?.value ?? 50;
    const currentSmaDist = currentFeatures.get('FEAT_PRICE_VS_SMA50_ATR')?.value ?? 0;
    const currentVolRatio = currentFeatures.get('FEAT_VOLUME_MA20_RATIO')?.value ?? 1.0;

    const targetConditions = [
      {
        featureId: 'FEAT_PRICE_VS_SMA50_ATR',
        comparator: currentSmaDist >= 0 ? ('>=' as const) : ('<' as const),
        value: currentSmaDist >= 0 ? 0 : 0,
        label: currentSmaDist >= 0 ? 'Price >= SMA50' : 'Price < SMA50'
      },
      {
        featureId: 'FEAT_RSI_14_ZONE',
        comparator: 'BETWEEN' as const,
        minValue: Math.max(0, currentRsi - 10),
        maxValue: Math.min(100, currentRsi + 10),
        label: `RSI between ${Math.round(currentRsi - 10)} - ${Math.round(currentRsi + 10)}`
      },
      {
        featureId: 'FEAT_VOLUME_MA20_RATIO',
        comparator: currentVolRatio >= 1.0 ? ('>=' as const) : ('<' as const),
        value: 1.0,
        label: currentVolRatio >= 1.0 ? 'Volume >= 20-day Average' : 'Volume < 20-day Average'
      }
    ];

    return ConditionalProbabilityEngine.matchCurrentConditions(
      currentFeatures,
      pool,
      targetConditions,
      symbol,
      horizon
    );
  }

  /**
   * Generates Feature Selection Report comparing Train, Validation, and Test
   */
  public async generateFeatureSelectionReport(
    criterion: FeatureSelectionCriterion
  ): Promise<FeatureSelectionReportItem[]> {
    const pool = await this.getHistoricalPool();
    const allDefs = FeatureRegistry.getAllFeatures();
    const redundancy = await this.computeRedundancyMatrix();

    const trainPool = pool.filter(p => p.obs.timestamp <= '2023-12-31');
    const valPool = pool.filter(
      p => p.obs.timestamp > '2023-12-31' && p.obs.timestamp <= '2025-06-30'
    );
    const testPool = pool.filter(p => p.obs.timestamp > '2025-06-30');

    const report: FeatureSelectionReportItem[] = [];
    const selectedFeatureIds = new Set<string>();

    for (const def of allDefs) {
      // 1. Train metrics
      const trainRets: number[] = [];
      let trainWins = 0;
      for (const item of trainPool) {
        const obs = item.features.get(def.featureId);
        const ret = item.obs.forwardOutcomes[20]?.netReturnPercent;
        if (obs && obs.value !== null && ret !== undefined) {
          trainRets.push(ret);
          if (ret > 0) trainWins++;
        }
      }
      const trainSize = trainRets.length;
      const trainWinRate = trainSize > 0 ? (trainWins / trainSize) * 100 : 0;
      const trainMeanRet =
        trainSize > 0 ? trainRets.reduce((a, b) => a + b, 0) / trainSize : 0;

      // 2. Validation metrics
      const valRets: number[] = [];
      let valWins = 0;
      for (const item of valPool) {
        const obs = item.features.get(def.featureId);
        const ret = item.obs.forwardOutcomes[20]?.netReturnPercent;
        if (obs && obs.value !== null && ret !== undefined) {
          valRets.push(ret);
          if (ret > 0) valWins++;
        }
      }
      const valSize = valRets.length;
      const valWinRate = valSize > 0 ? (valWins / valSize) * 100 : 0;
      const valMeanRet = valSize > 0 ? valRets.reduce((a, b) => a + b, 0) / valSize : 0;

      // 3. Test metrics (Untouched evaluation)
      const testRets: number[] = [];
      let testWins = 0;
      for (const item of testPool) {
        const obs = item.features.get(def.featureId);
        const ret = item.obs.forwardOutcomes[20]?.netReturnPercent;
        if (obs && obs.value !== null && ret !== undefined) {
          testRets.push(ret);
          if (ret > 0) testWins++;
        }
      }
      const testSize = testRets.length;
      const testWinRate = testSize > 0 ? (testWins / testSize) * 100 : 0;
      const testMeanRet =
        testSize > 0 ? testRets.reduce((a, b) => a + b, 0) / testSize : 0;

      // Stability score
      const stab = ConditionalProbabilityEngine.calculateFeatureStability(
        def.featureId,
        def.name,
        pool,
        20
      );

      // Max correlation with already selected features
      let maxCorr = 0;
      for (const selId of selectedFeatureIds) {
        const pair = redundancy.find(
          r =>
            (r.featureA === def.featureId && r.featureB === selId) ||
            (r.featureB === def.featureId && r.featureA === selId)
        );
        if (pair) {
          const absCorr = Math.abs(pair.spearmanCorrelation);
          if (absCorr > maxCorr) maxCorr = absCorr;
        }
      }

      // Check selection criteria
      let selected = true;
      let rejectionReason: string | undefined;

      if (trainSize < criterion.minSampleSize) {
        selected = false;
        rejectionReason = `Insufficient sample size (${trainSize} < ${criterion.minSampleSize})`;
      } else if (trainWinRate < criterion.minWinRate) {
        selected = false;
        rejectionReason = `Train win rate below threshold (${trainWinRate.toFixed(1)}% < ${criterion.minWinRate}%)`;
      } else if (trainMeanRet < criterion.minMeanReturn) {
        selected = false;
        rejectionReason = `Train mean return below threshold (${trainMeanRet.toFixed(2)}% < ${criterion.minMeanReturn}%)`;
      } else if (stab.stabilityScore < criterion.minStabilityScore) {
        selected = false;
        rejectionReason = `Stability score low (${stab.stabilityScore} < ${criterion.minStabilityScore})`;
      } else if (maxCorr >= criterion.maxCorrelationThreshold) {
        selected = false;
        rejectionReason = `Redundant with selected feature (corr = ${(maxCorr * 100).toFixed(0)}% >= ${(criterion.maxCorrelationThreshold * 100).toFixed(0)}%)`;
      } else if (criterion.requireTrainAndValidationEdge && (valWinRate < 50 || valMeanRet < 0)) {
        selected = false;
        rejectionReason = `Failed validation persistence (Val win rate ${valWinRate.toFixed(1)}%)`;
      }

      if (selected) {
        selectedFeatureIds.add(def.featureId);
      }

      report.push({
        featureId: def.featureId,
        featureName: def.name,
        category: def.category,
        sampleSize: trainSize,
        trainWinRate: Math.round(trainWinRate * 10) / 10,
        trainMeanReturn: Math.round(trainMeanRet * 100) / 100,
        validationWinRate: Math.round(valWinRate * 10) / 10,
        validationMeanReturn: Math.round(valMeanRet * 100) / 100,
        testWinRate: Math.round(testWinRate * 10) / 10,
        testMeanReturn: Math.round(testMeanRet * 100) / 100,
        stabilityScore: stab.stabilityScore,
        maxCorrelationWithSelected: Math.round(maxCorr * 100) / 100,
        selected,
        rejectionReason
      });
    }

    report.sort((a, b) => (b.selected ? 1 : 0) - (a.selected ? 1 : 0));
    return report;
  }

  /**
   * Generates Calibration Buckets for probability calibration curve
   */
  public async getProbabilityCalibrationBuckets(): Promise<ProbabilityCalibrationBucket[]> {
    const pool = await this.getHistoricalPool();
    const predictions: { predictedProb: number; actualOutcome: boolean }[] = [];

    // Synthesize historical predictions based on composite score & RSI
    for (const item of pool) {
      const comp = item.features.get('FEAT_BULLISH_ALIGNMENT_SCORE')?.value ?? 2;
      const rsi = item.features.get('FEAT_RSI_14_ZONE')?.value ?? 50;
      const outcome = (item.obs.forwardOutcomes[20]?.netReturnPercent ?? 0) > 0;

      // Base model: 45% base + 4% per bullish alignment point + (RSI-50)*0.2
      const rawPred = 45 + comp * 4 + (rsi - 50) * 0.2;
      const clampedPred = Math.max(25, Math.min(75, rawPred));

      predictions.push({
        predictedProb: clampedPred,
        actualOutcome: outcome
      });
    }

    return FeatureStatisticsEngine.calculateCalibrationCurve(predictions, 10);
  }
}

export const featureResearchService = new FeatureResearchService();
