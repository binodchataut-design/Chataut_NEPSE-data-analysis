import { DataSourceMode, SystemSettings } from '../types';
import { defaultSystemSettings } from '../data/mockData';
import { providerRegistry } from '../providers/providerRegistry';
import { ActiveDataState, ProviderStatusInfo } from '../types/dataInfrastructure';

class DataService {
  private currentMode: DataSourceMode = 'MOCK_DATA';
  private settings: SystemSettings = { ...defaultSystemSettings };
  private listeners: Array<() => void> = [];

  constructor() {
    // Check localStorage if available in browser
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('nepse_data_mode') as DataSourceMode | null;
      if (savedMode === 'REAL_DATA') {
        // Explicitly maintain REAL_DATA mode without silent conversion to MOCK_DATA
        this.currentMode = 'REAL_DATA';
        this.settings.dataSourceMode = 'REAL_DATA';
        providerRegistry.setMode('REAL_DATA');
      } else {
        this.currentMode = 'MOCK_DATA';
        this.settings.dataSourceMode = 'MOCK_DATA';
        providerRegistry.setMode('MOCK_DATA');
      }
      const savedWeights = localStorage.getItem('nepse_scoring_weights');
      if (savedWeights) {
        try {
          this.settings.scoringWeights = JSON.parse(savedWeights);
        } catch {
          // fallback
        }
      }
    }
  }

  public getMode(): DataSourceMode {
    return this.currentMode;
  }

  public isMockData(): boolean {
    return this.currentMode === 'MOCK_DATA';
  }

  public getActiveDataState(): ActiveDataState {
    return providerRegistry.getActiveDataState();
  }

  public getProviderStatusInfo(): ProviderStatusInfo {
    return providerRegistry.getProviderStatus();
  }

  public setMode(mode: DataSourceMode): void {
    this.currentMode = mode;
    this.settings.dataSourceMode = mode;
    providerRegistry.setMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nepse_data_mode', mode);
    }
    this.notifyListeners();
  }

  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  public updateScoringWeights(weights: SystemSettings['scoringWeights']): void {
    this.settings.scoringWeights = { ...weights };
    if (typeof window !== 'undefined') {
      localStorage.setItem('nepse_scoring_weights', JSON.stringify(weights));
    }
    this.notifyListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l());
  }

  public getProviderStatus(): {
    mode: DataSourceMode;
    label: string;
    description: string;
    lastSynced: string;
    isLiveConnected: boolean;
  } {
    if (this.currentMode === 'MOCK_DATA') {
      return {
        mode: 'MOCK_DATA',
        label: 'SAMPLE / MOCK DATA (OFFLINE PROTOTYPE)',
        description: 'Using structured NEPSE sample data for deterministic calculation testing. Not real-time exchange feed.',
        lastSynced: '2026-09-11 15:00:00 NPT',
        isLiveConnected: false,
      };
    } else {
      return {
        mode: 'REAL_DATA',
        label: 'NEPSE API ADAPTER (AWAITING GATEWAY)',
        description: 'Configured for live NEPSE data bridge. Currently awaiting upstream broker/NEPSE API token.',
        lastSynced: new Date().toLocaleTimeString(),
        isLiveConnected: false,
      };
    }
  }
}

export const dataService = new DataService();
