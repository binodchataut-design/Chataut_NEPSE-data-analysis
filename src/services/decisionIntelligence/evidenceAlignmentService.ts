/**
 * Evidence Alignment Service (Phase 4B)
 * Evaluates whether independent evidence sources agree.
 * Strictly de-correlates redundant and collinear indicators (e.g. SMA20>50, EMA20>50)
 * so they do not fabricate artificial confluence.
 */

import {
  NormalizedEvidenceItem,
  EvidenceAlignmentResult,
  AlignmentClassification,
  CategoryConsensus,
  EvidenceCategory,
  EvidenceDirection
} from '../../types/decisionIntelligence';

export class EvidenceAlignmentService {
  /**
   * Weights assigned to each independent evidence category
   */
  public static readonly CATEGORY_WEIGHTS: Record<EvidenceCategory, number> = {
    MARKET_REGIME: 1.2,
    SECTOR: 1.1,
    TREND: 1.2,
    MOMENTUM: 1.0,
    VOLUME: 1.1,
    PRICE_STRUCTURE: 1.1,
    RELATIVE_STRENGTH: 1.0,
    LIQUIDITY: 1.0,
    FUNDAMENTAL: 0.8,
    BROKER: 0.8,
    VOLATILITY: 0.8,
    MARKET_BREADTH: 0.9,
    STATISTICAL: 0.8,
    HISTORICAL: 1.1,
    RISK: 1.0,
    EXECUTION: 0.8,
    DATA_QUALITY: 1.0,
    TECHNICAL: 1.0
  };

  /**
   * Evaluates alignment across a list of normalized evidence items
   */
  public static evaluateAlignment(items: NormalizedEvidenceItem[]): EvidenceAlignmentResult {
    const categoryMap = new Map<EvidenceCategory, NormalizedEvidenceItem[]>();
    const redundancyGroupsSeen = new Set<string>();

    let bullishCount = 0;
    let bearishCount = 0;
    let neutralCount = 0;
    let independentCount = 0;
    let redundantCount = 0;

    // 1. Group items by category and track redundancy
    for (const item of items) {
      if (item.direction === 'BULLISH') bullishCount++;
      else if (item.direction === 'BEARISH') bearishCount++;
      else neutralCount++;

      if (item.isRedundant && item.redundancyGroup) {
        redundantCount++;
      } else {
        independentCount++;
      }

      const list = categoryMap.get(item.category) || [];
      list.push(item);
      categoryMap.set(item.category, list);
    }

    // 2. Build Category Consensus with de-correlation
    const categoryBreakdown: Record<string, CategoryConsensus> = {};
    let weightedScoreSum = 0;
    let totalWeight = 0;
    let positiveWeight = 0;
    let negativeWeight = 0;

    const allCategories: EvidenceCategory[] = [
      'MARKET_REGIME',
      'MARKET_BREADTH',
      'SECTOR',
      'RELATIVE_STRENGTH',
      'TREND',
      'MOMENTUM',
      'VOLUME',
      'VOLATILITY',
      'PRICE_STRUCTURE',
      'LIQUIDITY',
      'FUNDAMENTAL',
      'BROKER',
      'HISTORICAL',
      'RISK',
      'EXECUTION',
      'DATA_QUALITY',
      'STATISTICAL',
      'TECHNICAL'
    ];

    for (const cat of allCategories) {
      const catItems = categoryMap.get(cat) || [];
      const weight = this.CATEGORY_WEIGHTS[cat] || 1.0;

      if (catItems.length === 0) {
        categoryBreakdown[cat] = {
          category: cat,
          direction: 'NEUTRAL',
          weight,
          effectiveScore: 0,
          itemCount: 0,
          independentCount: 0,
          itemNames: []
        };
        continue;
      }

      // De-duplicate within redundancy groups for this category
      const uniqueGroupItems: NormalizedEvidenceItem[] = [];
      const processedGroups = new Set<string>();

      for (const it of catItems) {
        if (it.isRedundant && it.redundancyGroup) {
          if (!processedGroups.has(it.redundancyGroup)) {
            processedGroups.add(it.redundancyGroup);
            uniqueGroupItems.push(it);
          }
        } else {
          uniqueGroupItems.push(it);
        }
      }

      // Compute average effective score for category
      const sumScores = uniqueGroupItems.reduce((sum, i) => sum + i.normalizedScore * i.reliability, 0);
      const effectiveScore = uniqueGroupItems.length > 0
        ? Math.round((sumScores / uniqueGroupItems.length) * 1000) / 1000
        : 0;

      let catDirection: EvidenceDirection = 'NEUTRAL';
      if (effectiveScore >= 0.20) {
        catDirection = 'BULLISH';
        positiveWeight += weight * Math.abs(effectiveScore);
      } else if (effectiveScore <= -0.20) {
        catDirection = 'BEARISH';
        negativeWeight += weight * Math.abs(effectiveScore);
      }

      weightedScoreSum += effectiveScore * weight;
      totalWeight += weight;

      categoryBreakdown[cat] = {
        category: cat,
        direction: catDirection,
        weight,
        effectiveScore,
        itemCount: catItems.length,
        independentCount: uniqueGroupItems.length,
        itemNames: catItems.map(i => i.name)
      };
    }

    const netDirectionalScore = totalWeight > 0
      ? Math.round((weightedScoreSum / totalWeight) * 1000) / 1000
      : 0;

    // 3. Compute Alignment Score (consensus among opposing forces)
    // High alignment means one side dominates with very low opposing evidence
    const activeTotalWeight = positiveWeight + negativeWeight;
    let alignmentScore = 0.50;
    if (activeTotalWeight > 0) {
      const dominance = Math.max(positiveWeight, negativeWeight) / activeTotalWeight;
      alignmentScore = Math.round(dominance * 1000) / 1000;
    }

    // 4. Classify Alignment
    let overallAlignment: AlignmentClassification = 'NEUTRAL_OR_MIXED';
    const hasSharpContradiction = positiveWeight > 1.5 && negativeWeight > 1.5;

    if (hasSharpContradiction) {
      overallAlignment = 'CONFLICTED';
    } else if (netDirectionalScore >= 0.45 && alignmentScore >= 0.70) {
      overallAlignment = 'STRONG_CONVERGENT_BULLISH';
    } else if (netDirectionalScore >= 0.20) {
      overallAlignment = 'MODERATE_CONVERGENT_BULLISH';
    } else if (netDirectionalScore <= -0.45 && alignmentScore >= 0.70) {
      overallAlignment = 'STRONG_CONVERGENT_BEARISH';
    } else if (netDirectionalScore <= -0.20) {
      overallAlignment = 'MODERATE_CONVERGENT_BEARISH';
    } else {
      overallAlignment = 'NEUTRAL_OR_MIXED';
    }

    // 5. Confluence Notes
    const confluenceNotes: string[] = [];
    if (overallAlignment === 'STRONG_CONVERGENT_BULLISH') {
      confluenceNotes.push('High multi-factor confluence across Market, Sector, Trend, and Volume.');
    }
    if (redundantCount > 0) {
      confluenceNotes.push(`${redundantCount} collinear indicator(s) de-correlated to prevent artificial confirmation bias.`);
    }
    if (hasSharpContradiction) {
      confluenceNotes.push('Significant multi-dimensional divergence detected between opposing evidence categories.');
    }

    return {
      overallAlignment,
      alignmentScore,
      netDirectionalScore,
      bullishEvidenceCount: bullishCount,
      bearishEvidenceCount: bearishCount,
      neutralEvidenceCount: neutralCount,
      independentEvidenceCount: independentCount,
      redundantItemCount: redundantCount,
      categoryBreakdown: categoryBreakdown as Record<EvidenceCategory, CategoryConsensus>,
      confluenceNotes
    };
  }
}
