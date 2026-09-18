export interface OHLCVBar {
  timestamp?: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover?: number;
}
