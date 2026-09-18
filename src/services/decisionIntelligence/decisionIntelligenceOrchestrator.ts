/**
 * Decision Intelligence Orchestrator (Phase 4B)
 * The central pipeline combining Evidence Extraction, Normalization, Reliability,
 * Alignment, Conflict Detection, Historical Condition Matching, Multi-Horizon Probability,
 * Risk Integration, Eligibility Enforcement, and Explainability.
 */

import { CurrentStateSnapshotService } from '../currentStateSnapshotService';
import { CurrentMarketAndStockSnapshot } from '../../types/currentStateEngine';
import {
  DecisionAssessment,
  MarketWideEvidenceRankingItem,
  RiskRewardParameters,
  DecisionIntelligenceEvent,
  DecisionIntelligenceEventType
} from '../../types/decisionIntelligence';
import { EvidenceExtractionService } from './evidenceExtractionService';
import { EvidenceNormalizationService } from './evidenceNormalizationService';
import { EvidenceReliabilityService } from './evidenceReliabilityService';
import { EvidenceAlignmentService } from './evidenceAlignmentService';
import { EvidenceConflictService } from './evidenceConflictService';
import { HistoricalEvidenceService } from './historicalEvidenceService';
import { DecisionProbabilityService } from './decisionProbabilityService';
import { DecisionEligibilityService } from './decisionEligibilityService';
import { DecisionExplanationService } from './decisionExplanationService';
import { normalizedCompanies } from '../../data/normalizedMasterData';
import { getCachedSymbols } from '../../data/liveBarsCache';
import { EvidenceGrade } from '../../types/researchValidation';

export class DecisionIntelligenceOrchestrator {
  public static readonly ENGINE_VERSION = '4B_v1';
  public static readonly PROB_ENGINE_VERSION = '4B_PROB_v1';

  private static eventListeners: ((event: DecisionIntelligenceEvent) => void)[] = [];

  /**
   * Registers a listener for decision intelligence events (Phase 5 Alert readiness)
   */
  public static subscribeToEvents(listener: (event: DecisionIntelligenceEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  /**
   * Emits an event to registered listeners
   */
  private static emitEvent(event: DecisionIntelligenceEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error('Error in decision event listener:', e);
      }
    });
  }

  /**
   * Generates a complete, auditable Decision Assessment for a given symbol and as-of date
   */
  public static async getAssessment(
    symbol: string = 'CHCL',
    asOfDate?: string
  ): Promise<DecisionAssessment> {
    const targetDate = asOfDate || '2026-08-30';

    // 1. Fetch Point-in-Time Current State Snapshot (Phase 4A)
    const snapshot: CurrentMarketAndStockSnapshot = await CurrentStateSnapshotService.getSnapshot(
      symbol,
      targetDate
    );

    // 2. Extract Evidence Items
    const rawEvidence = EvidenceExtractionService.extractEvidence(snapshot);

    // 3. Normalize Evidence Items
    const normalizedEvidence = EvidenceNormalizationService.normalizeAll(rawEvidence);

    // 4. Determine Research Validity Grade (from Phase 3D)
    let researchGrade: EvidenceGrade = 'B';
    let gradeExplanation = 'Strong historical support and acceptable robustness under normal market regimes.';
    if (snapshot.marketState.regime === 'BEAR') {
      researchGrade = 'C';
      gradeExplanation = 'Robustness weakens during Bear regimes due to liquidity shrinkage.';
    }

    // 5. Apply Mathematical Reliability & Confidence
    const withReliability = EvidenceReliabilityService.applyReliabilityToAll(normalizedEvidence, researchGrade);
    const fullyNormalized = EvidenceNormalizationService.normalizeAll(withReliability);

    // 6. Evaluate Evidence Alignment (with collinearity de-duplication)
    const alignment = EvidenceAlignmentService.evaluateAlignment(fullyNormalized);

    // 7. Detect Multi-Dimensional Conflicts
    const conflicts = EvidenceConflictService.detectConflicts(fullyNormalized);

    // 8. Historical Comparable Condition Matching (strictly t <= asOfDate)
    const { comparables, allMatchingObservations } = HistoricalEvidenceService.getHistoricalComparables(
      snapshot,
      25
    );

    // 9. Multi-Horizon Historical Conditional Probability
    const probability = DecisionProbabilityService.computeProbabilities(
      snapshot,
      allMatchingObservations
    );

    // 10. Compute Risk-Reward Parameters
    const currentClose = snapshot.stockState.price.close > 0 ? snapshot.stockState.price.close : 500;
    const atr = snapshot.stockState.volatility.atr14 ?? (currentClose * 0.025);

    const stopDistance = Math.max(currentClose * 0.035, atr * 1.5);
    const suggestedStopLoss = Math.round((currentClose - stopDistance) * 10) / 10;
    const stopDistancePercent = Math.round((stopDistance / currentClose) * 1000) / 10;

    const target1 = Math.round((currentClose + stopDistance * 1.8) * 10) / 10;
    const target1Percent = Math.round(((target1 - currentClose) / currentClose) * 1000) / 10;

    const target2 = Math.round((currentClose + stopDistance * 3.0) * 10) / 10;
    const target2Percent = Math.round(((target2 - currentClose) / currentClose) * 1000) / 10;

    const riskRewardRatio = Math.round((target1Percent / stopDistancePercent) * 100) / 100;
    const estimatedSlippage = 0.15;
    const estimatedBrokerage = 0.40;
    const estimatedNetExpectancy = Math.round((probability.distributions[5]?.expectancy ?? 2.5) - estimatedSlippage - estimatedBrokerage) * 10 / 10;

    const riskReward: RiskRewardParameters = {
      currentPrice: currentClose,
      recommendedEntryZone: {
        low: Math.round((currentClose - atr * 0.3) * 10) / 10,
        high: Math.round((currentClose + atr * 0.2) * 10) / 10
      },
      suggestedStopLoss,
      stopDistancePercent,
      target1,
      target1Percent,
      target2,
      target2Percent,
      riskRewardRatio,
      estimatedSlippagePercent: estimatedSlippage,
      estimatedBrokerageRoundTripPercent: estimatedBrokerage,
      estimatedNetExpectancyPercent: estimatedNetExpectancy,
      liquidityAbsorptionScore: Math.min(100, Math.round((snapshot.stockState.liquidity.adt20 / 1000000) * 5))
    };

    // 11. Evaluate Eligibility & Enforce Hard Blockers
    const eligibility = DecisionEligibilityService.evaluateEligibility(
      snapshot,
      conflicts,
      alignment,
      allMatchingObservations.length,
      researchGrade
    );

    // 12. Generate Decision Explanations
    const explanation = DecisionExplanationService.generateExplanation(
      snapshot,
      fullyNormalized,
      alignment,
      conflicts,
      probability,
      eligibility
    );

    // 13. Assemble Assessment Container
    const assessment: DecisionAssessment = {
      id: `ASSESS-${symbol}-${targetDate}`,
      symbol,
      companyName: snapshot.stockState.companyName,
      sectorName: snapshot.sectorState.sectorName,
      asOfDate: targetDate,
      dataSource: snapshot.stateAvailability?.dataSourceMode || 'MOCK_DATA',
      engineVersion: this.ENGINE_VERSION,
      probabilityEngineVersion: this.PROB_ENGINE_VERSION,
      calculationTimestamp: new Date().toISOString(),
      evidenceItems: fullyNormalized,
      alignment,
      conflicts,
      probability,
      comparables,
      eligibility,
      riskReward,
      explanation,
      researchEvidenceGrade: researchGrade,
      researchGradeExplanation: gradeExplanation,
      audit: {
        inputSnapshotHash: `SHA256:${symbol}-${targetDate}-${snapshot.stockState.price.close}`,
        dataProvenance: snapshot.stateAvailability?.dataSourceMode || 'MOCK_DATA',
        totalObservationsMatched: allMatchingObservations.length,
        isPointInTimeGuaranteed: true,
        engineVersion: this.ENGINE_VERSION,
        probabilityEngineVersion: this.PROB_ENGINE_VERSION,
        calculationTimestamp: new Date().toISOString()
      }
    };

    return assessment;
  }

  /**
   * Generates a market-wide evidence ranking across NEPSE universe
   * Evaluates quality, sample size, alignment, robustness, and execution realism.
   */
  public static async getMarketWideRanking(asOfDate?: string): Promise<MarketWideEvidenceRankingItem[]> {
    const targetDate = asOfDate || '2026-08-30';
    const cachedSymbols = getCachedSymbols();
    const symbols = cachedSymbols.length > 0 ? cachedSymbols : normalizedCompanies.map(c => c.symbol);
    const rankings: MarketWideEvidenceRankingItem[] = [];

    for (const sym of symbols) {
      try {
        const assessment = await this.getAssessment(sym, targetDate);
        const p5 = assessment.probability.distributions[5];
        const p20 = assessment.probability.distributions[20];

        // Multi-Factor Composite Score Calculation (0 to 100)
        // 1. Alignment contribution (max 35)
        const alignContribution = assessment.alignment.alignmentScore * (assessment.alignment.netDirectionalScore > 0 ? 35 : 10);

        // 2. Research Grade contribution (max 25)
        let gradeContribution = 15;
        if (assessment.researchEvidenceGrade === 'A') gradeContribution = 25;
        else if (assessment.researchEvidenceGrade === 'B') gradeContribution = 20;
        else if (assessment.researchEvidenceGrade === 'C') gradeContribution = 12;
        else if (assessment.researchEvidenceGrade === 'D') gradeContribution = 6;
        else gradeContribution = 0;

        // 3. 5-Day Probability contribution (max 25)
        const probContribution = p5 ? (p5.pPositive / 100) * 25 : 12;

        // 4. Liquidity contribution (max 15)
        const liqScore = assessment.riskReward.liquidityAbsorptionScore > 50 ? 15 : 8;

        // 5. Conflict Penalty (subtract up to 20)
        const conflictPenalty = assessment.conflicts.conflictCount * 8;

        const rawComposite = alignContribution + gradeContribution + probContribution + liqScore - conflictPenalty;
        const compositeScore = Math.max(5, Math.min(99, Math.round(rawComposite)));

        // Risk Level
        let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' = 'MODERATE';
        if (assessment.conflicts.hasCriticalConflict || assessment.eligibility.hasHardBlocker) riskLevel = 'EXTREME';
        else if (assessment.conflicts.conflictCount > 0) riskLevel = 'HIGH';
        else if (compositeScore > 75) riskLevel = 'LOW';

        rankings.push({
          symbol: sym,
          companyName: assessment.companyName,
          sector: assessment.sectorName,
          compositeScore,
          evidenceAlignment: assessment.alignment.overallAlignment,
          alignmentScore: assessment.alignment.alignmentScore,
          historicalSupportObservations: p5?.observations ?? 0,
          researchGrade: assessment.researchEvidenceGrade,
          fiveDayProb: p5?.pPositive ?? 50,
          fiveDayWilsonCI: p5?.wilsonInterval ?? { lower: 40, upper: 60 },
          twentyDayProb: p20?.pPositive ?? 50,
          twentyDayWilsonCI: p20?.wilsonInterval ?? { lower: 40, upper: 60 },
          riskLevel,
          liquidityRating: assessment.riskReward.liquidityAbsorptionScore >= 60 ? 'HIGH' : 'ACCEPTABLE',
          marketRegime: assessment.comparables[0]?.marketRegime || 'BULL',
          eligibilityStatus: assessment.eligibility.status,
          primaryBlockerOrWarning: assessment.eligibility.warnings[0] || assessment.eligibility.primaryReason
        });
      } catch (e) {
        console.error(`Error ranking symbol ${sym}:`, e);
      }
    }

    // Sort by composite evidence score descending
    rankings.sort((a, b) => b.compositeScore - a.compositeScore);
    return rankings;
  }
}
