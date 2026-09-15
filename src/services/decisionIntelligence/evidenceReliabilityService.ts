/**
 * Evidence Reliability Service (Phase 4B)
 * Transparent mathematical formulation calculating statistical reliability for evidence items.
 *
 * FORMULATION:
 * Reliability R in [0, 1] is calculated as:
 * R = (w_sample * S_sample) + (w_grade * S_grade) + (w_ci * S_ci) + (w_stability * S_stability) + (w_data * S_data)
 *
 * Weights:
 * - w_sample    = 0.30 (Sample size depth)
 * - w_grade     = 0.25 (Phase 3D Research Validity Grade)
 * - w_ci        = 0.20 (Wilson Confidence Interval precision: 1 - width)
 * - w_stability = 0.15 (Out-of-sample / Regime stability)
 * - w_data      = 0.10 (Data Quality & Liquidity coverage)
 *
 * Redundant items suffer a collinearity dampening factor of 0.5 to prevent false confluence.
 */

import { EvidenceItem, EvidenceHistoricalSupport } from '../../types/decisionIntelligence';
import { EvidenceGrade } from '../../types/researchValidation';

export interface ReliabilityBreakdown {
  sampleScore: number;
  gradeScore: number;
  ciScore: number;
  stabilityScore: number;
  dataQualityScore: number;
  collinearityDampener: number;
  finalReliability: number;
  explanation: string;
}

export class EvidenceReliabilityService {
  public static readonly WEIGHT_SAMPLE = 0.30;
  public static readonly WEIGHT_GRADE = 0.25;
  public static readonly WEIGHT_CI = 0.20;
  public static readonly WEIGHT_STABILITY = 0.15;
  public static readonly WEIGHT_DATA = 0.10;

  /**
   * Evaluates the reliability of a given evidence item
   */
  public static calculateReliability(
    item: EvidenceItem,
    overrideGrade?: EvidenceGrade,
    isOutOfSampleStable: boolean = true
  ): ReliabilityBreakdown {
    const support: EvidenceHistoricalSupport | undefined = item.historicalSupport;

    // 1. Sample Size Score (S_sample)
    const n = support?.observations ?? 0;
    let sampleScore = 0.20;
    if (n >= 150) sampleScore = 1.0;
    else if (n >= 80) sampleScore = 0.85;
    else if (n >= 40) sampleScore = 0.70;
    else if (n >= 20) sampleScore = 0.50;
    else if (n >= 10) sampleScore = 0.30;

    // 2. Research Grade Score (S_grade)
    const grade = support?.evidenceGrade || overrideGrade || 'B';
    let gradeScore = 0.65;
    switch (grade) {
      case 'A': gradeScore = 1.00; break;
      case 'B': gradeScore = 0.85; break;
      case 'C': gradeScore = 0.65; break;
      case 'D': gradeScore = 0.40; break;
      case 'F': gradeScore = 0.10; break;
      default: gradeScore = 0.50; break;
    }

    // 3. Wilson Confidence Interval Precision Score (S_ci)
    // Precision = 1 - (upper - lower)
    let ciScore = 0.50;
    if (support?.wilsonLower !== undefined && support?.wilsonUpper !== undefined) {
      const width = Math.max(0, (support.wilsonUpper - support.wilsonLower) / 100);
      ciScore = Math.max(0, Math.min(1.0, 1.0 - width));
    }

    // 4. Out-of-sample / Temporal Stability Score (S_stability)
    const stabilityScore = isOutOfSampleStable ? 0.90 : 0.40;

    // 5. Data Quality Score (S_data)
    let dataQualityScore = 0.80;
    if (item.dataQuality === 'VALID') dataQualityScore = 1.00;
    else if (item.dataQuality === 'WARNING') dataQualityScore = 0.60;
    else if (item.dataQuality === 'INVALID') dataQualityScore = 0.10;

    // Base reliability before redundancy penalty
    const baseReliability =
      this.WEIGHT_SAMPLE * sampleScore +
      this.WEIGHT_GRADE * gradeScore +
      this.WEIGHT_CI * ciScore +
      this.WEIGHT_STABILITY * stabilityScore +
      this.WEIGHT_DATA * dataQualityScore;

    // 6. Collinearity Dampener (penalizes redundant moving averages, momentum clones)
    const collinearityDampener = item.isRedundant ? 0.50 : 1.00;

    const finalReliability = Math.max(
      0.05,
      Math.min(1.0, Math.round(baseReliability * collinearityDampener * 1000) / 1000)
    );

    const explanation = `Reliability ${finalReliability} (N=${n}, Grade=${grade}, CI_Score=${ciScore.toFixed(2)}${item.isRedundant ? ', Collinearity dampener: 0.5' : ''})`;

    return {
      sampleScore,
      gradeScore,
      ciScore,
      stabilityScore,
      dataQualityScore,
      collinearityDampener,
      finalReliability,
      explanation
    };
  }

  /**
   * Updates evidence items with calculated reliabilities and confidence
   */
  public static applyReliabilityToAll(
    items: EvidenceItem[],
    defaultGrade: EvidenceGrade = 'B'
  ): EvidenceItem[] {
    return items.map(item => {
      const breakdown = this.calculateReliability(item, defaultGrade);
      return {
        ...item,
        reliability: breakdown.finalReliability,
        confidence: Math.round(item.strength * breakdown.finalReliability * 1000) / 1000
      };
    });
  }
}
