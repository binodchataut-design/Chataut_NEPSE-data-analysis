/**
 * Evidence Normalization Service (Phase 4B)
 * Normalizes heterogeneous evidence sources into a standardized representation
 * (-1.0 to +1.0 scale and 0.0 to 1.0 strength) without destroying the raw values.
 */

import { EvidenceItem, NormalizedEvidenceItem, EvidenceDirection } from '../../types/decisionIntelligence';

export class EvidenceNormalizationService {
  /**
   * Normalizes a raw EvidenceItem into a NormalizedEvidenceItem
   * with continuous score [-1.0, +1.0].
   */
  public static normalize(item: EvidenceItem): NormalizedEvidenceItem {
    let normalizedScore = 0;

    switch (item.direction) {
      case 'BULLISH':
        normalizedScore = Math.max(0.1, Math.min(1.0, item.strength));
        break;
      case 'BEARISH':
        normalizedScore = -Math.max(0.1, Math.min(1.0, item.strength));
        break;
      case 'NEUTRAL':
        normalizedScore = 0;
        break;
      case 'MIXED':
        normalizedScore = 0;
        break;
      case 'UNKNOWN':
      default:
        normalizedScore = 0;
        break;
    }

    // Round to 3 decimal places
    normalizedScore = Math.round(normalizedScore * 1000) / 1000;

    return {
      ...item,
      normalizedScore,
      confidence: Math.round(item.strength * item.reliability * 1000) / 1000
    };
  }

  /**
   * Normalizes a collection of evidence items
   */
  public static normalizeAll(items: EvidenceItem[]): NormalizedEvidenceItem[] {
    return items.map(item => this.normalize(item));
  }

  /**
   * Converts indicator value to normalized direction and strength
   */
  public static evaluateRsi(rsi: number | null): { direction: EvidenceDirection; strength: number; explanation: string } {
    if (rsi === null || isNaN(rsi)) {
      return { direction: 'UNKNOWN', strength: 0, explanation: 'RSI data unavailable' };
    }
    if (rsi >= 75) {
      return { direction: 'BEARISH', strength: 0.85, explanation: `RSI (${rsi.toFixed(1)}) in extreme overbought territory (>75)` };
    }
    if (rsi >= 65) {
      return { direction: 'BULLISH', strength: 0.65, explanation: `RSI (${rsi.toFixed(1)}) showing strong bullish momentum (65-75)` };
    }
    if (rsi >= 50) {
      return { direction: 'BULLISH', strength: 0.50, explanation: `RSI (${rsi.toFixed(1)}) in bullish control zone (50-65)` };
    }
    if (rsi >= 40) {
      return { direction: 'NEUTRAL', strength: 0.25, explanation: `RSI (${rsi.toFixed(1)}) in neutral consolidation range (40-50)` };
    }
    if (rsi >= 25) {
      return { direction: 'BEARISH', strength: 0.60, explanation: `RSI (${rsi.toFixed(1)}) in bearish breakdown zone (25-40)` };
    }
    return { direction: 'BULLISH', strength: 0.70, explanation: `RSI (${rsi.toFixed(1)}) in extreme oversold territory (<25), potential mean-reversion` };
  }

  /**
   * Evaluates Moving Average alignment
   */
  public static evaluateTrendAlignment(aboveSMA20: boolean | null, aboveSMA50: boolean | null, aboveSMA200: boolean | null): {
    direction: EvidenceDirection;
    strength: number;
    explanation: string;
  } {
    if (aboveSMA20 === null || aboveSMA50 === null || aboveSMA200 === null) {
      return { direction: 'UNKNOWN', strength: 0, explanation: 'Insufficient moving average history' };
    }
    if (aboveSMA20 && aboveSMA50 && aboveSMA200) {
      return { direction: 'BULLISH', strength: 0.95, explanation: 'Price above 20, 50, and 200-day SMAs (full bullish alignment)' };
    }
    if (aboveSMA50 && aboveSMA200 && !aboveSMA20) {
      return { direction: 'BULLISH', strength: 0.65, explanation: 'Pullback to SMA20 within overarching medium/long-term uptrend' };
    }
    if (aboveSMA200 && !aboveSMA50) {
      return { direction: 'NEUTRAL', strength: 0.35, explanation: 'Price above 200 SMA but below 50 SMA (intermediate consolidation)' };
    }
    if (!aboveSMA20 && !aboveSMA50 && !aboveSMA200) {
      return { direction: 'BEARISH', strength: 0.90, explanation: 'Price below 20, 50, and 200-day SMAs (full bearish alignment)' };
    }
    return { direction: 'NEUTRAL', strength: 0.40, explanation: 'Mixed moving average structure' };
  }
}
