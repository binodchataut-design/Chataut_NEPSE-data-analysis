import { ConditionGroup, StandardConditionPreset } from '../../types/historicalResearch';

export interface PrecomputedIndicators {
  bars: any[];
  sma20: number[];
  sma50: number[];
  sma200?: number[];
  ema20?: number[];
  bb: { upper: number[]; lower: number[]; middle: number[] } | any;
  rsi14: number[];
  adx14: number[];
  macd: { hist: number[]; macd?: number[]; signal?: number[] } | any;
  cmf20: number[];
  volumeMA20?: number[];
  [key: string]: any;
}

export class SignalConditionEngine {
  static evaluate(...args: any[]): any {
    return true;
  }

  static precomputeIndicators(bars: any[], ...rest: any[]): PrecomputedIndicators {
    const len = bars?.length || 0;
    if (len === 0) {
      return {
        bars: [],
        sma20: [],
        sma50: [],
        sma200: [],
        ema20: [],
        bb: { upper: [], lower: [], middle: [] },
        rsi14: [],
        adx14: [],
        macd: { hist: [], macd: [], signal: [] },
        cmf20: [],
        volumeMA20: [],
      };
    }

    const closes: number[] = bars.map(b => b.close);
    const volumes: number[] = bars.map(b => b.volume || 0);

    const sma20: number[] = new Array(len);
    const sma50: number[] = new Array(len);
    const sma200: number[] = new Array(len);
    const volumeMA20: number[] = new Array(len);
    const bbUpper: number[] = new Array(len);
    const bbLower: number[] = new Array(len);
    const bbMiddle: number[] = new Array(len);

    for (let i = 0; i < len; i++) {
      // sma20 & bb
      if (i >= 19) {
        const slice = closes.slice(i - 19, i + 1);
        const mean = slice.reduce((a, b) => a + b, 0) / 20;
        sma20[i] = Math.round(mean * 100) / 100;
        bbMiddle[i] = sma20[i];
        const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 20;
        const std = Math.sqrt(variance);
        bbUpper[i] = Math.round((mean + 2 * std) * 100) / 100;
        bbLower[i] = Math.round((mean - 2 * std) * 100) / 100;
      } else {
        sma20[i] = closes[i];
        bbMiddle[i] = closes[i];
        bbUpper[i] = Math.round(closes[i] * 1.05 * 100) / 100;
        bbLower[i] = Math.round(closes[i] * 0.95 * 100) / 100;
      }

      // sma50
      if (i >= 49) {
        const slice = closes.slice(i - 49, i + 1);
        sma50[i] = Math.round((slice.reduce((a, b) => a + b, 0) / 50) * 100) / 100;
      } else {
        sma50[i] = closes[i];
      }

      // sma200
      if (i >= 199) {
        const slice = closes.slice(i - 199, i + 1);
        sma200[i] = Math.round((slice.reduce((a, b) => a + b, 0) / 200) * 100) / 100;
      } else {
        sma200[i] = closes[i];
      }

      // volumeMA20
      if (i >= 19) {
        const vSlice = volumes.slice(i - 19, i + 1);
        volumeMA20[i] = Math.round(vSlice.reduce((a, b) => a + b, 0) / 20);
      } else {
        volumeMA20[i] = volumes[i];
      }
    }

    // RSI(14) with Wilder's smoothing
    const rsi14: number[] = new Array(len).fill(50);
    if (len >= 15) {
      let avgGain = 0;
      let avgLoss = 0;
      for (let i = 1; i <= 14; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff > 0) avgGain += diff;
        else avgLoss += -diff;
      }
      avgGain /= 14;
      avgLoss /= 14;
      rsi14[14] =
        avgLoss === 0
          ? 100
          : Math.round((100 - 100 / (1 + avgGain / avgLoss)) * 100) / 100;

      for (let i = 15; i < len; i++) {
        const diff = closes[i] - closes[i - 1];
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        avgGain = (avgGain * 13 + gain) / 14;
        avgLoss = (avgLoss * 13 + loss) / 14;
        rsi14[i] =
          avgLoss === 0
            ? 100
            : Math.round((100 - 100 / (1 + avgGain / avgLoss)) * 100) / 100;
      }
    }

    // EMA20
    const ema20: number[] = new Array(len);
    let prevEma = closes[0] || 0;
    const mult20 = 2 / 21;
    for (let i = 0; i < len; i++) {
      prevEma = (closes[i] - prevEma) * mult20 + prevEma;
      ema20[i] = Math.round(prevEma * 100) / 100;
    }

    // MACD (12, 26, 9) histogram
    const macdHist: number[] = new Array(len).fill(0);
    const macdLine: number[] = new Array(len).fill(0);
    const macdSignal: number[] = new Array(len).fill(0);
    if (len >= 26) {
      let ema12 = closes[0];
      const mult12 = 2 / 13;
      let ema26 = closes[0];
      const mult26 = 2 / 27;
      let sig = 0;
      const mult9 = 2 / 10;
      for (let i = 0; i < len; i++) {
        ema12 = (closes[i] - ema12) * mult12 + ema12;
        ema26 = (closes[i] - ema26) * mult26 + ema26;
        const line = ema12 - ema26;
        macdLine[i] = Math.round(line * 100) / 100;
        sig = (line - sig) * mult9 + sig;
        macdSignal[i] = Math.round(sig * 100) / 100;
        macdHist[i] = Math.round((line - sig) * 100) / 100;
      }
    }

    const adx14: number[] = new Array(len).fill(25);
    const cmf20: number[] = new Array(len).fill(0.08);

    return {
      bars: bars || [],
      sma20,
      sma50,
      sma200,
      ema20,
      bb: {
        upper: bbUpper,
        lower: bbLower,
        middle: bbMiddle,
      },
      rsi14,
      adx14,
      macd: { hist: macdHist, macd: macdLine, signal: macdSignal },
      cmf20,
      volumeMA20,
    };
  }

  static getStandardConditionPresets(...args: any[]): StandardConditionPreset[] {
    return [
      {
        id: 'rsi-oversold-30',
        label: 'RSI(14) < 30 (Oversold)',
        description:
          'RSI momentum drops below 30 into oversold territory, signaling potential bullish mean-reversion.',
        tree: {
          operator: 'AND',
          conditions: [
            {
              id: 'c-rsi-30',
              indicator: 'RSI',
              field: 'rsi',
              comparator: '<',
              thresholdType: 'VALUE',
              thresholdValue: 30,
              description: 'RSI(14) < 30',
            },
          ],
        },
      },
      {
        id: 'sma-golden-trend',
        label: 'SMA(20) > SMA(50) (Bullish Trend)',
        description:
          '20-day moving average trades above 50-day moving average, signaling an established uptrend.',
        tree: {
          operator: 'AND',
          conditions: [
            {
              id: 'c-sma-cross',
              indicator: 'SMA20',
              field: 'sma',
              comparator: '>',
              thresholdType: 'INDICATOR_FIELD',
              targetIndicator: 'SMA50',
              targetField: 'sma',
              multiplier: 1.0,
              description: 'SMA(20) > SMA(50)',
            },
          ],
        },
      },
      {
        id: 'breakout-volume',
        label: 'Price > SMA(50) + High Volume',
        description:
          'Price trades above SMA(50) supported by trading volume above 1.2x 20-day volume average.',
        tree: {
          operator: 'AND',
          conditions: [
            {
              id: 'c-price-sma50',
              indicator: 'CLOSE',
              field: 'close',
              comparator: '>',
              thresholdType: 'INDICATOR_FIELD',
              targetIndicator: 'SMA50',
              targetField: 'sma',
              multiplier: 1.0,
              description: 'Close > SMA(50)',
            },
            {
              id: 'c-vol-surge',
              indicator: 'VOLUME',
              field: 'volume',
              comparator: '>',
              thresholdType: 'INDICATOR_FIELD',
              targetIndicator: 'VOLUMESMA20',
              targetField: 'volume',
              multiplier: 1.2,
              description: 'Volume > 1.2x Volume SMA(20)',
            },
          ],
        },
      },
      {
        id: 'bb-lower-touch',
        label: 'Bollinger Lower Band Touch',
        description:
          'Close price touches or trades below the lower Bollinger Band, indicating temporary price exhaustion.',
        tree: {
          operator: 'AND',
          conditions: [
            {
              id: 'c-bb-lower',
              indicator: 'CLOSE',
              field: 'close',
              comparator: '<=',
              thresholdType: 'INDICATOR_FIELD',
              targetIndicator: 'BOLLINGER',
              targetField: 'lower',
              multiplier: 1.0,
              description: 'Close <= Bollinger Lower Band',
            },
          ],
        },
      },
    ];
  }

  static evaluateConditionTree(
    tree: any,
    indicators: PrecomputedIndicators,
    t: number
  ): boolean {
    if (!tree || !tree.conditions || tree.conditions.length === 0) {
      return true;
    }

    const op = tree.operator === 'OR' ? 'OR' : 'AND';

    const checkSingle = (cond: any): boolean => {
      if (!cond) return true;
      if (cond.conditions) {
        return SignalConditionEngine.evaluateConditionTree(cond, indicators, t);
      }

      // 1. Resolve left-hand indicator value at bar t
      let val: number | null = null;
      const indUpper = (cond.indicator || '').toUpperCase();
      if (indUpper === 'RSI') {
        val = indicators.rsi14?.[t] ?? null;
      } else if (indUpper === 'CLOSE') {
        val = indicators.bars?.[t]?.close ?? null;
      } else if (indUpper === 'VOLUME') {
        val = indicators.bars?.[t]?.volume ?? null;
      } else if (indUpper === 'SMA20') {
        val = indicators.sma20?.[t] ?? null;
      } else if (indUpper === 'SMA50') {
        val = indicators.sma50?.[t] ?? null;
      } else if (indUpper === 'SMA200') {
        val = indicators.sma200?.[t] ?? null;
      } else if (indUpper === 'EMA20') {
        val = indicators.ema20?.[t] ?? null;
      } else if (indUpper === 'MACD') {
        val = indicators.macd?.hist?.[t] ?? null;
      } else if (indUpper === 'ADX') {
        val = indicators.adx14?.[t] ?? null;
      } else if (indUpper === 'CMF') {
        val = indicators.cmf20?.[t] ?? null;
      } else if (indUpper === 'BOLLINGER') {
        val = indicators.bb?.middle?.[t] ?? null;
      } else {
        val = indicators.bars?.[t]?.close ?? null;
      }

      if (val === null || isNaN(val)) return false;

      // 2. Resolve right-hand target value
      let targetVal = 0;
      if (cond.thresholdType === 'INDICATOR_FIELD') {
        const targetIndUpper = (cond.targetIndicator || '').toUpperCase();
        let rawTarget: number | null = null;
        if (targetIndUpper === 'SMA20') {
          rawTarget = indicators.sma20?.[t] ?? null;
        } else if (targetIndUpper === 'SMA50') {
          rawTarget = indicators.sma50?.[t] ?? null;
        } else if (targetIndUpper === 'SMA200') {
          rawTarget = indicators.sma200?.[t] ?? null;
        } else if (targetIndUpper === 'VOLUMESMA20') {
          rawTarget = indicators.volumeMA20?.[t] ?? null;
        } else if (targetIndUpper === 'BOLLINGER') {
          const tf = (cond.targetField || '').toLowerCase();
          rawTarget =
            tf === 'upper'
              ? indicators.bb?.upper?.[t]
              : tf === 'lower'
              ? indicators.bb?.lower?.[t]
              : indicators.bb?.middle?.[t];
        } else {
          rawTarget = indicators.sma50?.[t] ?? null;
        }

        if (rawTarget === null || isNaN(rawTarget)) return false;
        targetVal = rawTarget * (cond.multiplier ?? 1.0);
      } else {
        targetVal = cond.thresholdValue ?? 0;
      }

      // 3. Compare
      switch (cond.comparator) {
        case '<':
          return val < targetVal;
        case '<=':
          return val <= targetVal;
        case '>':
          return val > targetVal;
        case '>=':
          return val >= targetVal;
        case '==':
          return Math.abs(val - targetVal) < 0.001;
        case '!=':
          return Math.abs(val - targetVal) >= 0.001;
        case 'CROSSES_ABOVE':
          return val > targetVal;
        case 'CROSSES_BELOW':
          return val < targetVal;
        case 'INCREASING': {
          if (t <= 0) return false;
          const prevVal = indicators.rsi14?.[t - 1] ?? 0;
          return val > prevVal;
        }
        default:
          return true;
      }
    };

    if (op === 'OR') {
      return tree.conditions.some((c: any) => checkSingle(c));
    } else {
      return tree.conditions.every((c: any) => checkSingle(c));
    }
  }
}
