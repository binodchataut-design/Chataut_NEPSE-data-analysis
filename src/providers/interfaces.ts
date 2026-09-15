import {
  CompanyMaster,
  HistoricalPriceRecord,
  MarketIndexRecord,
  DailyMarketStatistics,
  BrokerMaster,
  BrokerTransactionRecord,
  RawFinancialStatement,
  ProviderStatusInfo,
} from '../types/dataInfrastructure';

export interface IMarketDataProvider {
  readonly providerName: string;
  readonly isLive: boolean;
  getStatus(): ProviderStatusInfo;
  fetchIndices(date?: string): Promise<MarketIndexRecord[]>;
  fetchDailyStatistics(date?: string): Promise<DailyMarketStatistics>;
}

export interface IStockDataProvider {
  readonly providerName: string;
  readonly isLive: boolean;
  getStatus(): ProviderStatusInfo;
  fetchCompanies(): Promise<CompanyMaster[]>;
  fetchPriceHistory(symbolOrId: string, limit?: number): Promise<HistoricalPriceRecord[]>;
  fetchLatestPrice(symbolOrId: string): Promise<HistoricalPriceRecord | null>;
}

export interface IFundamentalDataProvider {
  readonly providerName: string;
  readonly isLive: boolean;
  getStatus(): ProviderStatusInfo;
  fetchFinancialStatements(symbolOrId: string): Promise<RawFinancialStatement[]>;
}

export interface IBrokerDataProvider {
  readonly providerName: string;
  readonly isLive: boolean;
  getStatus(): ProviderStatusInfo;
  fetchBrokers(): Promise<BrokerMaster[]>;
  fetchBrokerTransactions(symbolOrId?: string, date?: string): Promise<BrokerTransactionRecord[]>;
}
