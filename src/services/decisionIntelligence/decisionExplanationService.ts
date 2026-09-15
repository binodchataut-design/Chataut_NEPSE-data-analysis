/**
 * Decision Explanation Service (Phase 4B)
 * Produces transparent, structured, and auditable natural-language explanations
 * answering "WHY THIS SETUP IS INTERESTING" and "WHY CAUTION IS REQUIRED".
 * Never outputs an unexplained recommendation.
 */

import { CurrentMarketAndStockSnapshot } from '../../types/currentStateEngine';
import {
  DecisionExplanation,
  NormalizedEvidenceItem,
  EvidenceAlignmentResult,
  EvidenceConflictResult,
  DecisionProbabilityResult,
  DecisionEligibilityResult
} from '../../types/decisionIntelligence';

export class DecisionExplanationService {
  /**
   * Generates comprehensive structured explanation for a decision assessment
   */
  public static generateExplanation(
    snapshot: CurrentMarketAndStockSnapshot,
    evidenceItems: NormalizedEvidenceItem[],
    alignment: EvidenceAlignmentResult,
    conflicts: EvidenceConflictResult,
    probability: DecisionProbabilityResult,
    eligibility: DecisionEligibilityResult
  ): DecisionExplanation {
    const whyInteresting: string[] = [];
    const whyCautionRequired: string[] = [];
    const symbol = snapshot.symbol;

    // Check if live data is unavailable
    if (snapshot.stateAvailability && !snapshot.stateAvailability.isAvailable) {
      return {
        headline: `${symbol}: Live Market Feed Disconnected (State Unavailable)`,
        whyInteresting: [],
        whyCautionRequired: [
          'Upstream live market feed is disconnected or unauthenticated.',
          'System strictly refuses to substitute unverified mock records in live mode.',
          'Connect to verified gateway or switch to MOCK_DATA mode for offline research.'
        ],
        evidenceAlignmentSummary: 'State Unavailable',
        historicalBasisSummary: 'Evaluation suspended until feed is established.',
        primaryRiskFactor: 'Lack of verified live market prices.',
        verdictRationale: 'Evaluation blocked by data provenance and safety rules.'
      };
    }

    // 1. WHY THIS SETUP IS INTERESTING
    if (snapshot.marketState.regime === 'BULL') {
      whyInteresting.push(`1. Market regime is confirmed BULL with ${Math.round(snapshot.marketState.regimeConfidence * 100)}% structural confidence.`);
    } else if (snapshot.marketState.regime === 'SIDEWAYS') {
      whyInteresting.push('1. Market regime is neutral/sideways, offering selective rotational opportunities.');
    }

    if (snapshot.sectorState.leadershipState === 'LEADING' || snapshot.sectorState.leadershipState === 'IMPROVING') {
      whyInteresting.push(`2. Sector (${snapshot.sectorState.sectorName}) is classified as ${snapshot.sectorState.leadershipState}, providing tailwinds.`);
    }

    const maItem = evidenceItems.find(e => e.id === 'EV_TREND_MA_ALIGN');
    if (maItem && maItem.direction === 'BULLISH') {
      whyInteresting.push('3. Stock shows robust moving average alignment (trading comfortably above rising key SMAs).');
    }

    const volItem = evidenceItems.find(e => e.id === 'EV_VOL_RVOL20');
    if (volItem && volItem.direction === 'BULLISH') {
      whyInteresting.push(`4. Volume confirms recent upward price discovery (${volItem.formattedValue}).`);
    }

    const p5 = probability.distributions[5];
    if (p5 && p5.observations >= 15) {
      whyInteresting.push(`5. Historical comparable conditions show ${p5.pPositive}% positive 5-session expectancy across ${p5.observations} historical observations.`);
    }

    const rsItem = evidenceItems.find(e => e.id === 'EV_RS_NEPSE_20D');
    if (rsItem && rsItem.direction === 'BULLISH') {
      whyInteresting.push(`6. Generating consistent alpha relative to NEPSE (${rsItem.formattedValue} 20D spread).`);
    }

    if (whyInteresting.length === 0) {
      whyInteresting.push('Consolidation patterns observed, but lacking dominant directional drivers.');
    }

    // 2. WHY CAUTION IS REQUIRED
    conflicts.conflicts.forEach(c => {
      whyCautionRequired.push(`• Conflict: ${c.title} — ${c.impactOnDecision}`);
    });

    eligibility.blockers.forEach(b => {
      if (b.triggered) {
        whyCautionRequired.push(`• Blocker Enforced: ${b.name} (${b.details})`);
      }
    });

    const fundItem = evidenceItems.find(e => e.id === 'EV_FUND_VALUATION');
    if (fundItem && fundItem.direction === 'BEARISH') {
      whyCautionRequired.push(`• Fundamental valuation is elevated (${fundItem.formattedValue}).`);
    }

    const liqItem = evidenceItems.find(e => e.id === 'EV_LIQ_ADT20');
    if (liqItem && liqItem.direction === 'BEARISH') {
      whyCautionRequired.push(`• Liquidity constraint: Average daily turnover is limited (${liqItem.formattedValue}).`);
    }

    if (p5 && p5.observations < 40) {
      whyCautionRequired.push(`• Historical sample size is moderate (${p5.observations} observations), resulting in a wider confidence interval.`);
    }

    if (snapshot.stockState.momentum.rsi14 && snapshot.stockState.momentum.rsi14 > 72) {
      whyCautionRequired.push(`• Short-term RSI (${snapshot.stockState.momentum.rsi14.toFixed(1)}) is elevated; pullback risk is heightened.`);
    }

    if (whyCautionRequired.length === 0) {
      whyCautionRequired.push('• Standard market risk applies; always respect structural stop-loss parameters.');
    }

    // 3. Summaries & Rationale
    const primaryRiskFactor = whyCautionRequired[0] || 'Standard general market systematic risk.';
    const evidenceAlignmentSummary = `Evidence alignment is ${alignment.overallAlignment.replace(/_/g, ' ')} (${Math.round(alignment.alignmentScore * 100)}% consensus among ${alignment.independentEvidenceCount} independent factors).`;
    const historicalBasisSummary = p5 && p5.observations >= 15
      ? `Based on ${p5.observations} historical setups matching current technical and market conditions, with 5D win rate of ${p5.pPositive}% (95% CI: ${p5.wilsonInterval.lower.toFixed(1)}%–${p5.wilsonInterval.upper.toFixed(1)}%).`
      : 'Insufficient historical matches for high-confidence statistical projection.';

    const headline = `${symbol}: ${eligibility.status.replace(/_/g, ' ')} — ${alignment.overallAlignment.replace(/_/g, ' ')}`;
    const verdictRationale = eligibility.primaryReason;

    return {
      headline,
      whyInteresting,
      whyCautionRequired,
      evidenceAlignmentSummary,
      historicalBasisSummary,
      primaryRiskFactor,
      verdictRationale
    };
  }
}
