import { IMarketDataProvider, IStockDataProvider, IFundamentalDataProvider, IBrokerDataProvider } from '../interfaces';
import { ProviderStatusInfo, CompanyMaster, HistoricalPriceRecord } from '../../types/dataInfrastructure';
import { normalizedCompanies } from '../../data/normalizedMasterData';

export class LiveMarketDataProvider implements IMarketDataProvider {
  public readonly providerName = 'Live External Market Data Adapter (Stub)';
  public readonly isLive = true;

  public getStatus(): ProviderStatusInfo {
    return {
      providerStatus: 'LIVE_DATA_UNAVAILABLE',
      reason: 'Live external API adapter is not active or configured.',
      timestamp: new Date().toISOString(),
      gateway: this.providerName,
      authenticated: false,
    };
  }
}

export class LiveStockDataProvider implements IStockDataProvider {
  public readonly providerName = 'Live External Stock Data Adapter (Stub)';
  public readonly isLive = true;

  public getStatus(): ProviderStatusInfo {
    return {
      providerStatus: 'LIVE_DATA_UNAVAILABLE',
      reason: 'Live external API adapter is not active or configured.',
      timestamp: new Date().toISOString(),
      gateway: this.providerName,
      authenticated: false,
    };
  }

  public async fetchCompanies(): Promise<CompanyMaster[]> {
    return normalizedCompanies;
  }

  public async fetchPriceHistory(symbol: string, limit?: number): Promise<HistoricalPriceRecord[]> {
    return [];
  }
}

export class LiveFundamentalDataProvider implements IFundamentalDataProvider {
  public readonly providerName = 'Live External Fundamental Data Adapter (Stub)';
  public readonly isLive = true;

  public getStatus(): ProviderStatusInfo {
    return {
      providerStatus: 'LIVE_DATA_UNAVAILABLE',
      reason: 'Live external API adapter is not active or configured.',
      timestamp: new Date().toISOString(),
      gateway: this.providerName,
      authenticated: false,
    };
  }
}

export class LiveBrokerDataProvider implements IBrokerDataProvider {
  public readonly providerName = 'Live External Broker Data Adapter (Stub)';
  public readonly isLive = true;

  public getStatus(): ProviderStatusInfo {
    return {
      providerStatus: 'LIVE_DATA_UNAVAILABLE',
      reason: 'Live external API adapter is not active or configured.',
      timestamp: new Date().toISOString(),
      gateway: this.providerName,
      authenticated: false,
    };
  }
}
