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
import { setupService } from './services/setupService';
import { riskService } from './services/riskService';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('CHCL');
  const [setupsCount, setSetupsCount] = useState<number>(4);
  const [riskAlertsCount, setRiskAlertsCount] = useState<number>(3);

  useEffect(() => {
    setupService.getDetectedSetups().then(s => setSetupsCount(s.length));
    riskService.getActiveRiskAlerts().then(a => setRiskAlertsCount(a.length));

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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectStock = (symbol: string) => {
    setSelectedSymbol(symbol);
    setActiveSection('stocks');
  };

  const handleNavigate = (section: string) => {
    setActiveSection(section as NavSection);
  };

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
            <DashboardView
              onSelectStock={handleSelectStock}
              onNavigate={handleNavigate}
            />
          )}

          {activeSection === 'stocks' && (
            <StockResearchView
              selectedSymbol={selectedSymbol}
              onSelectStock={handleSelectStock}
              onNavigateToWatchlist={() => setActiveSection('watchlist')}
            />
          )}

          {activeSection === 'market' && (
            <MarketView onSelectStock={handleSelectStock} />
          )}

          {activeSection === 'technical' && (
            <TechnicalAnalysisView
              onSelectStock={handleSelectStock}
              onNavigateToBacktest={() => setActiveSection('backtest')}
            />
          )}

          {activeSection === 'backtest' && <HistoricalResearchLab />}

          {activeSection === 'features' && <FeatureProbabilityLab />}

          {activeSection === 'validation' && <RobustnessDataQualityView />}

          {activeSection === 'state-engine' && (
            <CurrentStateWorkstation
              initialSymbol={selectedSymbol}
              onSelectStock={handleSelectStock}
            />
          )}

          {activeSection === 'decision-engine' && (
            <DecisionIntelligenceView
              initialSymbol={selectedSymbol}
              onSelectStock={handleSelectStock}
            />
          )}

          {activeSection === 'fundamental' && (
            <FundamentalAnalysisView onSelectStock={handleSelectStock} />
          )}

          {activeSection === 'broker' && (
            <BrokerAnalysisView onSelectStock={handleSelectStock} />
          )}

          {activeSection === 'setups' && (
            <SetupsView onSelectStock={handleSelectStock} />
          )}

          {activeSection === 'watchlist' && (
            <WatchlistView onSelectStock={handleSelectStock} />
          )}

          {activeSection === 'portfolio' && (
            <PortfolioView onSelectStock={handleSelectStock} />
          )}

          {activeSection === 'risk' && <RiskView />}

          {activeSection === 'research' && (
            <TradeJournalView onSelectStock={handleSelectStock} />
          )}

          {activeSection === 'data' && <DataArchitectureView />}

          {activeSection === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
