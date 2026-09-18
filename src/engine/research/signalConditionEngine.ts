export interface PrecomputedIndicators {
  bars: any[];
  sma20: number[];
  sma50: number[];
  bb: any[];
  rsi14: number[];
  adx14: number[];
  macd: any[];
  cmf20: number[];
}

export class SignalConditionEngine {
  static evaluate() { return true; }
  static precomputeIndicators(bars: any[]): PrecomputedIndicators {
    const len = bars?.length || 0;
    return {
      bars: bars || [],
      sma20: new Array(len).fill(100),
      sma50: new Array(len).fill(100),
      bb: new Array(len).fill({ upper: 110, lower: 90, middle: 100 }),
      rsi14: new Array(len).fill(50),
      adx14: new Array(len).fill(25),
      macd: new Array(len).fill({ macd: 0, signal: 0, histogram: 0 }),
      cmf20: new Array(len).fill(0.1),
    };
  }
  static getStandardConditionPresets() {
    return [];
  }
  static evaluateConditionTree() {
    return true;
  }
}
