export class CurrentMarketStateService {
  static getState(): any { return {}; }
  static getLatestMarketDate(): string { return '2026-01-01'; }
  static getMarketState(targetDate?: string): any {
    return {
      status: 'NORMAL',
      trend: 'BULLISH',
      primaryIndex: {
        close: 2650.4,
        changePercent: 0.85,
      },
    };
  }
}
