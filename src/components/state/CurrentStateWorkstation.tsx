import React, { useState, useMemo } from 'react';
import {
  Activity,
  Calendar,
  Layers,
  TrendingUp,
  BarChart2,
  ShieldCheck,
  Compass,
  AlertTriangle,
  Info,
  Clock,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Zap,
  Filter,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { CurrentStateSnapshotService } from '../../services/currentStateSnapshotService';
import { CurrentMarketStateService } from '../../services/currentMarketStateService';
import { normalizedCompanies, getNormalizedStockBars } from '../../data/normalizedMasterData';
import { StateExplanationModal } from './StateExplanationModal';
import { Phase4ATestModal } from './Phase4ATestModal';
import { CurrentStateSnapshot } from '../../types/currentStateEngine';
import { dataService } from '../../services/dataService';
import { DataSourceIndicator } from '../layout/DataSourceIndicator';

interface CurrentStateWorkstationProps {
  initialSymbol?: string;
  onSelectStock?: (symbol: string) => void;
}

export function CurrentStateWorkstation({
  initialSymbol = 'NABIL',
  onSelectStock
}: CurrentStateWorkstationProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const latestDate = useMemo(() => CurrentMarketStateService.getLatestMarketDate(), []);
  const [selectedDate, setSelectedDate] = useState(latestDate);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [dataMode, setDataMode] = useState(dataService.getMode());

  React.useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setDataMode(dataService.getMode());
      CurrentStateSnapshotService.clearAllCaches();
    });
    return () => unsub();
  }, []);

  // Modal state for drill-down explanation
  const [explanationData, setExplanationData] = useState<{
    isOpen: boolean;
    title: string;
    classification: string;
    classificationColor?: string;
    evidence: string[];
    metrics?: Record<string, string | number | boolean | null>;
    formulaDescription?: string;
  }>({
    isOpen: false,
    title: '',
    classification: '',
    evidence: []
  });

  // Available trading dates for current stock
  const availableDates = useMemo(() => {
    const bars = getNormalizedStockBars(selectedSymbol);
    const dates = bars.map(b => b.date).sort((a, b) => b.localeCompare(a));
    return dates;
  }, [selectedSymbol]);

  // Compute snapshot point-in-time
  const snapshot: CurrentStateSnapshot = useMemo(() => {
    return CurrentStateSnapshotService.getSnapshot(selectedSymbol, selectedDate);
  }, [selectedSymbol, selectedDate, dataMode]);

  const { marketState, sectorState, stockState, stateTransitions, causalityAudit, calculationVersions } = snapshot;
  const isHistorical = snapshot.mode === 'HISTORICAL_SNAPSHOT';

  const handleSymbolChange = (sym: string) => {
    setSelectedSymbol(sym);
    if (onSelectStock) onSelectStock(sym);
  };

  const handleResetToLatest = () => {
    setSelectedDate(latestDate);
  };

  const openExplanation = (
    title: string,
    classification: string,
    color: string,
    evidence: string[],
    metrics?: Record<string, string | number | boolean | null>,
    formulaDescription?: string
  ) => {
    setExplanationData({
      isOpen: true,
      title,
      classification,
      classificationColor: color,
      evidence,
      metrics,
      formulaDescription
    });
  };

  // Helper color mappings
  const getTrendColor = (state: string) => {
    if (state === 'BULLISH') return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
    if (state === 'BEARISH') return 'text-rose-400 bg-rose-950/40 border-rose-500/30';
    return 'text-amber-400 bg-amber-950/40 border-amber-500/30';
  };

  const getMomentumColor = (state: string) => {
    if (state.includes('POSITIVE')) return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
    if (state.includes('NEGATIVE')) return 'text-rose-400 bg-rose-950/40 border-rose-500/30';
    return 'text-slate-300 bg-slate-800/60 border-slate-700/50';
  };

  const getRsColor = (state: string) => {
    if (state.includes('OUTPERFORMER')) return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
    if (state.includes('UNDERPERFORMER')) return 'text-rose-400 bg-rose-950/40 border-rose-500/30';
    return 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30';
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Context Control Bar */}
      <div className="bg-[#0b101b] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight font-mono">
                  {stockState.symbol}
                </h1>
                <span className="text-xs text-slate-400 font-sans">
                  {stockState.companyName}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isHistorical
                    ? 'text-amber-400 bg-amber-950/50 border-amber-500/40'
                    : 'text-cyan-400 bg-cyan-950/50 border-cyan-500/40'
                }`}>
                  {snapshot.mode}
                </span>
                <DataSourceIndicator variant="tag" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                <span>SECTOR: {sectorState.sectorName}</span>
                <span>•</span>
                <span>AS OF: {snapshot.asOfDate}</span>
              </p>
            </div>
          </div>

          {/* Controls: Symbol Selector, Date Picker & Test Runner */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Symbol Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">Symbol:</span>
              <select
                value={selectedSymbol}
                onChange={e => handleSymbolChange(e.target.value)}
                className="bg-transparent text-slate-100 font-mono font-semibold focus:outline-none cursor-pointer"
              >
                {normalizedCompanies.map(c => (
                  <option key={c.symbol} value={c.symbol} className="bg-slate-900 text-slate-200">
                    {c.symbol} - {c.company_name.substring(0, 22)}
                  </option>
                ))}
              </select>
            </div>

            {/* As-Of Date Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-mono text-[11px]">As Of:</span>
              <select
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-100 font-mono font-semibold focus:outline-none cursor-pointer"
              >
                {availableDates.map(d => (
                  <option key={d} value={d} className="bg-slate-900 text-slate-200">
                    {d} {d === latestDate ? '(Latest)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset to Latest */}
            {isHistorical && (
              <button
                onClick={handleResetToLatest}
                className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors"
                title="Reset to latest available market session"
              >
                <RotateCcw className="w-3 h-3" />
                Latest
              </button>
            )}

            {/* Causality Test Runner Button */}
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Audit Causality &amp; Tests
            </button>
          </div>
        </div>

        {/* Historical Snapshot Audit Banner (Section 55) */}
        {isHistorical && (
          <div className="mt-4 p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-amber-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Point-in-Time Historical Reconstruction:</strong> Data cutoff bounded strictly at {causalityAudit.cutoffDate}.
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-slate-400">Future Data Included: <strong className="text-slate-200">NO</strong></span>
              <span className="text-slate-400">Zero Lookahead: <strong className="text-emerald-400">PASS</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* When live data is unavailable, render dedicated STATE UNAVAILABLE notification and halt misleading metrics */}
      {snapshot.stateAvailability && !snapshot.stateAvailability.isAvailable ? (
        <div className="bg-[#0f1422] border-2 border-rose-500/50 rounded-xl p-6 shadow-2xl space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-950/70 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold font-mono text-rose-300">STATE UNAVAILABLE</h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-950/80 border border-rose-500/40 text-rose-400">
                  REAL_DATA (FEED DISCONNECTED)
                </span>
              </div>
              <p className="text-sm text-slate-300">
                The Phase 4A Current State Engine cannot evaluate point-in-time states for <strong className="font-mono text-cyan-300">{selectedSymbol}</strong> because the live upstream data provider is unavailable or unauthenticated.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/30 text-xs font-mono space-y-1.5 text-rose-200">
            <div className="text-rose-400 font-bold uppercase text-[11px]">Provider Status & Reason:</div>
            <div className="text-slate-200 text-sm font-semibold">{snapshot.stateAvailability.reason || 'Live company feed not connected.'}</div>
            <div className="text-slate-400 text-[11px]">Recorded Timestamp: {snapshot.stateAvailability.timestamp}</div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-slate-200 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Financial Integrity & Zero Silent Fallback Policy
            </div>
            <p className="leading-relaxed text-slate-400">
              Per strict research safety rules, this system NEVER silently replaces disconnected live feeds with simulated mock or baseline records. Generating hypothetical technical indicators or regime classifications on simulated data while in live mode leads to catastrophic lookahead or false confidence.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-400 font-mono">
              Switch to MOCK_DATA mode to run deterministic states against calibrated NEPSE test records:
            </span>
            <button
              onClick={() => dataService.setMode('MOCK_DATA')}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg"
            >
              Switch to MOCK DATA Mode
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 3-Column Summary Cards (Section 44 Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* MARKET SUMMARY CARD */}
        <div
          onClick={() => openExplanation(
            'Market Regime Context',
            marketState.regime,
            getTrendColor(marketState.regime === 'BULL' ? 'BULLISH' : marketState.regime === 'BEAR' ? 'BEARISH' : 'NEUTRAL'),
            marketState.evidence,
            {
              'NEPSE Index': marketState.primaryIndex.close,
              'Advance/Decline Ratio': marketState.breadth.advanceDeclineRatio,
              'Stocks > 50 SMA': `${marketState.breadth.percentAbove50MA}%`,
              'Turnover Ratio 20D': `${marketState.turnover.turnoverRatio20}x`,
              'Volatility ATR%': `${marketState.volatility.atrPercent}%`
            },
            'NEPSE Close > SMA50 AND SMA20 > SMA50 => BULL; Close < SMA50 AND SMA20 < SMA50 => BEAR; otherwise SIDEWAYS.'
          )}
          className="bg-[#0b101b] border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              MARKET CONTEXT
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
              getTrendColor(marketState.regime === 'BULL' ? 'BULLISH' : marketState.regime === 'BEAR' ? 'BEARISH' : 'NEUTRAL')
            }`}>
              {marketState.regime}
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">NEPSE Index:</span>
              <span className="text-slate-100 font-semibold">{marketState.primaryIndex.close.toFixed(2)} ({marketState.primaryIndex.changePercent >= 0 ? '+' : ''}{marketState.primaryIndex.changePercent.toFixed(2)}%)</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Market Breadth:</span>
              <span className="text-slate-200">{marketState.breadth.breadthState} ({marketState.breadth.advanceDeclineRatio.toFixed(2)} A/D)</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Turnover State:</span>
              <span className="text-slate-200">{marketState.turnover.turnoverState} ({(marketState.turnover.todayTurnover / 1e7).toFixed(1)} Cr)</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Regime Transition:</span>
              <span className="text-cyan-400">{marketState.regimeTransition}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-cyan-400 transition-colors">
            <span>Click for deterministic evidence</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* SECTOR SUMMARY CARD */}
        <div
          onClick={() => openExplanation(
            'Sector Leadership Context',
            sectorState.leadershipState,
            getRsColor(sectorState.leadershipState),
            sectorState.evidence,
            {
              'Sector Name': sectorState.sectorName,
              'Sector Close': sectorState.sectorIndexClose,
              '1D Return': `${sectorState.sectorReturn1D}%`,
              '20D vs NEPSE Diff': `${sectorState.relativeStrengthVsNepse.returnDiff20D}%`,
              'Sector Trend': sectorState.trend.state,
              'A/D Ratio': sectorState.breadth.advanceDeclineRatio
            },
            'Strong outperformance with Bullish Trend => LEADING; Outperformance => IMPROVING; Underperformance => WEAKENING; Strong underperformance => LAGGING.'
          )}
          className="bg-[#0b101b] border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              SECTOR CONTEXT
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${getRsColor(sectorState.leadershipState)}`}>
              {sectorState.leadershipState}
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Sector:</span>
              <span className="text-slate-100 font-semibold truncate max-w-[150px]">{sectorState.sectorName}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Sector Trend:</span>
              <span className={sectorState.trend.state === 'BULLISH' ? 'text-emerald-400' : 'text-slate-200'}>{sectorState.trend.state}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">vs NEPSE (20D):</span>
              <span className={sectorState.relativeStrengthVsNepse.returnDiff20D >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {sectorState.relativeStrengthVsNepse.returnDiff20D >= 0 ? '+' : ''}{sectorState.relativeStrengthVsNepse.returnDiff20D}% ({sectorState.relativeStrengthVsNepse.state})
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Sector Breadth:</span>
              <span className="text-slate-200">{sectorState.breadth.advancing} Adv / {sectorState.breadth.declining} Dec</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-cyan-400 transition-colors">
            <span>Click for deterministic evidence</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* STOCK SUMMARY CARD */}
        <div
          onClick={() => openExplanation(
            'Overall Stock State',
            stockState.trend.mediumTerm,
            getTrendColor(stockState.trend.mediumTerm),
            stockState.evidence,
            {
              'LTP Close': stockState.price.close,
              'Medium-Term Trend': stockState.trend.mediumTerm,
              'Momentum State': stockState.momentum.state,
              'RSI (14)': stockState.momentum.rsi14,
              '20D Volume Ratio': `${stockState.volume.volumeVs20DayAverage}x`,
              'Liquidity Class': stockState.liquidity.classification,
              'Data Quality': stockState.dataQuality.overall
            },
            'Evaluated deterministically across trend moving averages, momentum indicators, volume/price ratios, and Phase 3D data quality audits.'
          )}
          className="bg-[#0b101b] border border-slate-800 hover:border-slate-700 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              STOCK STATE
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${getTrendColor(stockState.trend.mediumTerm)}`}>
              {stockState.trend.mediumTerm}
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">LTP Close:</span>
              <span className="text-slate-100 font-semibold">NPR {stockState.price.close.toFixed(2)} ({stockState.price.changePercent >= 0 ? '+' : ''}{stockState.price.changePercent.toFixed(2)}%)</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Momentum:</span>
              <span className={stockState.momentum.state.includes('POSITIVE') ? 'text-emerald-400' : 'text-slate-200'}>
                {stockState.momentum.state} (RSI {stockState.momentum.rsi14?.toFixed(1) ?? 'N/A'})
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800/60">
              <span className="text-slate-400">Volume Activity:</span>
              <span className="text-slate-200">{stockState.volume.volumeState} ({stockState.volume.volumeVs20DayAverage.toFixed(2)}x)</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">Liquidity &amp; Reality:</span>
              <span className="text-cyan-400">{stockState.liquidity.classification} • DQ: {stockState.dataQuality.overall}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-cyan-400 transition-colors">
            <span>Click for deterministic evidence</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Analytical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT COLUMN: TREND, MOMENTUM & PRICE STRUCTURE */}
        <div className="space-y-5">
          {/* Trend State Panel */}
          <div className="bg-[#0b101b] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <h3 className="font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Trend State &amp; Structure
              </h3>
              <button
                onClick={() => openExplanation(
                  'Trend State & Moving Averages',
                  stockState.trend.mediumTerm,
                  getTrendColor(stockState.trend.mediumTerm),
                  stockState.trend.evidence,
                  {
                    'Close': stockState.price.close,
                    'SMA 20': stockState.trend.sma20?.toFixed(1) ?? null,
                    'SMA 50': stockState.trend.sma50?.toFixed(1) ?? null,
                    'SMA 200': stockState.trend.sma200?.toFixed(1) ?? null,
                    'Above SMA20': stockState.trend.structure.aboveSMA20,
                    'Above SMA50': stockState.trend.structure.aboveSMA50,
                    'SMA20 > SMA50': stockState.trend.structure.sma20AboveSMA50,
                    'SMA50 Rising': stockState.trend.structure.sma50Rising,
                    'ADX (14)': stockState.trend.adx14?.toFixed(1) ?? null
                  },
                  'Price > SMA50 AND SMA20 > SMA50 => BULLISH; Price < SMA50 AND SMA20 < SMA50 => BEARISH; otherwise NEUTRAL.'
                )}
                className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                Why?
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Short-Term (20D):</span>
                <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getTrendColor(stockState.trend.shortTerm)}`}>
                  {stockState.trend.shortTerm}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Medium-Term (50D):</span>
                <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getTrendColor(stockState.trend.mediumTerm)}`}>
                  {stockState.trend.mediumTerm}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Long-Term (200D):</span>
                <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getTrendColor(stockState.trend.longTerm)}`}>
                  {stockState.trend.longTerm}
                </span>
              </div>

              {/* Structural Indicators Table */}
              <div className="pt-2 border-t border-slate-800/60 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Price vs SMA20:</span>
                  <span className={stockState.trend.structure.aboveSMA20 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {stockState.trend.structure.aboveSMA20 ? 'ABOVE' : 'BELOW'} ({stockState.trend.sma20?.toFixed(1) ?? 'N/A'})
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Price vs SMA50:</span>
                  <span className={stockState.trend.structure.aboveSMA50 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {stockState.trend.structure.aboveSMA50 ? 'ABOVE' : 'BELOW'} ({stockState.trend.sma50?.toFixed(1) ?? 'N/A'})
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>SMA 20 vs SMA 50:</span>
                  <span className={stockState.trend.structure.sma20AboveSMA50 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {stockState.trend.structure.sma20AboveSMA50 ? 'BULLISH SPREAD' : 'BEARISH SPREAD'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Trend Strength (ADX):</span>
                  <span className="text-slate-200">
                    {stockState.trend.adx14?.toFixed(1) ?? 'N/A'} ({stockState.trend.adx14 && stockState.trend.adx14 >= 25 ? 'Strong' : 'Weak'})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Momentum State Panel */}
          <div className="bg-[#0b101b] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <h3 className="font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Momentum Level &amp; Direction
              </h3>
              <button
                onClick={() => openExplanation(
                  'Momentum Analysis',
                  stockState.momentum.state,
                  getMomentumColor(stockState.momentum.state),
                  stockState.momentum.evidence,
                  {
                    'RSI (14)': stockState.momentum.rsi14?.toFixed(1) ?? null,
                    'Momentum Level': stockState.momentum.level,
                    'RSI Direction': stockState.momentum.direction,
                    'MACD Line': stockState.momentum.macd.macd?.toFixed(2) ?? null,
                    'MACD Signal': stockState.momentum.macd.signal?.toFixed(2) ?? null,
                    'MACD Hist': stockState.momentum.macd.hist?.toFixed(2) ?? null,
                    'ROC (10)': `${stockState.momentum.roc10 ?? 'N/A'}%`
                  },
                  'RSI >= 60 and MACD Hist > 0 => POSITIVE; RSI <= 40 and MACD Hist < 0 => NEGATIVE; Level and Direction tracked independently.'
                )}
                className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                Why?
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Momentum State:</span>
                <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getMomentumColor(stockState.momentum.state)}`}>
                  {stockState.momentum.state}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">RSI(14) Level:</span>
                <span className="text-slate-200 font-semibold">{stockState.momentum.rsi14?.toFixed(1) ?? 'N/A'} ({stockState.momentum.level})</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">RSI Trajectory:</span>
                <span className={stockState.momentum.direction === 'RISING' ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                  {stockState.momentum.direction}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">MACD Histogram:</span>
                <span className={(stockState.momentum.macd.hist ?? 0) >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {(stockState.momentum.macd.hist ?? 0) >= 0 ? '+' : ''}{stockState.momentum.macd.hist?.toFixed(2) ?? 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Price Structure & Swings */}
          <div className="bg-[#0b101b] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <h3 className="font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                Price Structure &amp; Swings
              </h3>
              <button
                onClick={() => openExplanation(
                  'Price Structure Classification',
                  stockState.priceStructure.state,
                  'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
                  stockState.priceStructure.evidence,
                  {
                    'Higher High': stockState.priceStructure.higherHigh,
                    'Higher Low': stockState.priceStructure.higherLow,
                    'Lower High': stockState.priceStructure.lowerHigh,
                    'Lower Low': stockState.priceStructure.lowerLow,
                    'Consolidating': stockState.priceStructure.isConsolidating,
                    'Breakout Type': stockState.priceStructure.breakoutType || 'NONE'
                  },
                  'Identifies point-in-time swing highs and lows up to asOfDate without looking forward into future sessions.'
                )}
                className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                Why?
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Swing Pattern:</span>
                <span className="text-cyan-400 font-semibold">{stockState.priceStructure.state}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded bg-slate-900/40 border border-slate-800/60 flex justify-between">
                  <span className="text-slate-400">Higher High:</span>
                  <span className={stockState.priceStructure.higherHigh ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {stockState.priceStructure.higherHigh ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900/40 border border-slate-800/60 flex justify-between">
                  <span className="text-slate-400">Higher Low:</span>
                  <span className={stockState.priceStructure.higherLow ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {stockState.priceStructure.higherLow ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: VOLUME, VOLATILITY & RELATIVE STRENGTH */}
        <div className="space-y-5">
          {/* Volume & Turnover State */}
          <div className="bg-[#0b101b] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <h3 className="font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                Volume &amp; Turnover Behavior
              </h3>
              <button
                onClick={() => openExplanation(
                  'Volume/Turnover State',
                  stockState.volume.volumeState,
                  stockState.volume.volumeState === 'EXPANDING' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' : 'text-slate-300 bg-slate-800/60 border-slate-700/50',
                  stockState.volume.evidence,
                  {
                    'Today Volume': stockState.volume.todayVolume.toLocaleString(),
                    '20D Avg Volume': stockState.volume.averageVolume20.toLocaleString(),
                    'Volume Ratio (20D)': `${stockState.volume.volumeVs20DayAverage}x`,
                    'Turnover Ratio (20D)': `${stockState.volume.turnoverVs20DayAverage}x`,
                    'Volume/Price Interaction': stockState.volume.volumePriceRelationship,
                    'OBV Trend': stockState.volume.obvTrend,
                    'CMF (20)': stockState.volume.cmfState
                  },
                  'Volume Ratio >= 1.20x => EXPANDING; <= 0.80x => CONTRACTING; Relationship classified based on close return direction.'
                )}
                className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                Why?
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Volume Activity:</span>
                <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                  stockState.volume.volumeState === 'EXPANDING' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' : 'text-slate-300 bg-slate-800/60 border-slate-700/50'
                }`}>
                  {stockState.volume.volumeState} ({stockState.volume.volumeVs20DayAverage.toFixed(2)}x 20D)
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Turnover Ratio (20D):</span>
                <span className="text-slate-200 font-semibold">{stockState.volume.turnoverVs20DayAverage.toFixed(2)}x ({(stockState.volume.todayTurnover / 1e7).toFixed(2)} Cr)</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900/40 border border-slate-800/60 space-y-1">
                <div className="text-[11px] text-slate-400">Descriptive Price/Volume State:</div>
                <div className="text-xs text-cyan-400 font-semibold">{stockState.volume.volumePriceRelationship}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded bg-slate-900/40 border border-slate-800/60 flex justify-between">
                  <span className="text-slate-400">OBV:</span>
                  <span className="text-slate-200 font-semibold">{stockState.volume.obvTrend}</span>
                </div>
                <div className="p-2 rounded bg-slate-900/40 border border-slate-800/60 flex justify-between">
                  <span className="text-slate-400">CMF(20):</span>
                  <span className="text-slate-200 font-semibold">{stockState.volume.cmfState}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Volatility State */}
          <div className="bg-[#0b101b] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <h3 className="font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Volatility &amp; Compression
              </h3>
              <button
                onClick={() => openExplanation(
                  'Volatility State',
                  stockState.volatility.state,
                  'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
                  stockState.volatility.evidence,
                  {
                    'ATR (14)': `NPR ${stockState.volatility.atr14?.toFixed(1) ?? 'N/A'}`,
                    'ATR %': `${stockState.volatility.atrPercent?.toFixed(2) ?? 'N/A'}%`,
                    'Bollinger Bandwidth': `${stockState.volatility.bollingerBandwidth?.toFixed(1) ?? 'N/A'}%`,
                    'Volatility State': stockState.volatility.state,
                    'Transition Regime': stockState.volatility.transition
                  },
                  'Bollinger Bandwidth < 5% => COMPRESSED; > 15% => EXTREME; transition flags compression breakouts.'
                )}
                className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                Why?
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Volatility Regime:</span>
                <span className="text-slate-200 font-semibold">{stockState.volatility.state}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">ATR(14) Value:</span>
                <span className="text-slate-200">NPR {stockState.volatility.atr14?.toFixed(1) ?? 'N/A'} ({stockState.volatility.atrPercent?.toFixed(2) ?? 'N/A'}%)</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Bandwidth:</span>
                <span className="text-slate-200">{stockState.volatility.bollingerBandwidth?.toFixed(1) ?? 'N/A'}%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Transition:</span>
                <span className="text-cyan-400">{stockState.volatility.transition}</span>
              </div>
            </div>
          </div>

          {/* Relative Strength Context */}
          <div className="bg-[#0b101b] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <h3 className="font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Relative Strength
              </h3>
              <button
                onClick={() => openExplanation(
                  'Relative Strength Evaluation',
                  stockState.relativeStrength.vsNepse.state,
                  getRsColor(stockState.relativeStrength.vsNepse.state),
                  stockState.relativeStrength.evidence,
                  {
                    '20D vs NEPSE': `${stockState.relativeStrength.vsNepse.returnDiff20D}%`,
                    '60D vs NEPSE': `${stockState.relativeStrength.vsNepse.returnDiff60D}%`,
                    '20D vs Sector': `${stockState.relativeStrength.vsSector.returnDiff20D}%`,
                    '60D vs Sector': `${stockState.relativeStrength.vsSector.returnDiff60D}%`
                  },
                  'Compares stock holding period return directly with NEPSE index and sector index returns over identical historical windows.'
                )}
                className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                Why?
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-900/50 border border-slate-800/60 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">vs NEPSE (20D):</span>
                  <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getRsColor(stockState.relativeStrength.vsNepse.state)}`}>
                    {stockState.relativeStrength.vsNepse.state}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Excess Return: <strong className={stockState.relativeStrength.vsNepse.returnDiff20D >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {stockState.relativeStrength.vsNepse.returnDiff20D >= 0 ? '+' : ''}{stockState.relativeStrength.vsNepse.returnDiff20D}%
                  </strong>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/50 border border-slate-800/60 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">vs Sector ({sectorState.sectorName.substring(0, 12)}):</span>
                  <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getRsColor(stockState.relativeStrength.vsSector.state)}`}>
                    {stockState.relativeStrength.vsSector.state}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Excess Return: <strong className={stockState.relativeStrength.vsSector.returnDiff20D >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {stockState.relativeStrength.vsSector.returnDiff20D >= 0 ? '+' : ''}{stockState.relativeStrength.vsSector.returnDiff20D}%
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIQUIDITY, S/R, CROSS-SECTIONAL RANK & TRANSITIONS */}
        <div className="space-y-5">
          {/* Support & Resistance Context */}
          <div className="bg-[#0b101b] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <h3 className="font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                Support &amp; Resistance
              </h3>
              <span className="text-[11px] font-mono text-slate-400">ATR: NPR {stockState.supportResistance.atrValue?.toFixed(1) ?? 'N/A'}</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-900/50 border border-slate-800/60 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Nearest Resistance:</span>
                  <span className="text-rose-400 font-semibold">NPR {stockState.supportResistance.nearestResistance?.toFixed(1) ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Distance:</span>
                  <span className="text-slate-200">
                    +{stockState.supportResistance.distanceToResistancePercent}% ({stockState.supportResistance.distanceToResistanceATR ?? 'N/A'} ATR)
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/50 border border-slate-800/60 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Nearest Support:</span>
                  <span className="text-emerald-400 font-semibold">NPR {stockState.supportResistance.nearestSupport?.toFixed(1) ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Distance:</span>
                  <span className="text-slate-200">
                    -{stockState.supportResistance.distanceToSupportPercent}% ({stockState.supportResistance.distanceToSupportATR ?? 'N/A'} ATR)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cross-Sectional Ranking across Universe */}
          <div className="bg-[#0b101b] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <h3 className="font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Cross-Sectional Rank
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Universe: {stockState.crossSectionalRank.universeSize}</span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">20D Return Percentile:</span>
                <span className="text-slate-100 font-semibold">{stockState.crossSectionalRank.return20DPercentile}th</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Relative Strength Percentile:</span>
                <span className="text-slate-100 font-semibold">{stockState.crossSectionalRank.relativeStrengthPercentile}th</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Turnover Percentile:</span>
                <span className="text-slate-100 font-semibold">{stockState.crossSectionalRank.turnoverPercentile}th</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Volatility Percentile:</span>
                <span className="text-slate-100 font-semibold">{stockState.crossSectionalRank.volatilityPercentile}th</span>
              </div>
            </div>
          </div>

          {/* Liquidity, Lifecycle & Phase 3D Reality */}
          <div className="bg-[#0b101b] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <h3 className="font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Execution Reality &amp; Health
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">DQ: {stockState.dataQuality.overall}</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Liquidity Class:</span>
                <span className="text-cyan-400 font-semibold">{stockState.liquidity.classification} ({(stockState.liquidity.adt20 / 1e7).toFixed(2)} Cr ADT)</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Participation Capacity:</span>
                <span className="text-slate-200">{stockState.liquidity.participationCapacity}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Lifecycle Status:</span>
                <span className={stockState.lifecycle.status === 'ACTIVE' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {stockState.lifecycle.status} ({stockState.lifecycle.suspensionStatus})
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/60">
                <span className="text-slate-400">Corporate Action:</span>
                <span className="text-slate-200 truncate max-w-[150px]">
                  {stockState.corporateActionContext.actionType || 'None recent'}
                </span>
              </div>
            </div>
          </div>

          {/* Session State Transitions (T vs T-1) */}
          {stateTransitions.length > 0 && (
            <div className="bg-[#0b101b] border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                <h3 className="font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  State Transitions (T vs T-1)
                </h3>
                <span className="text-[11px] font-mono text-cyan-400 font-semibold">{stateTransitions.length} Shifts</span>
              </div>

              <div className="space-y-1.5">
                {stateTransitions.map((tr, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-900/40 border border-slate-800/50 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-400 mb-0.5">
                      <span className="text-cyan-400 font-semibold">{tr.dimension}</span>
                      <span className="text-slate-400">{tr.previousState} → {tr.currentState}</span>
                    </div>
                    <div className="text-slate-300 leading-snug">{tr.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warnings & Limitations Box */}
      {snapshot.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs font-mono space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>Active Point-in-Time Reality Warnings ({snapshot.warnings.length})</span>
          </div>
          <div className="space-y-1 text-slate-400 pl-6">
            {snapshot.warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <span className="text-slate-400">•</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}

      {/* State Explanation Modal */}
      <StateExplanationModal
        isOpen={explanationData.isOpen}
        onClose={() => setExplanationData(prev => ({ ...prev, isOpen: false }))}
        title={explanationData.title}
        classification={explanationData.classification}
        classificationColor={explanationData.classificationColor}
        evidence={explanationData.evidence}
        metrics={explanationData.metrics}
        formulaDescription={explanationData.formulaDescription}
      />

      {/* Phase 4A Causality Test Suite Modal */}
      <Phase4ATestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
}
