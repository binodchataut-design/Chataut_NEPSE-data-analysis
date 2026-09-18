import { useState, useEffect } from 'react';
import { Company, TechnicalIndicators, TechnicalScoreBreakdown } from '../../types';
import { stockService } from '../../services/stockService';
import { technicalService } from '../../services/technicalService';
import {
  Activity,
  Layers,
  BookOpen,
  ShieldCheck,
  Filter,
  BarChart2,
  TrendingUp,
  Table as TableIcon,
  FlaskConical,
} from 'lucide-react';
import { IndicatorDefinition } from '../../types/technicalIndicators';
import { indicatorRegistry } from '../../engine/technical/indicatorRegistry';
import { TechnicalChartLab } from './TechnicalChartLab';
import { IndicatorLibraryBrowser } from './IndicatorLibraryBrowser';
import { IndicatorInspectorModal } from './IndicatorInspectorModal';
import { TechnicalIntegrityModal } from './TechnicalIntegrityModal';
import { DataSourceIndicator } from '../layout/DataSourceIndicator';

export function TechnicalAnalysisView({
  onSelectStock,
  onNavigateToBacktest
}: {
  onSelectStock: (symbol: string) => void;
  onNavigateToBacktest?: () => void;
}) {
  // Top-level Navigation Mode
  const [activeMode, setActiveMode] = useState<'LAB' | 'LIBRARY' | 'SCORECARD'>('LAB');
  const [selectedScrip, setSelectedScrip] = useState<string>('CHCL');

  // Modals
  const [selectedIndicatorForDoc, setSelectedIndicatorForDoc] = useState<IndicatorDefinition | null>(null);
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);

  // Active Overlays and Panel Selection in the Lab
  const [activeOverlayIds, setActiveOverlayIds] = useState<string[]>(['SMA', 'BOLLINGER']);
  const [activePanelIndicator, setActivePanelIndicator] = useState<string>('RSI');

  // Scorecard Data
  const [stocks, setStocks] = useState<Company[]>([]);
  const [scorecardData, setScorecardData] = useState<Array<{
    company: Company;
    indicators: TechnicalIndicators;
    score: TechnicalScoreBreakdown;
  }>>([]);
  const [filterCondition, setFilterCondition] = useState<string>('ALL');

  useEffect(() => {
    stockService.getAllStocks().then(async allStocks => {
      setStocks(allStocks);
      const items = await Promise.all(
        allStocks.map(async c => {
          const indicators = await technicalService.getIndicators(c.symbol);
          const score = technicalService.calculateTechnicalScore(indicators);
          return { company: c, indicators, score };
        })
      );
      setScorecardData(items);
    });
  }, []);

  const toggleOverlay = (id: string) => {
    setActiveOverlayIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectPanel = (id: string) => {
    setActivePanelIndicator(id);
    setActiveMode('LAB');
  };

  const filteredScorecard = filterCondition === 'ALL'
    ? scorecardData
    : scorecardData.filter(d => d.score.trendCondition === filterCondition);

  return (
    <div className="p-6 space-y-6 max-w-[1650px] mx-auto font-sans text-xs">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-950/80 border border-cyan-800 rounded-lg text-cyan-400">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100 tracking-wide font-mono">
              TECHNICAL INDICATOR RESEARCH LABORATORY
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
              ZERO LOOK-AHEAD ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Rigorous mathematical calculation engine across 45+ indicators, multi-timeframe resamplers, deterministic S/R, and quantitative moments.
          </p>
        </div>

        {/* Global Action & Mode Buttons */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* Mode Tabs */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-lg flex items-center gap-1">
            <button
              onClick={() => setActiveMode('LAB')}
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-colors ${
                activeMode === 'LAB'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Research Lab & Chart
            </button>
            <button
              onClick={() => setActiveMode('LIBRARY')}
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-colors ${
                activeMode === 'LIBRARY'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Indicator Directory (45+)
            </button>
            <button
              onClick={() => setActiveMode('SCORECARD')}
              className={`px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-colors ${
                activeMode === 'SCORECARD'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Multi-Factor Scorecard
            </button>
          </div>

          {/* Data Source Indicator */}
          <DataSourceIndicator variant="pill" />

          {/* Mathematical Integrity Badge Trigger */}
          <button
            onClick={() => setShowIntegrityModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-bold rounded-lg transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Integrity Audit</span>
          </button>

          {onNavigateToBacktest && (
            <button
              onClick={onNavigateToBacktest}
              className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-bold rounded-lg transition-colors"
            >
              <FlaskConical className="w-4 h-4 text-cyan-400" />
              <span>Backtest Lab</span>
            </button>
          )}
        </div>
      </div>

      <DataSourceIndicator variant="banner" />

      {/* MODE 1: RESEARCH LAB & CHART */}
      {activeMode === 'LAB' && (
        <TechnicalChartLab
          symbol={selectedScrip}
          onSelectStock={setSelectedScrip}
          onOpenIntegrityModal={() => setShowIntegrityModal(true)}
        />
      )}

      {/* MODE 2: INDICATOR DIRECTORY & LIBRARY */}
      {activeMode === 'LIBRARY' && (
        <IndicatorLibraryBrowser
          onSelectIndicatorForDoc={setSelectedIndicatorForDoc}
          activeOverlayIds={activeOverlayIds}
          onToggleOverlay={toggleOverlay}
          activePanelIndicator={activePanelIndicator}
          onSelectPanelIndicator={handleSelectPanel}
        />
      )}

      {/* MODE 3: MULTI-FACTOR SCORECARD (PRESERVED) */}
      {activeMode === 'SCORECARD' && (
        <div className="space-y-4 font-mono text-xs">
          {/* Filter Tabs */}
          <div className="bg-[#111722] border border-slate-800 rounded-xl p-3 flex items-center gap-2 overflow-x-auto">
            <span className="text-slate-400 text-[11px] uppercase mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> Trend State:
            </span>
            {['ALL', 'STRONG_UPTREND', 'UPTREND', 'CONSOLIDATION', 'DOWNTREND'].map(state => (
              <button
                key={state}
                onClick={() => setFilterCondition(state)}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterCondition === state
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {state.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Technical Scorecard Table */}
          <div className="bg-[#111722] border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase bg-slate-900/50">
                    <th className="py-3 px-4">Scrip</th>
                    <th className="py-3 px-3 text-right">LTP (NPR)</th>
                    <th className="py-3 px-3 text-center">Tech Score (100)</th>
                    <th className="py-3 px-3 text-center">Trend (20)</th>
                    <th className="py-3 px-3 text-center">Momentum (20)</th>
                    <th className="py-3 px-3 text-center">Volume (20)</th>
                    <th className="py-3 px-3 text-center">Structure (20)</th>
                    <th className="py-3 px-3 text-center">Volatility (20)</th>
                    <th className="py-3 px-3">RSI (14)</th>
                    <th className="py-3 px-3">MACD Hist</th>
                    <th className="py-3 px-3 text-center">Trend Status</th>
                    <th className="py-3 px-3 text-right">Research Lab</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredScorecard.map(({ company, indicators, score }) => (
                    <tr key={company.symbol} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedScrip(company.symbol);
                            setActiveMode('LAB');
                          }}
                          className="font-bold text-cyan-400 hover:underline text-sm block"
                        >
                          {company.symbol}
                        </button>
                        <span className="text-[10px] text-slate-400">{company.sectorName}</span>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-100">
                        Rs. {company.ltp.toFixed(1)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2.5 py-1 rounded font-bold text-xs bg-cyan-950 border border-cyan-800 text-cyan-300">
                          {score.totalScore}/100
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center text-slate-200 font-semibold">{score.trendScore}/20</td>
                      <td className="py-3 px-3 text-center text-slate-200 font-semibold">{score.momentumScore}/20</td>
                      <td className="py-3 px-3 text-center text-slate-200 font-semibold">{score.volumeScore}/20</td>
                      <td className="py-3 px-3 text-center text-slate-200 font-semibold">{score.structureScore}/20</td>
                      <td className="py-3 px-3 text-center text-slate-200 font-semibold">{score.volatilityScore}/20</td>

                      <td className="py-3 px-3">
                        <span className={`font-semibold ${indicators.rsi14 >= 60 ? 'text-emerald-400' : indicators.rsi14 <= 40 ? 'text-rose-400' : 'text-slate-300'}`}>
                          {indicators.rsi14}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`font-semibold ${indicators.macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {indicators.macd.histogram >= 0 ? '+' : ''}{indicators.macd.histogram}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-300">
                          {score.trendCondition.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedScrip(company.symbol);
                            setActiveMode('LAB');
                          }}
                          className="px-2.5 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/40 text-cyan-300 hover:text-white text-[11px] transition-colors"
                        >
                          Open in Lab
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inspector Modal */}
      {selectedIndicatorForDoc && (
        <IndicatorInspectorModal
          indicator={selectedIndicatorForDoc}
          onClose={() => setSelectedIndicatorForDoc(null)}
        />
      )}

      {/* Mathematical Integrity Modal */}
      {showIntegrityModal && (
        <TechnicalIntegrityModal onClose={() => setShowIntegrityModal(false)} />
      )}
    </div>
  );
}
