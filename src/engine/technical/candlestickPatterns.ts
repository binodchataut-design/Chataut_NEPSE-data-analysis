/**
 * Candlestick Pattern Detection Engine
 * Implements deterministic mathematical recognition of:
 * - Single bar: Doji, Hammer, Inverted Hammer, Shooting Star, Hanging Man,
 *   Spinning Top, Marubozu
 * - Double bar: Bullish/Bearish Engulfing, Bullish/Bearish Harami, Piercing,
 *   Dark Cloud Cover, Inside Bar, Outside Bar
 * - Triple bar: Morning Star, Evening Star, Three White Soldiers, Three Black Crows
 *
 * IMPORTANT METHODOLOGICAL NOTE:
 * "confidence" represents the structural mathematical adherence to geometric conditions
 * (body-to-shadow ratios, threshold alignments). It is NOT a predictive probability of future movement.
 * Calculation Version: v1.0
 */

import { CandlestickPatternDetection, OHLCVBar } from '../../types/technicalIndicators';

export const CANDLESTICK_ENGINE_VERSION = 'v1.0';

interface CandleMetrics {
  body: number;
  upperShadow: number;
  lowerShadow: number;
  totalRange: number;
  isBullish: boolean;
  isBearish: boolean;
  isDoji: boolean;
}

function getCandleMetrics(bar: OHLCVBar): CandleMetrics {
  const body = Math.abs(bar.close - bar.open);
  const totalRange = bar.high - bar.low;
  const upperShadow = bar.high - Math.max(bar.open, bar.close);
  const lowerShadow = Math.min(bar.open, bar.close) - bar.low;
  const isBullish = bar.close > bar.open;
  const isBearish = bar.close < bar.open;
  const isDoji = totalRange > 0 && body / totalRange < 0.1;

  return {
    body,
    upperShadow,
    lowerShadow,
    totalRange,
    isBullish,
    isBearish,
    isDoji
  };
}

/**
 * Scan entire OHLCV series and return detected candlestick patterns at each bar
 */
export function detectCandlestickPatterns(bars: OHLCVBar[]): CandlestickPatternDetection[] {
  const detections: CandlestickPatternDetection[] = [];
  const len = bars.length;
  if (len === 0) return detections;

  for (let i = 0; i < len; i++) {
    const curr = bars[i];
    const m = getCandleMetrics(curr);
    if (m.totalRange === 0) continue;

    const bodyRatio = m.body / m.totalRange;

    // 1. DOJI
    if (m.isDoji) {
      detections.push({
        pattern: 'DOJI',
        category: 'SINGLE',
        direction: 'NEUTRAL',
        confidence: Math.round((1 - bodyRatio * 10) * 100),
        barIndex: i,
        date: curr.date,
        conditionsMet: [
          `Body is ${Math.round(bodyRatio * 100)}% of range (threshold < 10%)`,
          'Open and Close virtually identical'
        ]
      });
    }

    // 2. MARUBOZU
    if (bodyRatio >= 0.85) {
      const dir = m.isBullish ? 'BULLISH' : 'BEARISH';
      detections.push({
        pattern: `${dir}_MARUBOZU`,
        category: 'SINGLE',
        direction: dir,
        confidence: Math.min(100, Math.round(bodyRatio * 100)),
        barIndex: i,
        date: curr.date,
        conditionsMet: [
          `Body represents ${Math.round(bodyRatio * 100)}% of candle range`,
          'Minimal or absent upper and lower wicks'
        ]
      });
    }

    // 3. HAMMER & HANGING MAN (Small body at top, lower shadow >= 2x body)
    if (m.lowerShadow >= 2 * m.body && m.upperShadow <= 0.15 * m.totalRange && bodyRatio <= 0.35) {
      // Prior trend context if available
      const isPriorDowntrend = i >= 3 && bars[i - 1].close < bars[i - 3].close;
      if (isPriorDowntrend) {
        detections.push({
          pattern: 'HAMMER',
          category: 'SINGLE',
          direction: 'BULLISH',
          confidence: Math.min(95, Math.round((m.lowerShadow / (2 * m.body || 1)) * 50 + 40)),
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            `Lower shadow (${m.lowerShadow.toFixed(1)}) >= 2x body (${m.body.toFixed(1)})`,
            `Upper shadow is minimal (<15% of range)`,
            'Appears following local downward price slope'
          ]
        });
      } else {
        detections.push({
          pattern: 'HANGING_MAN',
          category: 'SINGLE',
          direction: 'BEARISH',
          confidence: 75,
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            'Long lower shadow with small body at upper boundary',
            'Appears following local upward price slope'
          ]
        });
      }
    }

    // 4. INVERTED HAMMER & SHOOTING STAR (Small body at bottom, upper shadow >= 2x body)
    if (m.upperShadow >= 2 * m.body && m.lowerShadow <= 0.15 * m.totalRange && bodyRatio <= 0.35) {
      const isPriorUptrend = i >= 3 && bars[i - 1].close > bars[i - 3].close;
      if (isPriorUptrend) {
        detections.push({
          pattern: 'SHOOTING_STAR',
          category: 'SINGLE',
          direction: 'BEARISH',
          confidence: Math.min(95, Math.round((m.upperShadow / (2 * m.body || 1)) * 50 + 40)),
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            `Upper shadow (${m.upperShadow.toFixed(1)}) >= 2x body`,
            'Small body at low end of range',
            'Preceded by upward price movement'
          ]
        });
      } else {
        detections.push({
          pattern: 'INVERTED_HAMMER',
          category: 'SINGLE',
          direction: 'BULLISH',
          confidence: 70,
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            'Upper shadow >= 2x body at low end of candle',
            'Preceded by downward price movement'
          ]
        });
      }
    }

    // 5. SPINNING TOP
    if (bodyRatio >= 0.15 && bodyRatio <= 0.35 && m.upperShadow >= m.body && m.lowerShadow >= m.body) {
      detections.push({
        pattern: 'SPINNING_TOP',
        category: 'SINGLE',
        direction: 'NEUTRAL',
        confidence: 70,
        barIndex: i,
        date: curr.date,
        conditionsMet: [
          'Small body with balanced upper and lower shadows',
          'Reflects mutual buyer and seller equilibrium'
        ]
      });
    }

    // Double bar patterns (require index >= 1)
    if (i >= 1) {
      const prev = bars[i - 1];
      const mPrev = getCandleMetrics(prev);

      // INSIDE BAR
      if (curr.high <= prev.high && curr.low >= prev.low) {
        detections.push({
          pattern: 'INSIDE_BAR',
          category: 'DOUBLE',
          direction: 'NEUTRAL',
          confidence: 85,
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            `High (${curr.high}) is lower than prior High (${prev.high})`,
            `Low (${curr.low}) is higher than prior Low (${prev.low})`,
            'Range fully contained within prior candle'
          ]
        });
      }

      // OUTSIDE BAR
      if (curr.high >= prev.high && curr.low <= prev.low) {
        const dir = m.isBullish ? 'BULLISH' : 'BEARISH';
        detections.push({
          pattern: `${dir}_OUTSIDE_BAR`,
          category: 'DOUBLE',
          direction: dir,
          confidence: 85,
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            `Current bar engulfed prior bar high (${prev.high}) and low (${prev.low})`,
            'Expanded volatility bar'
          ]
        });
      }

      // BULLISH ENGULFING
      if (
        mPrev.isBearish &&
        m.isBullish &&
        curr.open <= prev.close &&
        curr.close >= prev.open &&
        m.body > mPrev.body
      ) {
        detections.push({
          pattern: 'BULLISH_ENGULFING',
          category: 'DOUBLE',
          direction: 'BULLISH',
          confidence: 90,
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            'Prior candle was bearish',
            'Current candle opens at/below prior close and closes at/above prior open',
            `Current body (${m.body.toFixed(1)}) engulfs prior body (${mPrev.body.toFixed(1)})`
          ]
        });
      }

      // BEARISH ENGULFING
      if (
        mPrev.isBullish &&
        m.isBearish &&
        curr.open >= prev.close &&
        curr.close <= prev.open &&
        m.body > mPrev.body
      ) {
        detections.push({
          pattern: 'BEARISH_ENGULFING',
          category: 'DOUBLE',
          direction: 'BEARISH',
          confidence: 90,
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            'Prior candle was bullish',
            'Current candle opens at/above prior close and closes at/below prior open',
            `Current body (${m.body.toFixed(1)}) engulfs prior body (${mPrev.body.toFixed(1)})`
          ]
        });
      }

      // BULLISH HARAMI
      if (
        mPrev.isBearish &&
        m.isBullish &&
        curr.open >= prev.close &&
        curr.close <= prev.open &&
        m.body < mPrev.body * 0.7
      ) {
        detections.push({
          pattern: 'BULLISH_HARAMI',
          category: 'DOUBLE',
          direction: 'BULLISH',
          confidence: 75,
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            'Prior bar was a large bearish body',
            'Current smaller bullish body is contained completely within prior body'
          ]
        });
      }

      // BEARISH HARAMI
      if (
        mPrev.isBullish &&
        m.isBearish &&
        curr.open <= prev.close &&
        curr.close >= prev.open &&
        m.body < mPrev.body * 0.7
      ) {
        detections.push({
          pattern: 'BEARISH_HARAMI',
          category: 'DOUBLE',
          direction: 'BEARISH',
          confidence: 75,
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            'Prior bar was a large bullish body',
            'Current smaller bearish body is contained completely within prior body'
          ]
        });
      }

      // PIERCING LINE (Bearish bar followed by gap down opening and closing above 50% midpoint of prior body)
      const prevMid = (prev.open + prev.close) / 2;
      if (
        mPrev.isBearish &&
        m.isBullish &&
        curr.open < prev.low &&
        curr.close > prevMid &&
        curr.close < prev.open
      ) {
        detections.push({
          pattern: 'PIERCING_LINE',
          category: 'DOUBLE',
          direction: 'BULLISH',
          confidence: 85,
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            'First candle is long bearish',
            'Second candle opens below prior low',
            `Second candle closes above 50% midpoint of first candle (${prevMid.toFixed(1)})`
          ]
        });
      }

      // DARK CLOUD COVER
      if (
        mPrev.isBullish &&
        m.isBearish &&
        curr.open > prev.high &&
        curr.close < prevMid &&
        curr.close > prev.open
      ) {
        detections.push({
          pattern: 'DARK_CLOUD_COVER',
          category: 'DOUBLE',
          direction: 'BEARISH',
          confidence: 85,
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            'First candle is long bullish',
            'Second candle opens above prior high',
            `Second candle closes below 50% midpoint of first candle (${prevMid.toFixed(1)})`
          ]
        });
      }
    }

    // Triple bar patterns (require index >= 2)
    if (i >= 2) {
      const b0 = bars[i - 2];
      const b1 = bars[i - 1];
      const b2 = bars[i];
      const m0 = getCandleMetrics(b0);
      const m1 = getCandleMetrics(b1);
      const m2 = getCandleMetrics(b2);

      // MORNING STAR: Long Bearish -> Small Star -> Long Bullish
      if (
        m0.isBearish &&
        m0.body / m0.totalRange > 0.5 &&
        m1.body / (m1.totalRange || 1) < 0.35 &&
        b1.close < b0.close &&
        m2.isBullish &&
        m2.body / m2.totalRange > 0.5 &&
        b2.close > (b0.open + b0.close) / 2
      ) {
        detections.push({
          pattern: 'MORNING_STAR',
          category: 'TRIPLE',
          direction: 'BULLISH',
          confidence: 90,
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            'Bar 1 is a strong bearish candle',
            'Bar 2 is a small star gapping or hovering at lower boundary',
            'Bar 3 is a strong bullish candle closing past midpoint of Bar 1'
          ]
        });
      }

      // EVENING STAR: Long Bullish -> Small Star -> Long Bearish
      if (
        m0.isBullish &&
        m0.body / m0.totalRange > 0.5 &&
        m1.body / (m1.totalRange || 1) < 0.35 &&
        b1.close > b0.close &&
        m2.isBearish &&
        m2.body / m2.totalRange > 0.5 &&
        b2.close < (b0.open + b0.close) / 2
      ) {
        detections.push({
          pattern: 'EVENING_STAR',
          category: 'TRIPLE',
          direction: 'BEARISH',
          confidence: 90,
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            'Bar 1 is a strong bullish candle',
            'Bar 2 is a small star at upper boundary',
            'Bar 3 is a strong bearish candle closing past midpoint of Bar 1'
          ]
        });
      }

      // THREE WHITE SOLDIERS
      if (
        m0.isBullish &&
        m1.isBullish &&
        m2.isBullish &&
        b1.close > b0.close &&
        b2.close > b1.close &&
        b1.open > b0.open &&
        b1.open < b0.close &&
        b2.open > b1.open &&
        b2.open < b1.close
      ) {
        detections.push({
          pattern: 'THREE_WHITE_SOLDIERS',
          category: 'TRIPLE',
          direction: 'BULLISH',
          confidence: 90,
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            'Three consecutive strong bullish candles',
            'Each candle opens within the previous candle body and closes to new highs'
          ]
        });
      }

      // THREE BLACK CROWS
      if (
        m0.isBearish &&
        m1.isBearish &&
        m2.isBearish &&
        b1.close < b0.close &&
        b2.close < b1.close &&
        b1.open < b0.open &&
        b1.open > b0.close &&
        b2.open < b1.open &&
        b2.open > b1.close
      ) {
        detections.push({
          pattern: 'THREE_BLACK_CROWS',
          category: 'TRIPLE',
          direction: 'BEARISH',
          confidence: 90,
          barIndex: i,
          date: curr.date,
          conditionsMet: [
            'Three consecutive strong bearish candles',
            'Each candle opens within the previous candle body and closes to new lows'
          ]
        });
      }
    }
  }

  return detections;
}
