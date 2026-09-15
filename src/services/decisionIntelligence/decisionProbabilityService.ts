/**
 * Decision Probability Service (Phase 4B)
 * Calculates multi-horizon historical conditional probability distributions.
 * Terminology: HISTORICAL CONDITIONAL PROBABILITY (Never "Future Prediction").
 * Explicitly displays Uncertainty: Wilson 95% CI, Sample Size, Raw vs Smoothed rate.
 */

import { CurrentMarketAndStockSnapshot } from '../../types/currentStateEngine';
import {
  DecisionProbabilityResult,
  HistoricalComparableCondition
} from '../../types/decisionIntelligence';
import { HistoricalEvidenceService } from './historicalEvidenceService';

export class DecisionProbabilityService {
  /**
   * Computes multi-horizon probabilities with Wilson confidence intervals and Bayesian smoothing
   */
  public static computeProbabilities(
    snapshot: CurrentMarketAndStockSnapshot,
    comparables: HistoricalComparableCondition[]
  ): DecisionProbabilityResult {
    return HistoricalEvidenceService.calculateMultiHorizonProbabilities(snapshot, comparables);
  }

  /**
   * Formats a probability statement compliant with statistical principles
   */
  public static formatConditionalStatement(
    horizon: number,
    probability: number,
    observations: number,
    ciLower: number,
    ciUpper: number
  ): string {
    if (observations < 15) {
      return `INSUFFICIENT HISTORICAL EVIDENCE (${observations} observations).`;
    }
    return `In ${observations} historical instances matching comparable conditions, ${probability.toFixed(1)}% produced a positive ${horizon}-session return (95% CI: ${ciLower.toFixed(1)}%–${ciUpper.toFixed(1)}%).`;
  }
}
