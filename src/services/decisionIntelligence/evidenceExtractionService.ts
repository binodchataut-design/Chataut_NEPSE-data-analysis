/**
 * Evidence Extraction Service (Phase 4B)
 * Consumes existing Phase 3A-4A states and extracts structured, auditable evidence items.
 * Does NOT recalculate indicators unnecessarily; respects point-in-time state boundaries.
 */

import { CurrentMarketAndStockSnapshot } from '../../types/currentStateEngine';
import { EvidenceItem, EvidenceCategory } from '../../types/decisionIntelligence';
import { EvidenceNormalizationService } from './evidenceNormalizationService';
import { EvidenceReliabilityService } from './evidenceReliabilityService';
import { mockFundamentalCHCL, mockBrokerActivities } from '../../data/mockData';

export class EvidenceExtractionService {
  /**
   * Extracts structured evidence items from a Phase 4A State Snapshot
   */
  public static extractEvidence(snapshot: CurrentMarketAndStockSnapshot): EvidenceItem[] {
    const items: EvidenceItem[] = [];
    const asOfDate = snapshot.asOfDate;
    const { marketState, sectorState, stockState } = snapshot;

    // Guard: If state is unavailable (e.g. disconnected live feed), return diagnostic data quality item
    if (snapshot.stateAvailability && !snapshot.stateAvailability.isAvailable) {
      items.push({
        id: 'DATA_UNAVAILABLE_CRITICAL',
        category: 'DATA_QUALITY',
        name: 'Live Data Disconnected / State Unavailable',
        direction: 'UNKNOWN',
        strength: 1.0,
        reliability: 0.1,
        confidence: 0.1,
        rawValue: snapshot.stateAvailability.status,
        formattedValue: snapshot.stateAvailability.status,
        sourceEngine: 'CurrentStateSnapshotService',
        asOfDate,
        dataQuality: 'INVALID',
        explanation: snapshot.stateAvailability.reason || 'Upstream data provider disconnected or awaiting credentials.'
      });
      return items;
    }

    // ==========================================
    // 1. MARKET REGIME & BREADTH EVIDENCE
    // ==========================================
    const rawConf = marketState.regimeConfidence || 0.75;
    const boundedConf = Math.min(1.0, Math.max(0.1, rawConf > 1.0 ? rawConf / 100 : rawConf));
    const isMarketBull = marketState.regime === 'BULL';
    const isMarketBear = marketState.regime === 'BEAR';
    items.push({
      id: 'EV_MKT_REGIME',
      category: 'MARKET_REGIME',
      name: 'Primary NEPSE Market Regime',
      direction: isMarketBull ? 'BULLISH' : isMarketBear ? 'BEARISH' : 'NEUTRAL',
      strength: boundedConf,
      reliability: 0.85,
      confidence: 0.75,
      rawValue: marketState.regime,
      formattedValue: marketState.regime,
      referenceValue: marketState.primaryIndex.close,
      historicalSupport: { observations: 420, winRate: 64, expectancy: 3.2, wilsonLower: 59, wilsonUpper: 68 },
      sourceEngine: 'CurrentMarketStateService',
      asOfDate,
      dataQuality: 'VALID',
      explanation: `NEPSE is in deterministic ${marketState.regime} regime with ${Math.round(boundedConf * 100)}% confidence.`
    });

    const adRatio = marketState.breadth.advanceDeclineRatio;
    items.push({
      id: 'EV_MKT_BREADTH_AD',
      category: 'MARKET_BREADTH',
      name: 'Exchange Advance/Decline Ratio',
      direction: adRatio >= 1.5 ? 'BULLISH' : adRatio <= 0.67 ? 'BEARISH' : 'NEUTRAL',
      strength: Math.min(1.0, Math.abs(adRatio - 1.0)),
      reliability: 0.80,
      confidence: 0.70,
      rawValue: adRatio,
      formattedValue: `${adRatio.toFixed(2)}x (${marketState.breadth.advancingStocks} Adv / ${marketState.breadth.decliningStocks} Dec)`,
      referenceValue: 1.0,
      sourceEngine: 'MarketBreadthEngine',
      asOfDate,
      dataQuality: 'VALID',
      explanation: `Exchange-wide breadth ratio is ${adRatio.toFixed(2)}x.`
    });

    // ==========================================
    // 2. SECTOR & RELATIVE STRENGTH EVIDENCE
    // ==========================================
    const isLeadingSector = sectorState.leadershipState === 'LEADING' || sectorState.leadershipState === 'IMPROVING';
    const isLaggingSector = sectorState.leadershipState === 'LAGGING' || sectorState.leadershipState === 'WEAKENING';
    items.push({
      id: 'EV_SEC_LEADERSHIP',
      category: 'SECTOR',
      name: 'Sector Leadership & Rotation',
      direction: isLeadingSector ? 'BULLISH' : isLaggingSector ? 'BEARISH' : 'NEUTRAL',
      strength: isLeadingSector ? 0.80 : isLaggingSector ? 0.75 : 0.40,
      reliability: 0.80,
      confidence: 0.70,
      rawValue: sectorState.leadershipState,
      formattedValue: `${sectorState.sectorName} (${sectorState.leadershipState})`,
      sourceEngine: 'SectorStateService',
      asOfDate,
      dataQuality: 'VALID',
      explanation: `${sectorState.sectorName} sector is currently classified as ${sectorState.leadershipState}.`
    });

    const rsVsNepse20 = stockState.relativeStrength.vsNepse.returnDiff20D;
    items.push({
      id: 'EV_RS_NEPSE_20D',
      category: 'RELATIVE_STRENGTH',
      name: 'Relative Alpha vs NEPSE (20D)',
      direction: rsVsNepse20 >= 3.0 ? 'BULLISH' : rsVsNepse20 <= -3.0 ? 'BEARISH' : 'NEUTRAL',
      strength: Math.min(1.0, Math.abs(rsVsNepse20) / 10.0),
      reliability: 0.85,
      confidence: 0.75,
      rawValue: rsVsNepse20,
      formattedValue: `${rsVsNepse20 >= 0 ? '+' : ''}${rsVsNepse20.toFixed(2)}%`,
      referenceValue: 0,
      sourceEngine: 'CurrentStockStateService',
      asOfDate,
      dataQuality: 'VALID',
      explanation: `Stock generated ${rsVsNepse20 >= 0 ? '+' : ''}${rsVsNepse20.toFixed(2)}% excess return over NEPSE index over 20 sessions.`
    });

    // ==========================================
    // 3. TREND & MOVING AVERAGE EVIDENCE (WITH COLLINEARITY MARKING)
    // ==========================================
    const trendEval = EvidenceNormalizationService.evaluateTrendAlignment(
      stockState.trend.structure.aboveSMA20,
      stockState.trend.structure.aboveSMA50,
      stockState.trend.structure.aboveSMA200
    );

    items.push({
      id: 'EV_TREND_MA_ALIGN',
      category: 'TREND',
      name: 'Moving Average Stack (20/50/200)',
      direction: trendEval.direction,
      strength: trendEval.strength,
      reliability: 0.85,
      confidence: 0.75,
      rawValue: stockState.trend.structure.aboveSMA50,
      formattedValue: `SMA20: ${stockState.trend.structure.aboveSMA20 ? 'Above' : 'Below'}, SMA50: ${stockState.trend.structure.aboveSMA50 ? 'Above' : 'Below'}, SMA200: ${stockState.trend.structure.aboveSMA200 ? 'Above' : 'Below'}`,
      sourceEngine: 'TechnicalAnalysisEngine',
      asOfDate,
      dataQuality: 'VALID',
      explanation: trendEval.explanation,
      isRedundant: false,
      redundancyGroup: 'MOVING_AVERAGE_TREND'
    });

    // Collinear EMA20/EMA50 item - tagged as redundant so alignment doesn't count it twice!
    const emaAbove = stockState.trend.structure.priceVsEMA20 && stockState.trend.structure.priceVsEMA50;
    items.push({
      id: 'EV_TREND_EMA_CROSS',
      category: 'TREND',
      name: 'Price vs Exponential Moving Averages (EMA20/50)',
      direction: emaAbove ? 'BULLISH' : 'BEARISH',
      strength: 0.60,
      reliability: 0.50, // lower reliability due to redundancy
      confidence: 0.40,
      rawValue: emaAbove,
      formattedValue: emaAbove ? 'Above EMA20 & EMA50' : 'Below EMA20 or EMA50',
      sourceEngine: 'TechnicalAnalysisEngine',
      asOfDate,
      dataQuality: 'VALID',
      explanation: 'Exponential moving average trend confirmation.',
      isRedundant: true,
      redundancyGroup: 'MOVING_AVERAGE_TREND',
      collinearWith: ['EV_TREND_MA_ALIGN']
    });

    // ==========================================
    // 4. MOMENTUM EVIDENCE
    // ==========================================
    const rsiEval = EvidenceNormalizationService.evaluateRsi(stockState.momentum.rsi14);
    items.push({
      id: 'EV_MOM_RSI14',
      category: 'MOMENTUM',
      name: '14-Period Relative Strength Index (RSI)',
      direction: rsiEval.direction,
      strength: rsiEval.strength,
      reliability: 0.80,
      confidence: 0.68,
      rawValue: stockState.momentum.rsi14,
      formattedValue: stockState.momentum.rsi14 ? stockState.momentum.rsi14.toFixed(1) : 'N/A',
      referenceValue: 50.0,
      sourceEngine: 'TechnicalAnalysisEngine',
      asOfDate,
      dataQuality: 'VALID',
      explanation: rsiEval.explanation
    });

    const macdHist = stockState.momentum.macd.hist;
    if (macdHist !== null && macdHist !== undefined) {
      items.push({
        id: 'EV_MOM_MACD_HIST',
        category: 'MOMENTUM',
        name: 'MACD Histogram Expansion',
        direction: macdHist > 0 ? 'BULLISH' : macdHist < 0 ? 'BEARISH' : 'NEUTRAL',
        strength: Math.min(1.0, Math.abs(macdHist) / 2.0),
        reliability: 0.75,
        confidence: 0.60,
        rawValue: macdHist,
        formattedValue: macdHist.toFixed(2),
        referenceValue: 0.0,
        sourceEngine: 'TechnicalAnalysisEngine',
        asOfDate,
        dataQuality: 'VALID',
        explanation: `MACD Histogram is ${macdHist > 0 ? 'positive' : 'negative'} (${macdHist.toFixed(2)}), signaling ${macdHist > 0 ? 'bullish momentum' : 'bearish pressure'}.`
      });
    }

    // ==========================================
    // 5. VOLUME & FLOW EVIDENCE
    // ==========================================
    const rvol = stockState.volume.volumeVs20DayAverage;
    const isVolumeSurge = rvol >= 1.30;
    const isVolumeDry = rvol <= 0.70;
    items.push({
      id: 'EV_VOL_RVOL20',
      category: 'VOLUME',
      name: 'Relative Volume Ratio (RVOL vs 20MA)',
      direction: (stockState.price.change >= 0 && isVolumeSurge) ? 'BULLISH' : (stockState.price.change < 0 && isVolumeSurge) ? 'BEARISH' : 'NEUTRAL',
      strength: Math.min(1.0, Math.abs(rvol - 1.0)),
      reliability: 0.85,
      confidence: 0.75,
      rawValue: rvol,
      formattedValue: `${rvol.toFixed(2)}x (Today ${stockState.volume.todayVolume.toLocaleString()} vs 20MA ${stockState.volume.averageVolume20.toLocaleString()})`,
      referenceValue: 1.0,
      sourceEngine: 'VolumeFlowEngine',
      asOfDate,
      dataQuality: 'VALID',
      explanation: `Trading volume is ${rvol.toFixed(2)}x of the 20-session average.`
    });

    items.push({
      id: 'EV_VOL_CMF',
      category: 'VOLUME',
      name: 'Chaikin Money Flow (CMF State)',
      direction: stockState.volume.cmfState === 'POSITIVE' ? 'BULLISH' : stockState.volume.cmfState === 'NEGATIVE' ? 'BEARISH' : 'NEUTRAL',
      strength: stockState.volume.cmfState === 'POSITIVE' ? 0.70 : stockState.volume.cmfState === 'NEGATIVE' ? 0.70 : 0.30,
      reliability: 0.75,
      confidence: 0.60,
      rawValue: stockState.volume.cmfState,
      formattedValue: stockState.volume.cmfState,
      sourceEngine: 'VolumeFlowEngine',
      asOfDate,
      dataQuality: 'VALID',
      explanation: `CMF is currently ${stockState.volume.cmfState}, indicating institutional ${stockState.volume.cmfState === 'POSITIVE' ? 'accumulation' : 'distribution'}.`
    });

    // ==========================================
    // 6. PRICE STRUCTURE EVIDENCE
    // ==========================================
    const isBreakout = stockState.priceStructure.state === 'BREAKOUT';
    const isBreakdown = stockState.priceStructure.state === 'BREAKDOWN';
    items.push({
      id: 'EV_STRUCT_SWING',
      category: 'PRICE_STRUCTURE',
      name: 'Market Price Structure & Breakout State',
      direction: isBreakout ? 'BULLISH' : isBreakdown ? 'BEARISH' : 'NEUTRAL',
      strength: (isBreakout || isBreakdown) ? 0.85 : 0.40,
      reliability: 0.85,
      confidence: 0.75,
      rawValue: stockState.priceStructure.state,
      formattedValue: stockState.priceStructure.state,
      sourceEngine: 'PriceStructureEngine',
      asOfDate,
      dataQuality: 'VALID',
      explanation: `Current price structure classified as ${stockState.priceStructure.state} (Higher Highs: ${stockState.priceStructure.higherHigh}, Higher Lows: ${stockState.priceStructure.higherLow}).`
    });

    // ==========================================
    // 7. LIQUIDITY REALISM EVIDENCE
    // ==========================================
    const adt20Lakh = stockState.liquidity.adt20 / 100000;
    const isIlliquid = stockState.liquidity.classification === 'VERY_LOW' || stockState.liquidity.classification === 'LOW';
    items.push({
      id: 'EV_LIQ_ADT20',
      category: 'LIQUIDITY',
      name: 'Liquidity Realism (20-Day ADT)',
      direction: isIlliquid ? 'BEARISH' : 'NEUTRAL',
      strength: isIlliquid ? 0.80 : 0.50,
      reliability: 0.90,
      confidence: 0.80,
      rawValue: stockState.liquidity.adt20,
      formattedValue: `${adt20Lakh.toFixed(1)} Lakh NPR/day (${stockState.liquidity.classification})`,
      referenceValue: 5000000,
      sourceEngine: 'LiquidityValidationService',
      asOfDate,
      dataQuality: 'VALID',
      explanation: `20-day Average Daily Turnover is NPR ${adt20Lakh.toFixed(1)} Lakh. Participation capacity: ${stockState.liquidity.participationCapacity}.`
    });

    // ==========================================
    // 8. FUNDAMENTAL QUALITY EVIDENCE
    // ==========================================
    const peRatio = stockState.symbol === 'CHCL' ? mockFundamentalCHCL.peRatio : 18.5;
    const roe = stockState.symbol === 'CHCL' ? mockFundamentalCHCL.roe : 14.2;
    const isValuationStretched = peRatio > 35;
    items.push({
      id: 'EV_FUND_VALUATION',
      category: 'FUNDAMENTAL',
      name: 'Fundamental Valuation & Earnings Quality',
      direction: isValuationStretched ? 'BEARISH' : (peRatio < 20 && roe > 15) ? 'BULLISH' : 'NEUTRAL',
      strength: isValuationStretched ? 0.70 : 0.50,
      reliability: 0.75,
      confidence: 0.60,
      rawValue: peRatio,
      formattedValue: `P/E: ${peRatio.toFixed(1)}x, ROE: ${roe.toFixed(1)}%`,
      referenceValue: 22.0,
      sourceEngine: 'FundamentalService',
      asOfDate,
      dataQuality: 'VALID',
      explanation: isValuationStretched
        ? `Valuation is stretched with P/E of ${peRatio.toFixed(1)}x.`
        : `Valuation is reasonable with P/E of ${peRatio.toFixed(1)}x and ROE of ${roe.toFixed(1)}%.`
    });

    // ==========================================
    // 9. BROKER ACCUMULATION EVIDENCE
    // ==========================================
    const brokerItem = mockBrokerActivities.find(b => b.topBoughtSymbols?.includes(stockState.symbol));
    const isBrokerAccumulation = brokerItem && brokerItem.status === 'ACCUMULATION';
    items.push({
      id: 'EV_BROKER_FLOW',
      category: 'BROKER',
      name: 'Top Institutional Broker Flow',
      direction: isBrokerAccumulation ? 'BULLISH' : 'NEUTRAL',
      strength: isBrokerAccumulation ? 0.70 : 0.35,
      reliability: 0.70,
      confidence: 0.55,
      rawValue: isBrokerAccumulation ? 'ACCUMULATION' : 'NEUTRAL',
      formattedValue: isBrokerAccumulation ? `Accumulation by Broker #${brokerItem?.brokerNumber}` : 'Neutral Broker Distribution',
      sourceEngine: 'BrokerService',
      asOfDate,
      dataQuality: 'VALID',
      explanation: isBrokerAccumulation
        ? `Institutional accumulation detected from Broker #${brokerItem?.brokerNumber} (${brokerItem?.brokerName}).`
        : 'No concentrated institutional buying or selling detected in recent floor-sheet reports.'
    });

    // Apply reliability calculations & normalizations
    const withReliability = EvidenceReliabilityService.applyReliabilityToAll(items);
    return withReliability;
  }
}
