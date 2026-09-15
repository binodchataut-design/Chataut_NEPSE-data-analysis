import {
  IMarketDataProvider,
  IStockDataProvider,
  IFundamentalDataProvider,
  IBrokerDataProvider,
} from '../interfaces';
import {
  CompanyMaster,
  HistoricalPriceRecord,
  MarketIndexRecord,
  DailyMarketStatistics,
  BrokerMaster,
  BrokerTransactionRecord,
  RawFinancialStatement,
  ProviderStatusInfo,
  LiveDataSourceUnavailableError,
} from '../../types/dataInfrastructure';

/**
 * LiveMarketDataProvider
 * Connects to authenticated NEPSE market data gateway or authorized broker WebSocket/REST feeds.
 * Strictly throws LiveDataSourceUnavailableError when upstream gateway is disconnected or unauthenticated.
 * NEVER returns simulated or mock data.
 */
export class LiveMarketDataProvider implements IMarketDataProvider {
  public readonly providerName = 'LiveMarketDataProvider (Awaiting Upstream Gateway)';
  public readonly isLive = true;
  private isConnected = false;

  public getStatus(): ProviderStatusInfo {
    return {
      providerStatus: this.isConnected ? 'LIVE_DATA_CONNECTED' : 'LIVE_DATA_UNAVAILABLE',
      reason: this.isConnected
        ? 'Live market index feed connected.'
        : 'Upstream NEPSE index gateway connection is not configured or authenticated. Switch to MOCK data mode for simulated research.',
      timestamp: new Date().toISOString(),
      gateway: this.providerName,
      authenticated: this.isConnected,
    };
  }

  public async fetchIndices(date?: string): Promise<MarketIndexRecord[]> {
    if (!this.isConnected) {
      throw new LiveDataSourceUnavailableError(
        this.providerName,
        'Upstream NEPSE index gateway connection is not configured or authenticated.'
      );
    }
    return [];
  }

  public async fetchDailyStatistics(date?: string): Promise<DailyMarketStatistics> {
    if (!this.isConnected) {
      throw new LiveDataSourceUnavailableError(
        this.providerName,
        'Upstream NEPSE daily market statistics feed is not configured or authenticated.'
      );
    }
    throw new LiveDataSourceUnavailableError(this.providerName, 'Live daily statistics stream not initialized.');
  }
}

/**
 * LiveStockDataProvider
 * Abstraction for official NEPSE company listings and tick-level/daily price history.
 * Strictly throws LiveDataSourceUnavailableError when upstream broker bridge is disconnected.
 * NEVER returns simulated or mock data.
 */
export class LiveStockDataProvider implements IStockDataProvider {
  public readonly providerName = 'LiveStockDataProvider (Awaiting Upstream Gateway)';
  public readonly isLive = true;
  private isConnected = false;

  public getStatus(): ProviderStatusInfo {
    return {
      providerStatus: this.isConnected ? 'LIVE_DATA_CONNECTED' : 'LIVE_DATA_UNAVAILABLE',
      reason: this.isConnected
        ? 'Live stock price feed connected.'
        : 'Live company feed and price stream not connected. Upstream NEPSE broker API bridge is awaiting authentication.',
      timestamp: new Date().toISOString(),
      gateway: this.providerName,
      authenticated: this.isConnected,
    };
  }

  public async fetchCompanies(): Promise<CompanyMaster[]> {
    if (!this.isConnected) {
      throw new LiveDataSourceUnavailableError(
        this.providerName,
        'Live company feed not connected. Upstream NEPSE broker API bridge is awaiting authentication.'
      );
    }
    return [];
  }

  public async fetchPriceHistory(symbolOrId: string, limit?: number): Promise<HistoricalPriceRecord[]> {
    if (!this.isConnected) {
      throw new LiveDataSourceUnavailableError(
        this.providerName,
        `Live price history for ${symbolOrId} requires official broker bridge authentication.`
      );
    }
    return [];
  }

  public async fetchLatestPrice(symbolOrId: string): Promise<HistoricalPriceRecord | null> {
    if (!this.isConnected) {
      throw new LiveDataSourceUnavailableError(
        this.providerName,
        `Live tick stream for ${symbolOrId} not yet provisioned.`
      );
    }
    return null;
  }
}

/**
 * LiveFundamentalDataProvider
 * Abstraction for quarterly financial statement ingest (XBRL or SEBON/NEPSE disclosure portal).
 * Strictly throws LiveDataSourceUnavailableError when disclosure feed is disconnected.
 * NEVER returns simulated or mock data.
 */
export class LiveFundamentalDataProvider implements IFundamentalDataProvider {
  public readonly providerName = 'LiveFundamentalDataProvider (Awaiting Upstream Gateway)';
  public readonly isLive = true;
  private isConnected = false;

  public getStatus(): ProviderStatusInfo {
    return {
      providerStatus: this.isConnected ? 'LIVE_DATA_CONNECTED' : 'LIVE_DATA_UNAVAILABLE',
      reason: this.isConnected
        ? 'Live corporate disclosure feed connected.'
        : 'SEBON/NEPSE quarterly financial disclosure feed is not provisioned.',
      timestamp: new Date().toISOString(),
      gateway: this.providerName,
      authenticated: this.isConnected,
    };
  }

  public async fetchFinancialStatements(symbolOrId: string): Promise<RawFinancialStatement[]> {
    if (!this.isConnected) {
      throw new LiveDataSourceUnavailableError(
        this.providerName,
        `SEBON/NEPSE quarterly financial disclosure feed for ${symbolOrId} is not provisioned.`
      );
    }
    return [];
  }
}

/**
 * LiveBrokerDataProvider
 * Abstraction for live NEPSE Floor Sheet scrape or TMS broker summary feed.
 * Strictly throws LiveDataSourceUnavailableError when floor sheet feed is disconnected.
 * NEVER returns simulated or mock data.
 */
export class LiveBrokerDataProvider implements IBrokerDataProvider {
  public readonly providerName = 'LiveBrokerDataProvider (Awaiting Upstream Gateway)';
  public readonly isLive = true;
  private isConnected = false;

  public getStatus(): ProviderStatusInfo {
    return {
      providerStatus: this.isConnected ? 'LIVE_DATA_CONNECTED' : 'LIVE_DATA_UNAVAILABLE',
      reason: this.isConnected
        ? 'Live floor sheet feed connected.'
        : 'Live floor sheet transaction stream awaiting broker API adapter.',
      timestamp: new Date().toISOString(),
      gateway: this.providerName,
      authenticated: this.isConnected,
    };
  }

  public async fetchBrokers(): Promise<BrokerMaster[]> {
    if (!this.isConnected) {
      throw new LiveDataSourceUnavailableError(
        this.providerName,
        'Broker master synchronization requires active exchange session.'
      );
    }
    return [];
  }

  public async fetchBrokerTransactions(symbolOrId?: string, date?: string): Promise<BrokerTransactionRecord[]> {
    if (!this.isConnected) {
      throw new LiveDataSourceUnavailableError(
        this.providerName,
        'Live floor sheet transaction stream awaiting broker API adapter.'
      );
    }
    return [];
  }
}
