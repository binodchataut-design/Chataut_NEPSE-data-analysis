import { providerRegistry } from '../providers/providerRegistry';
import { DataSourceMode } from '../types';
import { ActiveDataState, ProviderStatusInfo, CompanyMaster } from '../types/dataInfrastructure';
import { normalizedCompanies } from '../data/normalizedMasterData';
import { initializeLiveDataCaches, clearLiveDataCaches } from '../data/liveBarsCache';

type Listener = () => void;

class DataService {
  private listeners: Set<Listener> = new Set();

  public getMode(): DataSourceMode {
    return providerRegistry.getMode();
  }

  public async setMode(mode: DataSourceMode): Promise<void> {
    providerRegistry.setMode(mode);
    clearLiveDataCaches();
    try {
      await initializeLiveDataCaches();
    } catch (err) {
      console.error('[DataService] Failed to re-initialize caches after mode switch:', err);
    }
    this.notifyListeners();
  }

  public getActiveDataState(): ActiveDataState {
    return providerRegistry.getActiveDataState();
  }

  public getProviderStatusInfo(): ProviderStatusInfo {
    return providerRegistry.getProviderStatus();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('[DataService] Listener error:', err);
      }
    }
  }

  public async getCompanies(): Promise<CompanyMaster[]> {
    const provider = providerRegistry.getStockProvider();
    if (provider && typeof provider.fetchCompanies === 'function') {
      const list = await provider.fetchCompanies();
      if (list && list.length > 0) {
        return list;
      }
    }
    return normalizedCompanies;
  }
}

export const dataService = new DataService();
