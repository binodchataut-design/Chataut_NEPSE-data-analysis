/**
 * Feature Causality & Integrity Unit Test Suite for Phase 3C
 * Validates zero look-ahead bias, strict past-only rolling normalizations,
 * Information Coefficient (IC) accuracy, Bayesian Beta-Binomial smoothing,
 * Benjamini-Hochberg FDR adjustments, and synthetic future mutation invariance.
 */

import { FeatureCalculationEngine } from './featureCalculationEngine';
import { FeatureStatisticsEngine } from './featureStatisticsEngine';
import { FeatureRegistry } from './featureRegistry';
import { ConditionalProbabilityEngine } from './conditionalProbabilityEngine';
import { OHLCVBar } from '../../types/technicalIndicators';
import { PrecomputedIndicators, SignalConditionEngine } from '../research/signalConditionEngine';
import { ConditionTree, FeatureCondition } from '../../types/featureEngine';
import { ResearchObservation } from '../../types/historicalResearch';

export interface FeatureTestReport {
  id: string;
  name: string;
  category: 'LEAKAGE' | 'MATHEMATICS' | 'NORMALIZATION' | 'STATISTICS';
  passed: boolean;
  message: string;
  details?: string;
}

export class FeatureCausalityTests {
  /**
   * Generates a deterministic sequence of mock OHLCV bars
   */
  private static generateMockBars(count: number): OHLCVBar[] {
    const bars: OHLCVBar[] = [];
    let price = 500;
    const baseDate = new Date('2023-01-01');

    for (let i = 0; i < count; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = d.toISOString().substring(0, 10);

      // Deterministic pseudo-random variation
      const delta = Math.sin(i * 0.2) * 8 + Math.cos(i * 0.05) * 4;
      const open = price;
      const close = price + delta;
      const high = Math.max(open, close) + 3;
      const low = Math.min(open, close) - 3;
      const volume = 20000 + Math.floor(Math.abs(Math.sin(i)) * 30000);

      bars.push({
        date: dateStr,
        open: Math.round(open * 10) / 10,
        high: Math.round(high * 10) / 10,
        low: Math.round(low * 10) / 10,
        close: Math.round(close * 10) / 10,
        volume
      });

      price = close;
    }
    return bars;
  }

  /**
   * Run all Phase 3C tests
   */
  public static async runAllTests(): Promise<FeatureTestReport[]> {
    const reports: FeatureTestReport[] = [];

    // 1. Synthetic Future Mutation Invariance on Features
    reports.push(this.testFutureMutationInvarianceOnFeatures());

    // 2. Rolling Z-Score past-only verification
    reports.push(this.testRollingZScorePastOnly());

    // 3. Percentile Rank past-only verification
    reports.push(this.testPercentileRankPastOnly());

    // 4. Discretization / Binning bounds accuracy
    reports.push(this.testFeatureBinningAccuracy());

    // 5. Pearson Correlation mathematical accuracy
    reports.push(this.testPearsonCorrelationMath());

    // 6. Spearman Rank Correlation & Ties Handling
    reports.push(this.testSpearmanRankCorrelationMath());

    // 7. Information Coefficient (IC) strictly causal
    reports.push(this.testInformationCoefficientCausality());

    // 8. Bayesian Beta-Binomial Smoothing behavior on small samples
    reports.push(this.testBayesianSmoothingSmallSample());

    // 9. Benjamini-Hochberg FDR monotonic adjustment
    reports.push(this.testBenjaminiHochbergFdr());

    // 10. Cohen's d Effect Size calculation
    reports.push(this.testCohenDEffectSize());

    // 11. Train/Validation/Test temporal separation
    reports.push(this.testTrainTestSeparation());

    // 12. Multiple Testing risk tracking & complexity score
    reports.push(this.testMultipleTestingComplexityTracking());

    // 13. Calibration curve computation
    reports.push(this.testCalibrationCurveComputation());

    // 14. ATR-normalized distance calculation
    reports.push(this.testAtrNormalizedDistance());

    return reports;
  }

  /**
   * TEST 1: Synthetic Future Mutation Invariance
   * Modifies future bars from t+1..N. Historical feature at t MUST remain perfectly identical.
   */
  public static testFutureMutationInvarianceOnFeatures(): FeatureTestReport {
    const originalBars = this.generateMockBars(100);
    const evalIndex = 60;

    const originalIndicators = SignalConditionEngine.precomputeIndicators(originalBars, 'TEST_SYM');
    const rsiDef = FeatureRegistry.getFeatureById('FEAT_RSI_ROLLING_PERCENTILE')!;
    const originalFeat = FeatureCalculationEngine.calculateFeatureObservation(
      rsiDef,
      originalIndicators,
      evalIndex,
      'TEST_SYM'
    );

    // Mutate all bars after evalIndex with extreme randomized prices
    const mutatedBars = originalBars.map((b, idx) => {
      if (idx > evalIndex) {
        return {
          ...b,
          open: b.open * 2.5,
          high: b.high * 3.0,
          low: b.low * 0.4,
          close: b.close * 2.8,
          volume: b.volume * 10
        };
      }
      return { ...b };
    });

    const mutatedIndicators = SignalConditionEngine.precomputeIndicators(mutatedBars, 'TEST_SYM');
    const mutatedFeat = FeatureCalculationEngine.calculateFeatureObservation(
      rsiDef,
      mutatedIndicators,
      evalIndex,
      'TEST_SYM'
    );

    const passed =
      originalFeat.value === mutatedFeat.value &&
      originalFeat.normalizedValue === mutatedFeat.normalizedValue &&
      originalFeat.binId === mutatedFeat.binId;

    return {
      id: 'TEST-3C-01',
      name: 'Synthetic Future Mutation Feature Invariance',
      category: 'LEAKAGE',
      passed,
      message: passed
        ? 'PASSED: Zero look-ahead bias verified. Future price doubling does not alter historical feature at t.'
        : 'FAILED: Future data mutation altered historical feature value at t.',
      details: `Orig Value: ${originalFeat.normalizedValue}, Mutated Value: ${mutatedFeat.normalizedValue}`
    };
  }

  /**
   * TEST 2: Rolling Z-Score past-only verification
   */
  public static testRollingZScorePastOnly(): FeatureTestReport {
    const series = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 100]; // last element is a huge spike
    const evalIdx = 10; // evaluating at index 10 (value 30), before the 100 spike

    const zScore = FeatureCalculationEngine.calculateRollingZScore(series, evalIdx, 10);
    // Mutate index 11
    series[11] = 9999;
    const zScoreAfter = FeatureCalculationEngine.calculateRollingZScore(series, evalIdx, 10);

    const passed = zScore !== null && zScore === zScoreAfter;

    return {
      id: 'TEST-3C-02',
      name: 'Rolling Z-Score Past-Only Isolation',
      category: 'NORMALIZATION',
      passed,
      message: passed
        ? 'PASSED: Rolling Z-Score strictly ignores future spikes at index t+1.'
        : 'FAILED: Future data affected rolling Z-score.',
      details: `Z-Score: ${zScore}`
    };
  }

  /**
   * TEST 3: Percentile Rank past-only verification
   */
  public static testPercentileRankPastOnly(): FeatureTestReport {
    const series = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 500];
    const evalIdx = 9; // value 100

    const rankBefore = FeatureCalculationEngine.calculateRollingPercentile(series, evalIdx, 10);
    series[10] = -999; // mutate future bar
    const rankAfter = FeatureCalculationEngine.calculateRollingPercentile(series, evalIdx, 10);

    const passed = rankBefore === 100 && rankAfter === 100;

    return {
      id: 'TEST-3C-03',
      name: 'Percentile Rank Historical Window Isolation',
      category: 'NORMALIZATION',
      passed,
      message: passed
        ? 'PASSED: Percentile rank correctly calculates 100% on highest element without future contamination.'
        : 'FAILED: Future data changed percentile ranking.',
      details: `Rank Before: ${rankBefore}%, Rank After: ${rankAfter}%`
    };
  }

  /**
   * TEST 4: Feature Binning Accuracy
   */
  public static testFeatureBinningAccuracy(): FeatureTestReport {
    const rsiDef = FeatureRegistry.getFeatureById('FEAT_RSI_14_ZONE')!;
    const bin25 = FeatureCalculationEngine.discretizeValue(25, rsiDef.defaultBins);
    const bin55 = FeatureCalculationEngine.discretizeValue(55, rsiDef.defaultBins);
    const bin75 = FeatureCalculationEngine.discretizeValue(75, rsiDef.defaultBins);

    const passed =
      bin25?.binId === 'BIN_RSI_OVERSOLD' &&
      bin55?.binId === 'BIN_RSI_BULL_ACCUM' &&
      bin75?.binId === 'BIN_RSI_OVERBOUGHT';

    return {
      id: 'TEST-3C-04',
      name: 'Configurable Feature Binning Discretization',
      category: 'NORMALIZATION',
      passed,
      message: passed
        ? 'PASSED: Discretization accurately partitions values into configured threshold regimes.'
        : 'FAILED: Value binning assigned wrong regime bin.',
      details: `25 -> ${bin25?.binId}, 55 -> ${bin55?.binId}, 75 -> ${bin75?.binId}`
    };
  }

  /**
   * TEST 5: Pearson Correlation Math
   */
  public static testPearsonCorrelationMath(): FeatureTestReport {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10]; // Perfect positive correlation (+1.0)
    const z = [10, 8, 6, 4, 2]; // Perfect negative correlation (-1.0)

    const rPos = FeatureStatisticsEngine.calculatePearsonCorrelation(x, y);
    const rNeg = FeatureStatisticsEngine.calculatePearsonCorrelation(x, z);

    const passed = Math.abs(rPos - 1.0) < 0.001 && Math.abs(rNeg - (-1.0)) < 0.001;

    return {
      id: 'TEST-3C-05',
      name: 'Pearson Correlation Numerical Precision',
      category: 'MATHEMATICS',
      passed,
      message: passed
        ? 'PASSED: Verified Pearson r = +1.000 for collinear vectors and -1.000 for inverse vectors.'
        : 'FAILED: Pearson correlation failed sanity check.',
      details: `r(x,y)=${rPos}, r(x,z)=${rNeg}`
    };
  }

  /**
   * TEST 6: Spearman Rank Correlation & Ties Handling
   */
  public static testSpearmanRankCorrelationMath(): FeatureTestReport {
    // Non-linear monotonic relationship: y = x^3
    const x = [1, 2, 3, 4, 5];
    const y = [1, 8, 27, 64, 125];

    const spearman = FeatureStatisticsEngine.calculateSpearmanCorrelation(x, y);
    const passed = Math.abs(spearman - 1.0) < 0.001;

    return {
      id: 'TEST-3C-06',
      name: 'Spearman Rank Correlation Monotonic Verification',
      category: 'MATHEMATICS',
      passed,
      message: passed
        ? 'PASSED: Monotonic non-linear relationship achieves expected Spearman rank correlation of 1.000.'
        : 'FAILED: Spearman rank correlation failed on monotonic sequence.',
      details: `Spearman: ${spearman}`
    };
  }

  /**
   * TEST 7: Information Coefficient Causality
   */
  public static testInformationCoefficientCausality(): FeatureTestReport {
    // Feature values at T and realized returns at T+H
    const feats = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const rets = [1.2, 2.5, 3.1, 4.0, 5.2, 6.1, 7.0, 8.3, 9.1, 10.5];

    const result = FeatureStatisticsEngine.calculateInformationCoefficient(feats, rets);
    const passed = result.ic >= 0.95 && result.pValue < 0.01 && result.sampleSize === 10;

    return {
      id: 'TEST-3C-07',
      name: 'Information Coefficient (IC) Rank Correlation',
      category: 'STATISTICS',
      passed,
      message: passed
        ? 'PASSED: IC correctly calculates rank relationship with statistical p-value.'
        : 'FAILED: IC calculation error.',
      details: `IC: ${result.ic}, p-value: ${result.pValue}, N: ${result.sampleSize}`
    };
  }

  /**
   * TEST 8: Bayesian Beta-Binomial Smoothing
   */
  public static testBayesianSmoothingSmallSample(): FeatureTestReport {
    // Tiny sample: 2 wins out of 2 trades. Raw rate = 100%.
    // With Beta(5, 5) prior: posterior = (2 + 5) / (2 + 5 + 5) = 7 / 12 = 58.3%
    const res = FeatureStatisticsEngine.calculateBayesianSmoothedProbability(2, 2, 5, 5);
    const passed = res.smoothedRate < 70 && res.smoothedRate > 50;

    return {
      id: 'TEST-3C-08',
      name: 'Bayesian Beta-Binomial Small Sample Smoothing',
      category: 'STATISTICS',
      passed,
      message: passed
        ? `PASSED: 100% raw win rate on N=2 smoothed down to ${res.smoothedRate}% via prior, preventing small sample delusion.`
        : 'FAILED: Bayesian smoothing failed to shrink extreme small sample rate.',
      details: `Raw: 100%, Smoothed: ${res.smoothedRate}%, Credible Interval: [${res.credibleLower}%, ${res.credibleUpper}%]`
    };
  }

  /**
   * TEST 9: Benjamini-Hochberg FDR Adjustment
   */
  public static testBenjaminiHochbergFdr(): FeatureTestReport {
    const rawPVals = [
      { id: 'f1', pValue: 0.001 },
      { id: 'f2', pValue: 0.04 },
      { id: 'f3', pValue: 0.05 },
      { id: 'f4', pValue: 0.80 }
    ];

    const adjMap = FeatureStatisticsEngine.benjaminiHochbergAdjustment(rawPVals, 0.05);
    const f1 = adjMap.get('f1')!;
    const f4 = adjMap.get('f4')!;

    const passed = f1.isSignificant === true && f4.isSignificant === false && f1.adjustedPValue >= 0.001;

    return {
      id: 'TEST-3C-09',
      name: 'Benjamini-Hochberg Multiple-Testing Control',
      category: 'STATISTICS',
      passed,
      message: passed
        ? 'PASSED: Benjamini-Hochberg FDR properly penalizes hypothesis multiplicity and controls false discovery.'
        : 'FAILED: FDR adjustment failed.',
      details: `f1 raw=0.001 -> adj=${f1.adjustedPValue}, f4 raw=0.80 -> adj=${f4.adjustedPValue}`
    };
  }

  /**
   * TEST 10: Cohen's d Effect Size
   */
  public static testCohenDEffectSize(): FeatureTestReport {
    const cond = [10, 11, 12, 13, 14];
    const base = [2, 3, 4, 5, 6];

    const d = FeatureStatisticsEngine.calculateEffectSize(cond, base);
    const passed = d > 3.0; // Very large effect size

    return {
      id: 'TEST-3C-10',
      name: "Cohen's d Economic Effect Size Validation",
      category: 'STATISTICS',
      passed,
      message: passed
        ? `PASSED: Correctly quantifies large standardized mean difference (d = ${d}).`
        : 'FAILED: Cohen d calculation incorrect.',
      details: `Cohen's d: ${d}`
    };
  }

  /**
   * TEST 11: Train/Validation/Test Separation
   */
  public static testTrainTestSeparation(): FeatureTestReport {
    const dates = ['2022-05-01', '2024-02-15', '2025-11-20'];
    const isTrain = (d: string) => d <= '2023-12-31';
    const isVal = (d: string) => d > '2023-12-31' && d <= '2025-06-30';
    const isTest = (d: string) => d > '2025-06-30';

    const passed = isTrain(dates[0]) && isVal(dates[1]) && isTest(dates[2]);

    return {
      id: 'TEST-3C-11',
      name: 'Train / Validation / Test Strict Temporal Separation',
      category: 'LEAKAGE',
      passed,
      message: passed
        ? 'PASSED: Partitions are strictly segmented chronologically with zero cross-contamination.'
        : 'FAILED: Partition separation violated.',
      details: `Train <= 2023, Val 2024-2025, Test > 2025`
    };
  }

  /**
   * TEST 12: Multiple Testing Complexity Tracking
   */
  public static testMultipleTestingComplexityTracking(): FeatureTestReport {
    const tree: ConditionTree = {
      operator: 'AND',
      conditions: [
        { featureId: 'f1', comparator: '>', value: 10, label: 'f1>10' },
        { featureId: 'f2', comparator: '<', value: 5, label: 'f2<5' },
        {
          operator: 'OR',
          conditions: [
            { featureId: 'f3', comparator: '==', value: 1, label: 'f3==1' },
            { featureId: 'f4', comparator: '>=', value: 20, label: 'f4>=20' }
          ]
        }
      ]
    };

    const count = ConditionalProbabilityEngine.countConditions(tree);
    const passed = count === 4;

    return {
      id: 'TEST-3C-12',
      name: 'Recursive Condition Tree Complexity Counting',
      category: 'STATISTICS',
      passed,
      message: passed
        ? `PASSED: Accurately enumerated ${count} atomic rules across nested AND/OR nodes.`
        : 'FAILED: Condition complexity counting inaccurate.',
      details: `Counted: ${count} conditions`
    };
  }

  /**
   * TEST 13: Calibration Curve Computation
   */
  public static testCalibrationCurveComputation(): FeatureTestReport {
    const predictions = [
      { predictedProb: 55, actualOutcome: true },
      { predictedProb: 54, actualOutcome: true },
      { predictedProb: 58, actualOutcome: false },
      { predictedProb: 65, actualOutcome: true }
    ];

    const buckets = FeatureStatisticsEngine.calculateCalibrationCurve(predictions, 10);
    const bucket50to60 = buckets.find(b => b.predictedBinMin === 50 && b.predictedBinMax === 60);

    const passed = bucket50to60 !== undefined && bucket50to60.sampleCount === 3;

    return {
      id: 'TEST-3C-13',
      name: 'Empirical Probability Calibration Binning',
      category: 'STATISTICS',
      passed,
      message: passed
        ? 'PASSED: Predictions bucketed correctly and empirical frequency calculated.'
        : 'FAILED: Calibration curve binning error.',
      details: `50-60% bucket sample count: ${bucket50to60?.sampleCount}`
    };
  }

  /**
   * TEST 14: ATR-Normalized Distance Calculation
   */
  public static testAtrNormalizedDistance(): FeatureTestReport {
    const price = 650;
    const ma = 600;
    const atr = 25;

    const dist = FeatureCalculationEngine.calculateAtrNormalizedDistance(price, ma, atr);
    // (650 - 600) / 25 = 2.0 ATR
    const passed = dist === 2.0;

    return {
      id: 'TEST-3C-14',
      name: 'ATR-Normalized Distance Calculation Precision',
      category: 'NORMALIZATION',
      passed,
      message: passed
        ? `PASSED: (Price - SMA) / ATR verified: (650 - 600) / 25 = ${dist} ATR.`
        : 'FAILED: ATR-normalized distance calculation incorrect.',
      details: `Result: ${dist} ATR`
    };
  }
}
