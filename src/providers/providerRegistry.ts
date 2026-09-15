import {
  IMarketDataProvider,
  IStockDataProvider,
  IFundamentalDataProvider,
  IBrokerDataProvider,
} from './interfaces';
import { MockMarketDataProvider } from './mock/MockMarketDataProvider';
import { MockStockDataProvider } from './mock/MockStockDataProvider';
import { MockFundamentalDataProvider } from './mock/MockFundamentalDataProvider';
import { MockBrokerDataProvider } from './mock/MockBrokerDataProvider';
import {
  LiveMarketDataProvider,
  LiveStockDataProvider,
  LiveFundamentalDataProvider,
  LiveBrokerDataProvider,
} from './live/LiveProviders';
import { DataSourceMode } from '../types';
import { ActiveDataState, ProviderStatusInfo } from '../types/dataInfrastructure';

class ProviderRegistry {
  private currentMode: DataSourceMode = 'MOCK_DATA';

  // Mock Singletons
  private mockMarket = new MockMarketDataProvider();
  private mockStock = new MockStockDataProvider();
  private mockFundamental = new MockFundamentalDataProvider();
  private mockBroker = new MockBrokerDataProvider();

  // Live Singletons (disabled stubs)
  private liveMarket = new LiveMarketDataProvider();
  private liveStock = new LiveStockDataProvider();
  private liveFundamental = new LiveFundamentalDataProvider();
  private liveBroker = new LiveBrokerDataProvider();

  public setMode(mode: DataSourceMode): void {
    this.currentMode = mode;
  }

  public getMode(): DataSourceMode {
    return this.currentMode;
  }

  public isLiveMode(): boolean {
    return this.currentMode === 'REAL_DATA';
  }

  public getActiveDataState(): ActiveDataState {
    if (this.currentMode === 'MOCK_DATA') {
      return 'MOCK_DATA';
    }
    const status = this.getStockProvider().getStatus();
    return status.providerStatus;
  }

  public getProviderStatus(): ProviderStatusInfo {
    return this.getStockProvider().getStatus();
  }

  public getMarketProvider(): IMarketDataProvider {
    return this.currentMode === 'REAL_DATA' ? this.liveMarket : this.mockMarket;
  }

  public getStockProvider(): IStockDataProvider {
    return this.currentMode === 'REAL_DATA' ? this.liveStock : this.mockStock;
  }

  public getFundamentalProvider(): IFundamentalDataProvider {
    return this.currentMode === 'REAL_DATA' ? this.liveFundamental : this.mockFundamental;
  }

  public getBrokerProvider(): IBrokerDataProvider {
    return this.currentMode === 'REAL_DATA' ? this.liveBroker : this.mockBroker;
  }
}

export const providerRegistry = new ProviderRegistry();
