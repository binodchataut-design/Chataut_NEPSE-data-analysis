/**
 * Feature Statistics Engine for Phase 3C
 * Handles mathematical correlation (Pearson & Spearman), Information Coefficient (IC),
 * Effect sizes (Cohen's d), Benjamini-Hochberg FDR adjustments,
 * Bayesian Beta-Binomial smoothing, and Probability Calibration.
 */

import {
  FeatureRedundancyPair,
  ProbabilityCalibrationBucket
} from '../../types/featureEngine';
import { WilsonConfidenceInterval } from '../../types/historicalResearch';

export class FeatureStatisticsEngine {
  /**
   * Calculates Pearson correlation coefficient between two numeric vectors
   */
  public static calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 3) return 0;

    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
    }
    const meanX = sumX / n;
    const meanY = sumY / n;

    let numerator = 0;
    let varX = 0;
    let varY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      varX += dx * dx;
      varY += dy * dy;
    }

    const denominator = Math.sqrt(varX * varY);
    if (denominator === 0) return 0;
    const r = numerator / denominator;
    return Math.max(-1, Math.min(1, Math.round(r * 1000) / 1000));
  }

  /**
   * Converts a numeric array into fractional ranks (handles ties cleanly)
   */
  public static computeRanks(arr: number[]): number[] {
    const indexed = arr.map((val, idx) => ({ val, idx }));
    indexed.sort((a, b) => a.val - b.val);

    const ranks = new Array(arr.length).fill(0);
    let i = 0;
    while (i < indexed.length) {
      let j = i;
      while (j < indexed.length && indexed[j].val === indexed[i].val) {
        j++;
      }
      // Average rank for ties (1-based ranking)
      const avgRank = (i + 1 + j) / 2;
      for (let k = i; k < j; k++) {
        ranks[indexed[k].idx] = avgRank;
      }
      i = j;
    }
    return ranks;
  }

  /**
   * Calculates Spearman rank correlation between two vectors
   */
  public static calculateSpearmanCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 3) return 0;
    const ranksX = this.computeRanks(x);
    const ranksY = this.computeRanks(y);
    return this.calculatePearsonCorrelation(ranksX, ranksY);
  }

  /**
   * Computes the Information Coefficient (IC)
   * Defined as the Spearman rank correlation between feature value at time T
   * and the realized forward return at horizon T+H.
   */
  public static calculateInformationCoefficient(
    featureValues: number[],
    forwardReturns: number[]
  ): { ic: number; sampleSize: number; tStat: number; pValue: number } {
    const validPairs: { feat: number; ret: number }[] = [];
    const n = Math.min(featureValues.length, forwardReturns.length);

    for (let i = 0; i < n; i++) {
      const f = featureValues[i];
      const r = forwardReturns[i];
      if (f !== null && !isNaN(f) && r !== null && !isNaN(r)) {
        validPairs.push({ feat: f, ret: r });
      }
    }

    const count = validPairs.length;
    if (count < 10) {
      return { ic: 0, sampleSize: count, tStat: 0, pValue: 1.0 };
    }

    const feats = validPairs.map(p => p.feat);
    const rets = validPairs.map(p => p.ret);
    const ic = this.calculateSpearmanCorrelation(feats, rets);

    // Approximate t-statistic: t = ic * sqrt((N - 2) / (1 - ic^2))
    const denom = Math.sqrt(Math.max(0.00001, 1 - ic * ic));
    const tStat = ic * Math.sqrt((count - 2) / denom);

    // Approximate two-tailed p-value using normal approximation for large N
    const pValue = 2 * (1 - this.approximateStandardNormalCdf(Math.abs(tStat)));

    return {
      ic: Math.round(ic * 1000) / 1000,
      sampleSize: count,
      tStat: Math.round(tStat * 100) / 100,
      pValue: Math.max(0.0001, Math.min(1.0, Math.round(pValue * 10000) / 10000))
    };
  }

  /**
   * Standard Normal CDF approximation (Abramowitz & Stegun)
   */
  private static approximateStandardNormalCdf(x: number): number {
    const b1 = 0.319381530;
    const b2 = -0.356563782;
    const b3 = 1.781477937;
    const b4 = -1.821255978;
    const b5 = 1.330274429;
    const p = 0.2316419;
    const c = 0.39894228;

    if (x >= 0.0) {
      const t = 1.0 / (1.0 + p * x);
      return 1.0 - c * Math.exp((-x * x) / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
    } else {
      const t = 1.0 / (1.0 - p * x);
      return c * Math.exp((-x * x) / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
    }
  }

  /**
   * Calculates Cohen's d effect size between conditional group and baseline
   * d = (mean_cond - mean_base) / s_pooled
   */
  public static calculateEffectSize(
    conditionalReturns: number[],
    baselineReturns: number[]
  ): number {
    if (conditionalReturns.length < 5 || baselineReturns.length < 5) return 0;

    const meanCond = conditionalReturns.reduce((a, b) => a + b, 0) / conditionalReturns.length;
    const meanBase = baselineReturns.reduce((a, b) => a + b, 0) / baselineReturns.length;

    const varCond =
      conditionalReturns.reduce((sum, v) => sum + Math.pow(v - meanCond, 2), 0) /
      (conditionalReturns.length - 1);
    const varBase =
      baselineReturns.reduce((sum, v) => sum + Math.pow(v - meanBase, 2), 0) /
      (baselineReturns.length - 1);

    const pooledVar =
      ((conditionalReturns.length - 1) * varCond + (baselineReturns.length - 1) * varBase) /
      (conditionalReturns.length + baselineReturns.length - 2);

    const pooledStd = Math.sqrt(Math.max(0.0001, pooledVar));
    const d = (meanCond - meanBase) / pooledStd;

    return Math.round(d * 100) / 100;
  }

  /**
   * Benjamini-Hochberg False Discovery Rate (FDR) adjustment for multiple testing
   * Controls FDR across M tested hypotheses.
   */
  public static benjaminiHochbergAdjustment(
    pValues: { id: string; pValue: number }[],
    alpha: number = 0.05
  ): Map<string, { adjustedPValue: number; isSignificant: boolean }> {
    const m = pValues.length;
    const result = new Map<string, { adjustedPValue: number; isSignificant: boolean }>();
    if (m === 0) return result;

    // 1. Sort ascending by raw p-value
    const sorted = [...pValues].sort((a, b) => a.pValue - b.pValue);

    // 2. Compute raw adjusted values: q_i = p_i * (m / rank)
    const rawAdjusted: number[] = new Array(m);
    for (let i = 0; i < m; i++) {
      const rank = i + 1;
      rawAdjusted[i] = (sorted[i].pValue * m) / rank;
    }

    // 3. Monotonize backwards: q_i = min(q_i, q_{i+1})
    const adjusted: number[] = new Array(m);
    adjusted[m - 1] = Math.min(1.0, rawAdjusted[m - 1]);
    for (let i = m - 2; i >= 0; i--) {
      adjusted[i] = Math.min(1.0, Math.min(rawAdjusted[i], adjusted[i + 1]));
    }

    for (let i = 0; i < m; i++) {
      const adjP = Math.round(adjusted[i] * 10000) / 10000;
      result.set(sorted[i].id, {
        adjustedPValue: adjP,
        isSignificant: adjP <= alpha
      });
    }

    return result;
  }

  /**
   * Bayesian Beta-Binomial probability smoothing
   * Prior Beta(alpha0, beta0) incorporates base rate or uninformative prior.
   * Posterior mean: (k + alpha0) / (n + alpha0 + beta0)
   */
  public static calculateBayesianSmoothedProbability(
    positiveCount: number,
    totalCount: number,
    priorAlpha: number = 5,
    priorBeta: number = 5
  ): {
    smoothedRate: number;
    priorMean: number;
    priorAlpha: number;
    priorBeta: number;
    credibleLower: number;
    credibleUpper: number;
  } {
    const priorMean = priorAlpha / (priorAlpha + priorBeta);
    const postAlpha = priorAlpha + positiveCount;
    const postBeta = priorBeta + (totalCount - positiveCount);
    const smoothedRate = postAlpha / (postAlpha + postBeta);

    // Normal approximation to Beta posterior variance for 95% credible interval
    const variance = (postAlpha * postBeta) / (Math.pow(postAlpha + postBeta, 2) * (postAlpha + postBeta + 1));
    const stdDev = Math.sqrt(variance);
    const z = 1.96;

    const lower = Math.max(0, smoothedRate - z * stdDev);
    const upper = Math.min(1, smoothedRate + z * stdDev);

    return {
      smoothedRate: Math.round(smoothedRate * 1000) / 10, // In percentage e.g. 54.2%
      priorMean: Math.round(priorMean * 1000) / 10,
      priorAlpha,
      priorBeta,
      credibleLower: Math.round(lower * 1000) / 10,
      credibleUpper: Math.round(upper * 1000) / 10
    };
  }

  /**
   * Probability Calibration Curve Computation
   * Partitions predicted probabilities into buckets and measures empirical observed frequency.
   */
  public static calculateCalibrationCurve(
    predictions: { predictedProb: number; actualOutcome: boolean }[],
    bucketStep: number = 10
  ): ProbabilityCalibrationBucket[] {
    const buckets: ProbabilityCalibrationBucket[] = [];

    for (let binMin = 20; binMin < 80; binMin += bucketStep) {
      const binMax = binMin + bucketStep;
      const inBucket = predictions.filter(
        p => p.predictedProb >= binMin && p.predictedProb < binMax
      );

      if (inBucket.length > 0) {
        const avgPredicted = inBucket.reduce((sum, p) => sum + p.predictedProb, 0) / inBucket.length;
        const actualHits = inBucket.filter(p => p.actualOutcome).length;
        const observedFreq = (actualHits / inBucket.length) * 100;

        buckets.push({
          predictedBinMin: binMin,
          predictedBinMax: binMax,
          predictedMean: Math.round(avgPredicted * 10) / 10,
          observedFrequency: Math.round(observedFreq * 10) / 10,
          sampleCount: inBucket.length,
          deviation: Math.round((observedFreq - avgPredicted) * 10) / 10
        });
      } else {
        buckets.push({
          predictedBinMin: binMin,
          predictedBinMax: binMax,
          predictedMean: (binMin + binMax) / 2,
          observedFrequency: 0,
          sampleCount: 0,
          deviation: 0
        });
      }
    }

    return buckets;
  }
}
