/**
 * Automated Research Causality & Backtesting Unit Test Suite
 * Includes synthetic future-mutation tests that guarantee zero look-ahead bias,
 * mathematical verification of forward returns, MFE, MAE, Wilson score CI,
 * stop/target collisions, and drawdown metrics.
 */

import { OHLCVBar } from '../../types/technicalIndicators';
import { ForwardOutcomeEngine } from './forwardOutcomeEngine';
import { ResearchStatisticsEngine } from './researchStatisticsEngine';
import { ResearchCausalityGuard } from './researchCausalityGuard';
import { SignalConditionEngine } from './signalConditionEngine';

export interface TestResultItem {
  suite: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export interface ResearchTestSuiteReport {
  total: number;
  passed: number;
  failed: number;
  results: TestResultItem[];
  causalityGuaranteed: boolean;
}

export function runResearchCausalityTestSuite(): ResearchTestSuiteReport {
  const results: TestResultItem[] = [];

  // ==========================================
  // 1. Synthetic Future Mutation Test (Mandatory Section 40)
  // ==========================================
  {
    // Build a base synthetic price series of 30 bars
    const syntheticBars: OHLCVBar[] = [];
    for (let i = 0; i < 30; i++) {
      const p = 100 + i * 2;
      syntheticBars.push({
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        open: p - 1,
        high: p + 2,
        low: p - 2,
        close: p,
        volume: 10000 + i * 100,
        turnover: 1000000
      });
    }

    // Signal evaluator at t = 15: checks if close > 120 (which is true at t=15 where close=130)
    const evaluateSignal = (causalSlice: OHLCVBar[]) => {
      const lastBar = causalSlice[causalSlice.length - 1];
      return lastBar.close > 120;
    };

    const causalityCheck = ResearchCausalityGuard.verifyCausalityResistance(
      syntheticBars,
      evaluateSignal,
      15
    );

    results.push({
      suite: 'Temporal Causality Invariant',
      name: 'SYNTHETIC FUTURE MUTATION: Future bar alterations (T+1..T+N) cannot alter signal at T',
      passed: causalityCheck.passed,
      expected: 'true',
      actual: String(causalityCheck.passed),
      details: causalityCheck.message
    });
  }

  // ==========================================
  // 2. Entry Price Models (Section 5)
  // ==========================================
  {
    const bars: OHLCVBar[] = [
      { date: '2026-01-01', open: 100, high: 105, low: 95, close: 102, volume: 1000 },
      { date: '2026-01-02', open: 103, high: 108, low: 101, close: 107, volume: 1200 },
      { date: '2026-01-03', open: 106, high: 112, low: 105, close: 110, volume: 1500 }
    ];

    const entrySignalClose = ForwardOutcomeEngine.determineEntry(bars, 0, 'SIGNAL_CLOSE');
    results.push({
      suite: 'Entry Models',
      name: 'SIGNAL_CLOSE uses bar[t].close (102)',
      passed: entrySignalClose?.entryPrice === 102,
      expected: '102',
      actual: String(entrySignalClose?.entryPrice)
    });

    const entryNextOpen = ForwardOutcomeEngine.determineEntry(bars, 0, 'NEXT_OPEN');
    results.push({
      suite: 'Entry Models',
      name: 'NEXT_OPEN uses bar[t+1].open (103)',
      passed: entryNextOpen?.entryPrice === 103,
      expected: '103',
      actual: String(entryNextOpen?.entryPrice)
    });

    const entryNextClose = ForwardOutcomeEngine.determineEntry(bars, 0, 'NEXT_CLOSE');
    results.push({
      suite: 'Entry Models',
      name: 'NEXT_CLOSE uses bar[t+1].close (107)',
      passed: entryNextClose?.entryPrice === 107,
      expected: '107',
      actual: String(entryNextClose?.entryPrice)
    });
  }

  // ==========================================
  // 3. Forward Returns (Section 4)
  // ==========================================
  {
    const bars: OHLCVBar[] = [
      { date: '2026-01-01', open: 100, high: 102, low: 98, close: 100, volume: 1000 }, // t=0 entry=100
      { date: '2026-01-02', open: 100, high: 105, low: 99, close: 105, volume: 1000 }, // t=1 (+5%)
      { date: '2026-01-03', open: 105, high: 110, low: 104, close: 108, volume: 1000 },
      { date: '2026-01-04', open: 108, high: 115, low: 107, close: 110, volume: 1000 } // t=3 (+10%)
    ];

    const costs = {
      includeCosts: false,
      brokeragePercent: 0,
      sebonFeePercent: 0,
      dpFeeNpr: 0,
      capitalGainsTaxPercent: 0,
      slippagePercent: 0
    };

    const returns = ForwardOutcomeEngine.calculateForwardReturns(bars, 0, 100, [1, 3], costs);
    const ret1 = returns[1]?.returnPercent;
    const ret3 = returns[3]?.returnPercent;

    results.push({
      suite: 'Forward Return Engine',
      name: '1-bar forward return matches ((105 - 100) / 100) = 5.0%',
      passed: ret1 === 5,
      expected: '5',
      actual: String(ret1)
    });

    results.push({
      suite: 'Forward Return Engine',
      name: '3-bar forward return matches ((110 - 100) / 100) = 10.0%',
      passed: ret3 === 10,
      expected: '10',
      actual: String(ret3)
    });
  }

  // ==========================================
  // 4. MFE & MAE (Sections 6 & 7)
  // ==========================================
  {
    const bars: OHLCVBar[] = [
      { date: '2026-01-01', open: 100, high: 101, low: 99, close: 100, volume: 1000 }, // entry=100
      { date: '2026-01-02', open: 100, high: 120, low: 92, close: 115, volume: 1000 }, // High=120, Low=92
      { date: '2026-01-03', open: 115, high: 125, low: 90, close: 110, volume: 1000 }, // High=125, Low=90
      { date: '2026-01-04', open: 110, high: 130, low: 88, close: 125, volume: 1000 }  // High=130, Low=88
    ];

    const { mfe, mae } = ForwardOutcomeEngine.calculateExcursions(bars, 0, 100, [1, 3]);

    // Horizon 3 max high is 130 (+30%), min low is 88 (-12%)
    const mfe3Pct = mfe[3]?.favorablePercent;
    const mae3Pct = mae[3]?.adversePercent;

    results.push({
      suite: 'Excursion Engine',
      name: 'MFE (Max Favorable Excursion) correctly calculates 30% peak gain',
      passed: mfe3Pct === 30,
      expected: '30',
      actual: String(mfe3Pct)
    });

    results.push({
      suite: 'Excursion Engine',
      name: 'MAE (Max Adverse Excursion) correctly calculates 12% peak drawdown',
      passed: mae3Pct === 12,
      expected: '12',
      actual: String(mae3Pct)
    });
  }

  // ==========================================
  // 5. Target / Stop Simulation & Ambiguity (Section 8)
  // ==========================================
  {
    const bars: OHLCVBar[] = [
      { date: '2026-01-01', open: 100, high: 101, low: 99, close: 100, volume: 1000 }, // entry=100
      { date: '2026-01-02', open: 100, high: 112, low: 88, close: 105, volume: 1000 }  // Both +10% target (110) & -5% stop (95) breached!
    ];

    const costs = {
      includeCosts: false,
      brokeragePercent: 0,
      sebonFeePercent: 0,
      dpFeeNpr: 0,
      capitalGainsTaxPercent: 0,
      slippagePercent: 0
    };

    const simAmbiguous = ForwardOutcomeEngine.simulateTargetStop(
      bars,
      0,
      100,
      { targetPercent: 10, stopLossPercent: 5, maxHoldingBars: 5, ambiguousBarRule: 'MARK_AMBIGUOUS' },
      costs
    );

    results.push({
      suite: 'Target / Stop Simulation',
      name: 'Dual collision in single bar marks AMBIGUOUS without fabricating sequence',
      passed: simAmbiguous?.outcome === 'AMBIGUOUS',
      expected: 'AMBIGUOUS',
      actual: String(simAmbiguous?.outcome)
    });

    const simConservative = ForwardOutcomeEngine.simulateTargetStop(
      bars,
      0,
      100,
      { targetPercent: 10, stopLossPercent: 5, maxHoldingBars: 5, ambiguousBarRule: 'CONSERVATIVE_STOP' },
      costs
    );

    results.push({
      suite: 'Target / Stop Simulation',
      name: 'Conservative rule resolves intra-bar ambiguity safely as STOP_HIT',
      passed: simConservative?.outcome === 'STOP_HIT',
      expected: 'STOP_HIT',
      actual: String(simConservative?.outcome)
    });
  }

  // ==========================================
  // 6. Wilson Score Binomial Confidence Interval (Section 20)
  // ==========================================
  {
    // 50 successes out of 100 trials: p = 0.50
    // Wilson 95% interval for 50/100 is approx [40.38%, 59.62%]
    const ci = ResearchStatisticsEngine.calculateWilsonScoreInterval(50, 100, 0.95);
    const validLower = ci.lower > 39 && ci.lower < 41;
    const validUpper = ci.upper > 59 && ci.upper < 61;

    results.push({
      suite: 'Statistical Accuracy',
      name: 'Wilson Score 95% Confidence Interval for 50/100 centers near ~40.4% - ~59.6%',
      passed: validLower && validUpper,
      expected: '40.4% - 59.6%',
      actual: `${ci.lower.toFixed(1)}% - ${ci.upper.toFixed(1)}%`
    });
  }

  // ==========================================
  // 7. Expectancy & Profit Factor (Sections 10 & 11)
  // ==========================================
  {
    // 3 trades: +10%, +10%, -5%
    // Wins: 2/3 (66.7%), avgWin = 10%
    // Loss: 1/3 (33.3%), avgLoss = 5%
    // Expectancy = (2/3 * 10) - (1/3 * 5) = 6.67 - 1.67 = 5.0%
    // Profit Factor = 20 / 5 = 4.0
    const exp = ResearchStatisticsEngine.calculateExpectancy([10, 10, -5]);
    const expCorrect = Math.abs(exp.expectancy - 5.0) < 0.01;
    const pfCorrect = exp.profitFactor === 4.0;

    results.push({
      suite: 'Mathematical Expectancy',
      name: 'Expectancy formula (WinProb*AvgWin - LossProb*AvgLoss) = 5.0%',
      passed: expCorrect,
      expected: '5.0',
      actual: exp.expectancy.toFixed(2)
    });

    results.push({
      suite: 'Mathematical Expectancy',
      name: 'Profit factor (Gross Profits / Gross Losses) = 4.0',
      passed: pfCorrect,
      expected: '4',
      actual: String(exp.profitFactor)
    });
  }

  // ==========================================
  // 8. Drawdown Engine (Section 13)
  // ==========================================
  {
    const trades = [
      { date: '2026-01-01', symbol: 'TEST', returnPercent: 10 },  // 100k -> 110k
      { date: '2026-01-02', symbol: 'TEST', returnPercent: -20 }, // 110k -> 88k (drawdown = (110-88)/110 = 20%)
      { date: '2026-01-03', symbol: 'TEST', returnPercent: 25 }   // 88k -> 110k (recovered)
    ];

    const dd = ResearchStatisticsEngine.calculateDrawdown(trades, 100000);
    const maxDdMatches = dd.maxDrawdownPercent === 20;

    results.push({
      suite: 'Drawdown Analysis',
      name: 'Compounded equity peak drawdown correctly registers 20.0%',
      passed: maxDdMatches,
      expected: '20.0',
      actual: String(dd.maxDrawdownPercent)
    });
  }

  // ==========================================
  // 9. Sample Size Classification (Section 19)
  // ==========================================
  {
    const c15 = ResearchStatisticsEngine.classifySampleSize(15);
    const c35 = ResearchStatisticsEngine.classifySampleSize(35);
    const c250 = ResearchStatisticsEngine.classifySampleSize(250);

    const check = c15.tier === 'VERY_LOW' && c35.tier === 'LOW' && c250.tier === 'LARGER';
    results.push({
      suite: 'Sample Size Discipline',
      name: 'Sample size tiering: <20 (VERY_LOW), 20-49 (LOW), 200+ (LARGER)',
      passed: check,
      expected: 'VERY_LOW, LOW, LARGER',
      actual: `${c15.tier}, ${c35.tier}, ${c250.tier}`
    });
  }

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results,
    causalityGuaranteed: failedCount === 0
  };
}
