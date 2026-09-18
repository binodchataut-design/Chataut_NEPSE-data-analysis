import {
  CompanyMaster,
  HistoricalPriceRecord,
  MarketIndexRecord,
  DailyMarketStatistics,
  ProviderStatusInfo,
  SectorMaster,
  RawFinancialStatement,
  BrokerTransactionRecord,
} from '../types/dataInfrastructure';

export interface IMarketDataProvider {
  providerName: string;
  isLive: boolean;
  getStatus(): ProviderStatusInfo;
}

export interface IStockDataProvider {
  providerName: string;
  isLive: boolean;
  getStatus(): ProviderStatusInfo;
  fetchCompanies(): Promise<CompanyMaster[]>;
  fetchPriceHistory(symbol: string, limit?: number): Promise<HistoricalPriceRecord[]>;
}

export interface IFundamentalDataProvider {
  providerName: string;
  isLive: boolean;
  getStatus(): ProviderStatusInfo;
  fetchFinancialStatements?(symbol: string): Promise<RawFinancialStatement[]>;
}

export interface IBrokerDataProvider {
  providerName: string;
  isLive: boolean;
  getStatus(): ProviderStatusInfo;
  fetchBrokerTransactions?(symbol: string): Promise<BrokerTransactionRecord[]>;
}
