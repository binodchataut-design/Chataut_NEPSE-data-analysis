/**
 * Evidence Conflict Service (Phase 4B)
 * Explicitly identifies, analyzes, and classifies contradictions between evidence dimensions.
 * Never hides conflicting evidence behind an aggregated score.
 */

import {
  NormalizedEvidenceItem,
  EvidenceConflict,
  EvidenceConflictResult,
  ConflictType,
  ConflictSeverity
} from '../../types/decisionIntelligence';

export class EvidenceConflictService {
  /**
   * Scans a set of normalized evidence items for explicit contradictions
   */
  public static detectConflicts(items: NormalizedEvidenceItem[]): EvidenceConflictResult {
    const conflicts: EvidenceConflict[] = [];

    // Fast lookup maps
    const itemMap = new Map<string, NormalizedEvidenceItem>();
    const byCategory = new Map<string, NormalizedEvidenceItem[]>();

    for (const item of items) {
      itemMap.set(item.id, item);
      const list = byCategory.get(item.category) || [];
      list.push(item);
      byCategory.set(item.category, list);
    }

    const trend = itemMap.get('EV_TREND_MA_ALIGN');
    const structure = itemMap.get('EV_STRUCT_SWING');
    const volume = itemMap.get('EV_VOL_RVOL20');
    const cmf = itemMap.get('EV_VOL_CMF');
    const market = itemMap.get('EV_MKT_REGIME');
    const fundamental = itemMap.get('EV_FUND_VALUATION');
    const liquidity = itemMap.get('EV_LIQ_ADT20');
    const broker = itemMap.get('EV_BROKER_FLOW');
    const rsi = itemMap.get('EV_MOM_RSI14');

    // 1. Conflict: Technical Trend / Breakout vs Fundamental Valuation
    const isTechBull = (trend?.direction === 'BULLISH' || structure?.direction === 'BULLISH');
    if (isTechBull && fundamental && fundamental.direction === 'BEARISH') {
      conflicts.push({
        id: 'CONF_TECH_VS_FUND',
        type: 'VALUATION_TREND',
        severity: 'MODERATE',
        evidenceA: {
          id: structure?.id || trend?.id || 'EV_TECH_SETUP',
          name: structure?.name || trend?.name || 'Technical Setup',
          category: 'PRICE_STRUCTURE',
          direction: 'BULLISH',
          details: structure?.formattedValue || trend?.formattedValue || 'Bullish setup'
        },
        evidenceB: {
          id: fundamental.id,
          name: fundamental.name,
          category: 'FUNDAMENTAL',
          direction: 'BEARISH',
          details: fundamental.formattedValue || 'P/E stretched'
        },
        title: 'Technical Trend vs. Fundamental Valuation Friction',
        explanation: 'Price structure is bullish, but valuation multiples are stretched relative to earnings quality.',
        impactOnDecision: 'Reduces long-term holding viability; setup may be vulnerable to sudden mean-reversion pullbacks.'
      });
    }

    // 2. Conflict: Strong Setup vs Insufficient Liquidity / Execution Reality
    if (isTechBull && liquidity && liquidity.direction === 'BEARISH') {
      conflicts.push({
        id: 'CONF_SETUP_VS_LIQUIDITY',
        type: 'EXECUTION_FRICTION',
        severity: 'HIGH',
        evidenceA: {
          id: structure?.id || trend?.id || 'EV_TECH_SETUP',
          name: structure?.name || trend?.name || 'Technical Setup',
          category: 'PRICE_STRUCTURE',
          direction: 'BULLISH',
          details: structure?.formattedValue || 'Bullish breakout'
        },
        evidenceB: {
          id: liquidity.id,
          name: liquidity.name,
          category: 'LIQUIDITY',
          direction: 'BEARISH',
          details: liquidity.formattedValue || 'Illiquid trading volume'
        },
        title: 'Setup Formation vs. Insufficient Liquidity Barrier',
        explanation: 'Strong visual price structure is severely constrained by low trading turnover (ADT20 below safety threshold).',
        impactOnDecision: 'High slippage and execution difficulty. Requires reduced position sizing or hard disqualification.'
      });
    }

    // 3. Conflict: Bullish Stock vs Bearish NEPSE Market Regime
    if (isTechBull && market && market.direction === 'BEARISH') {
      conflicts.push({
        id: 'CONF_STOCK_VS_MARKET_REGIME',
        type: 'REGIME_DECOUPLING',
        severity: 'CRITICAL',
        evidenceA: {
          id: structure?.id || trend?.id || 'EV_TECH_SETUP',
          name: structure?.name || trend?.name || 'Technical Setup',
          category: 'TREND',
          direction: 'BULLISH',
          details: 'Individual stock attempting long breakout'
        },
        evidenceB: {
          id: market.id,
          name: market.name,
          category: 'MARKET_REGIME',
          direction: 'BEARISH',
          details: market.formattedValue || 'Market in BEAR regime'
        },
        title: 'Stock Breakout vs. Broad Market Downtrend',
        explanation: 'Individual stock is showing bullish momentum while the broader NEPSE market is in a confirmed Bear regime.',
        impactOnDecision: 'Over 70% of breakout attempts fail in Bear regimes due to persistent broad-market liquidity withdrawal.'
      });
    }

    // 4. Conflict: Breakout Structure vs Negative Money Flow (Volume Divergence)
    if (structure?.direction === 'BULLISH' && cmf && cmf.direction === 'BEARISH') {
      conflicts.push({
        id: 'CONF_BREAKOUT_VS_CMF',
        type: 'DIRECT_CONTRADICTION',
        severity: 'HIGH',
        evidenceA: {
          id: structure.id,
          name: structure.name,
          category: 'PRICE_STRUCTURE',
          direction: 'BULLISH',
          details: 'Price broke above resistance'
        },
        evidenceB: {
          id: cmf.id,
          name: cmf.name,
          category: 'VOLUME',
          direction: 'BEARISH',
          details: 'Chaikin Money Flow is negative'
        },
        title: 'Price Breakout without Institutional Volume Confirmation',
        explanation: 'Price made a higher high, but institutional money flow (CMF) remains negative, indicating potential distribution into strength.',
        impactOnDecision: 'High risk of a false breakout (bull trap) due to lack of institutional sponsorship.'
      });
    }

    // 5. Conflict: Bullish Trend vs Overbought Momentum Exhaustion
    if (trend?.direction === 'BULLISH' && rsi && rsi.direction === 'BEARISH' && (typeof rsi.rawValue === 'number' && rsi.rawValue > 75)) {
      conflicts.push({
        id: 'CONF_TREND_VS_RSI_OVERBOUGHT',
        type: 'DIRECT_CONTRADICTION',
        severity: 'LOW',
        evidenceA: {
          id: trend.id,
          name: trend.name,
          category: 'TREND',
          direction: 'BULLISH',
          details: 'Moving averages in full bullish stack'
        },
        evidenceB: {
          id: rsi.id,
          name: rsi.name,
          category: 'MOMENTUM',
          direction: 'BEARISH',
          details: `RSI is ${rsi.formattedValue}`
        },
        title: 'Established Uptrend vs. Extreme Overbought Exhaustion',
        explanation: 'Trend is intact, but RSI is overextended above 75, suggesting immediate upside momentum is exhausted.',
        impactOnDecision: 'Entering at market presents poor risk/reward; waiting for a pullback to EMA20 is statistically preferred.'
      });
    }

    const hasCriticalConflict = conflicts.some(c => c.severity === 'CRITICAL');
    const summary = conflicts.length === 0
      ? 'No structural contradictions detected between technical, fundamental, market, and volume evidence.'
      : `${conflicts.length} evidence conflict(s) detected (${conflicts.map(c => c.title).join('; ')}).`;

    return {
      hasCriticalConflict,
      conflictCount: conflicts.length,
      conflicts,
      summary
    };
  }
}
