export interface PrecomputedIndicators {
  bars: any[];
  sma20: number[];
  sma50: number[];
  bb: { upper: number[]; lower: number[]; middle: number[] } | any;
  rsi14: number[];
  adx14: number[];
  macd: { hist: number[]; macd?: number[]; signal?: number[] } | any;
  cmf20: number[];
  [key: string]: any;
}

export class SignalConditionEngine {
  static evaluate(...args: any[]): any { return true; }
  static precomputeIndicators(bars: any[], ...rest: any[]): PrecomputedIndicators {
    const len = bars?.length || 0;
    return {
      bars: bars || [],
      sma20: new Array(len).fill(100),
      sma50: new Array(len).fill(100),
      bb: {
        upper: new Array(len).fill(110),
        lower: new Array(len).fill(90),
        middle: new Array(len).fill(100),
      },
      rsi14: new Array(len).fill(50),
      adx14: new Array(len).fill(25),
      macd: { hist: new Array(len).fill(0), macd: new Array(len).fill(0), signal: new Array(len).fill(0) },
      cmf20: new Array(len).fill(0.1),
    };
  }
  static getStandardConditionPresets(...args: any[]): any[] {
    return [];
  }
  static evaluateConditionTree(...args: any[]): boolean {
    return true;
  }
}
