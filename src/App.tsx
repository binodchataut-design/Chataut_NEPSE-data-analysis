import { useState, useEffect } from 'react';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { StockResearchView } from './components/stocks/StockResearchView';
import { MarketView } from './components/market/MarketView';
import { TechnicalAnalysisView } from './components/technical/TechnicalAnalysisView';
import { HistoricalResearchLab } from './components/research/HistoricalResearchLab';
import { FeatureProbabilityLab } from './components/features/FeatureProbabilityLab';
import { RobustnessDataQualityView } from './components/validation/RobustnessDataQualityView';
import { CurrentStateWorkstation } from './components/state/CurrentStateWorkstation';
import { DecisionIntelligenceView } from './components/decision/DecisionIntelligenceView';
import { FundamentalAnalysisView } from './components/fundamental/FundamentalAnalysisView';
import { BrokerAnalysisView } from './components/broker/BrokerAnalysisView';
import { SetupsView } from './components/setups/SetupsView';
import { WatchlistView } from './components/watchlist/WatchlistView';
import { PortfolioView } from './components/portfolio/PortfolioView';
import { RiskView } from './components/risk/RiskView';
import { TradeJournalView } from './components/research/TradeJournalView';
import { DataArchitectureView } from './components/data/DataArchitectureView';
import { SettingsView } from './components/settings/SettingsView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { setupService } from './services/setupService';
import { riskService } from './services/riskService';
import { initializeLiveDataCaches } from './data/liveBarsCache';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('CHCL');
  const [setupsCount, setSetupsCount] = useState<number>(4);
  const [riskAlertsCount, setRiskAlertsCount] = useState<number>(3);
  const [isDataReady, setIsDataReady] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setInitError(null);
        await initializeLiveDataCaches();
        if (!isMounted) return;
        setIsDataReady(true);
        setupService.getDetectedSetups().then(s => {
          if (isMounted) setSetupsCount(s.length);
        });
        riskService.getActiveRiskAlerts().then(a => {
          if (isMounted) setRiskAlertsCount(a.length);
        });
      } catch (err: any) {
        if (!isMounted) return;
        console.error('[App] Live data caches initialization failed:', err);
        setInitError(err?.message || 'Failed to initialize live data caches.');
      }
    }

    bootstrap();

    // Global keyboard listener for search '/' shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectStock = (symbol: string) => {
    setSelectedSymbol(symbol);
    setActiveSection('stocks');
  };

  const handleNavigate = (section: string) => {
    setActiveSection(section as NavSection);
  };

  if (initError) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070a10] text-slate-200 font-mono p-6">
        <div className="max-w-md w-full bg-[#111722] border border-rose-800/60 rounded-xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-rose-400">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <h2 className="text-sm font-bold tracking-wider uppercase">Data Initialization Failure</h2>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            The NEPSE analytical live caches failed to load. The application refuses to render with empty or uncalibrated caches.
          </p>
          <div className="bg-slate-950/80 border border-slate-800 rounded p-3 text-[11px] text-rose-300 break-words font-mono">
            {initError}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold text-xs rounded transition-colors"
          >
            RETRY INITIALIZATION
          </button>
        </div>
      </div>
    );
  }

  if (!isDataReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070a10] text-slate-200 font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
          <div className="text-xs tracking-wider text-slate-400 flex items-center gap-2">
            <span>INITIALIZING LIVE DATA CACHES</span>
            <span className="inline-flex gap-0.5">
              <span className="animate-pulse">.</span>
              <span className="animate-pulse delay-100">.</span>
              <span className="animate-pulse delay-200">.</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#070a10] text-slate-200 overflow-hidden font-sans">
      {/* 1. Terminal Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        detectedSetupsCount={setupsCount}
        activeRiskAlertsCount={riskAlertsCount}
      />

      {/* 2. Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Navigation & Ticker Ribbon */}
        <Header
          onSelectStock={handleSelectStock}
          onNavigate={handleNavigate}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto bg-[#090d15] scrollbar-thin scrollbar-thumb-slate-800">
          {activeSection === 'dashboard' && (
            <ErrorBoundary viewName="DashboardView">
              <DashboardView
                onSelectStock={handleSelectStock}
                onNavigate={handleNavigate}
              />
            </ErrorBoundary>
          )}

          {activeSection === 'stocks' && (
            <ErrorBoundary viewName="StockResearchView">
              <StockResearchView
                selectedSymbol={selectedSymbol}
                onSelectStock={handleSelectStock}
                onNavigateToWatchlist={() => setActiveSection('watchlist')}
              />
            </ErrorBoundary>
          )}

          {activeSection === 'market' && (
            <ErrorBoundary viewName="MarketView">
              <MarketView onSelectStock={handleSelectStock} />
            </ErrorBoundary>
          )}

          {activeSection === 'technical' && (
            <ErrorBoundary viewName="TechnicalAnalysisView">
              <TechnicalAnalysisView
                onSelectStock={handleSelectStock}
                onNavigateToBacktest={() => setActiveSection('backtest')}
              />
            </ErrorBoundary>
          )}

          {activeSection === 'backtest' && (
            <ErrorBoundary viewName="HistoricalResearchLab">
              <HistoricalResearchLab />
            </ErrorBoundary>
          )}

          {activeSection === 'features' && (
            <ErrorBoundary viewName="FeatureProbabilityLab">
              <FeatureProbabilityLab />
            </ErrorBoundary>
          )}

          {activeSection === 'validation' && (
            <ErrorBoundary viewName="RobustnessDataQualityView">
              <RobustnessDataQualityView />
            </ErrorBoundary>
          )}

          {activeSection === 'state-engine' && (
            <ErrorBoundary viewName="CurrentStateWorkstation">
              <CurrentStateWorkstation
                initialSymbol={selectedSymbol}
                onSelectStock={handleSelectStock}
              />
            </ErrorBoundary>
          )}

          {activeSection === 'decision-engine' && (
            <ErrorBoundary viewName="DecisionIntelligenceView">
              <DecisionIntelligenceView
                initialSymbol={selectedSymbol}
                onSelectStock={handleSelectStock}
              />
            </ErrorBoundary>
          )}

          {activeSection === 'fundamental' && (
            <ErrorBoundary viewName="FundamentalAnalysisView">
              <FundamentalAnalysisView onSelectStock={handleSelectStock} />
            </ErrorBoundary>
          )}

          {activeSection === 'broker' && (
            <ErrorBoundary viewName="BrokerAnalysisView">
              <BrokerAnalysisView onSelectStock={handleSelectStock} />
            </ErrorBoundary>
          )}

          {activeSection === 'setups' && (
            <ErrorBoundary viewName="SetupsView">
              <SetupsView onSelectStock={handleSelectStock} />
            </ErrorBoundary>
          )}

          {activeSection === 'watchlist' && (
            <ErrorBoundary viewName="WatchlistView">
              <WatchlistView onSelectStock={handleSelectStock} />
            </ErrorBoundary>
          )}

          {activeSection === 'portfolio' && (
            <ErrorBoundary viewName="PortfolioView">
              <PortfolioView onSelectStock={handleSelectStock} />
            </ErrorBoundary>
          )}

          {activeSection === 'risk' && (
            <ErrorBoundary viewName="RiskView">
              <RiskView />
            </ErrorBoundary>
          )}

          {activeSection === 'research' && (
            <ErrorBoundary viewName="TradeJournalView">
              <TradeJournalView onSelectStock={handleSelectStock} />
            </ErrorBoundary>
          )}

          {activeSection === 'data' && (
            <ErrorBoundary viewName="DataArchitectureView">
              <DataArchitectureView />
            </ErrorBoundary>
          )}

          {activeSection === 'settings' && (
            <ErrorBoundary viewName="SettingsView">
              <SettingsView />
            </ErrorBoundary>
          )}
        </main>
      </div>
    </div>
  );
}
