import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Crosshair,
  BarChart2,
  Activity,
  Layers,
  ChevronRight,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';
import {
  MarketIndex,
  Sector,
  MarketBreadth,
  SetupDetection,
  RiskAlert,
  WatchlistItem,
} from '../../types';
import { marketService } from '../../services/marketService';
import { setupService } from '../../services/setupService';
import { riskService } from '../../services/riskService';
import { portfolioService } from '../../services/portfolioService';
import { formatNPR, formatPercent, formatNepseDenomination, formatNumber } from '../../utils/formatters';
import { DataSourceIndicator } from '../layout/DataSourceIndicator';

interface DashboardViewProps {
  onSelectStock: (symbol: string) => void;
  onNavigate: (section: any) => void;
}

export function DashboardView({ onSelectStock, onNavigate }: DashboardViewProps) {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [breadth, setBreadth] = useState<MarketBreadth | null>(null);
  const [setups, setSetups] = useState<SetupDetection[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      marketService.getMarketIndices(),
      marketService.getSectors(),
      marketService.getMarketBreadth(),
      setupService.getDetectedSetups(),
      riskService.getActiveRiskAlerts(),
      portfolioService.getWatchlist(),
    ]).then(([idx, sec, brd, stp, alr, wl]) => {
      setIndices(idx);
      setSectors(sec);
      setBreadth(brd);
      setSetups(stp);
      setAlerts(alr);
      setWatchlist(wl);
      setLoading(false);
    });
  }, []);

  const nepseIndex = indices.find(i => i.symbol === 'NEPSE');

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-500 font-mono text-xs">
        <Activity className="w-4 h-4 animate-spin text-cyan-400 mr-2" />
        INITIALIZING NEPSE WORKSTATION DASHBOARD...
      </div>
    );
  }

  const getRegimeColor = (regime?: string | null) => {
    switch (regime) {
      case 'STRONG_BULLISH':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
      case 'BULLISH':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
      case 'NEUTRAL':
        return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
      case 'WEAK':
        return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
      case 'BEARISH':
      case 'STRONG_BEARISH':
        return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
      default:
        return 'text-slate-400 border-slate-700 bg-slate-800/40';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* 1. Header & Market Overview Banner */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div>
            <h1 className="text-xl font-bold font-mono text-slate-100 flex items-center gap-2">
              <span>RESEARCH & TRADING INTELLIGENCE DASHBOARD</span>
            </h1>
            <p className="text-xs text-slate-400">
              Deterministic Market Regime, Opportunity Scanner, Risk Thresholds & Watchlist
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <DataSourceIndicator variant="pill" />
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline">NPR Turnover: {nepseIndex ? formatNepseDenomination(nepseIndex.turnover) : '7.82 Arba'}</span>
          </div>
        </div>

        <DataSourceIndicator variant="banner" className="mb-4" />

        {/* Index Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {indices.map((idx, index) => (
            <div
              key={`${idx.symbol}-${idx.timestamp || index}`}
              className="bg-[#111722] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>{idx.name}</span>
                <span className="text-[10px] text-slate-500">SYMBOL: {idx.symbol}</span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                  {idx.currentValue.toFixed(2)}
                </div>
                <div
                  className={`text-xs font-mono font-semibold flex items-center gap-1.5 mt-0.5 ${
                    idx.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  <span>{idx.change >= 0 ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)}</span>
                  <span>({formatPercent(idx.changePercent)})</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Turnover</span>
                <span className="text-slate-200">{formatNepseDenomination(idx.turnover)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Market Condition & Deterministic Regime Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Market Regime & Deterministic Logic */}
        <div className="lg:col-span-2 bg-[#111722] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Market Condition & Deterministic Regime Engine
              </h2>
            </div>
            {breadth?.hasData === false ? (
              <div className="px-2.5 py-0.5 rounded text-xs font-mono font-bold border border-slate-700 bg-slate-800/40 text-slate-400">
                NO DATA FOR THIS DATE
              </div>
            ) : (
              <div className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getRegimeColor(breadth?.marketRegime)}`}>
                REGIME: {breadth?.marketRegime || 'NEUTRAL'} ({breadth?.regimeScore || 50}/100)
              </div>
            )}
          </div>

          {breadth?.hasData === false ? (
            <div className="py-10 px-4 flex flex-col items-center justify-center text-center bg-[#0b0f17] rounded border border-slate-800/80 my-2">
              <div className="w-10 h-10 rounded-full bg-slate-850 border border-slate-700/80 flex items-center justify-center text-slate-400 mb-3">
                <Activity className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-sm font-mono font-semibold text-slate-200">
                No data for this date
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1 max-w-md">
                No market transaction records or price mutations were recorded on this trading session. Market breadth (advancers/decliners) and moving average participation cannot be computed.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {/* Advance / Decline Ratio */}
                <div className="bg-[#0b0f17] p-3 rounded border border-slate-800/80">
                  <div className="text-[11px] font-mono text-slate-400">MARKET BREADTH (A/D)</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-bold font-mono text-emerald-400">{breadth?.advancers ?? 0}</span>
                    <span className="text-xs text-slate-500 font-mono">/</span>
                    <span className="text-lg font-bold font-mono text-rose-400">{breadth?.decliners ?? 0}</span>
                    <span className="text-xs text-slate-500 font-mono">({breadth?.unchanged ?? 0} unch)</span>
                  </div>
                  {/* Ratio Bar */}
                  <div className="w-full h-1.5 bg-rose-500/40 rounded-full mt-2 overflow-hidden flex">
                    <div
                      className="bg-emerald-400 h-full"
                      style={{
                        width: `${(((breadth?.advancers || 0) / Math.max(1, (breadth?.advancers || 0) + (breadth?.decliners || 0)))) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 flex justify-between">
                    <span>Ratio: {(breadth?.advanceDeclineRatio ?? 0).toFixed(2)}:1</span>
                    <span>{(((breadth?.advancers || 0) / Math.max(1, (breadth?.advancers || 0) + (breadth?.decliners || 0) + (breadth?.unchanged || 0))) * 100).toFixed(0)}% Advancing</span>
                  </div>
                </div>

                {/* Universe Moving Average Participation */}
                <div className="bg-[#0b0f17] p-3 rounded border border-slate-800/80">
                  <div className="text-[11px] font-mono text-slate-400">STOCKS &gt; 20 EMA &amp; 50 SMA</div>
                  <div className="text-lg font-bold font-mono text-slate-100 mt-1">
                    {breadth?.aboveSma20Percent ?? 0}% <span className="text-xs font-normal text-slate-400">(&gt;20d)</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Above 50 SMA: <span className="text-slate-200 font-semibold">{breadth?.aboveSma50Percent ?? 0}%</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Above 200 SMA: <span className="text-slate-200 font-semibold">{breadth?.aboveSma200Percent ?? 0}%</span>
                  </div>
                </div>

                {/* Turnover Momentum */}
                <div className="bg-[#0b0f17] p-3 rounded border border-slate-800/80">
                  <div className="text-[11px] font-mono text-slate-400">TURNOVER EXPANSION</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                    +{breadth?.turnoverChangePercent ?? 0}%
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Total Volume: <span className="text-slate-200 font-semibold">{nepseIndex ? formatNumber(nepseIndex.volume, 0) : '18.4M'}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Transactions: <span className="text-slate-200 font-semibold">{nepseIndex ? formatNumber(nepseIndex.totalTransactions, 0) : '89,420'}</span>
                  </div>
                </div>
              </div>

              {/* Deterministic Rule Traceability (Prompt core directive: deterministic rules, no AI guessing) */}
              <div className="bg-[#0d121c] p-3 rounded border border-slate-800 font-mono text-xs">
                <div className="text-[11px] text-cyan-400 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>DETERMINISTIC REGIME RUBRIC VERIFICATION (100% TRACEABLE)</span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {breadth?.rationale.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Active Risk Alerts Preview */}
        <div className="bg-[#111722] border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Risk Engine Alerts ({alerts.length})
                </h2>
              </div>
              <button
                onClick={() => onNavigate('risk')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
              >
                Risk Engine <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-2.5 rounded border text-xs ${
                    alert.severity === 'HIGH'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      : alert.severity === 'MEDIUM'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {alert.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded uppercase font-semibold bg-black/40">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {alert.description}
                  </p>
                  <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Target: {alert.affectedEntity}</span>
                    <span className="font-semibold text-cyan-300">{alert.metricValue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Risk Sizing Protocol: Active</span>
            <span className="text-emerald-400">Max 2.0% Risk/Trade</span>
          </div>
        </div>
      </div>

      {/* 3. Opportunity Scanner Preview (Top Scoring Predefined Setups) */}
      <div className="bg-[#111722] border border-slate-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 mb-3 gap-2">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Opportunity Scanner (Predefined Setups &amp; Multi-Factor Scores)
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400">
              Deterministic Scoring: Tech (30%) + Fund (25%) + Market (15%) + Broker (15%) + Risk (15%)
            </span>
            <button
              onClick={() => onNavigate('setups')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 font-semibold"
            >
              View All ({setups.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Setups Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase bg-slate-900/40">
                <th className="py-2 px-3">Stock / Sector</th>
                <th className="py-2 px-3">Setup Pattern</th>
                <th className="py-2 px-3 text-right">LTP (NPR)</th>
                <th className="py-2 px-3 text-center">Opportunity Score</th>
                <th className="py-2 px-3">Scores (T / F / B / M)</th>
                <th className="py-2 px-3">Entry Zone</th>
                <th className="py-2 px-3">Stop Loss</th>
                <th className="py-2 px-3">Target 1</th>
                <th className="py-2 px-3 text-center">R:R</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {setups.map(setup => (
                <tr key={setup.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="py-3 px-3">
                    <button
                      onClick={() => onSelectStock(setup.symbol)}
                      className="text-left group-hover:text-cyan-300"
                    >
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span className="text-cyan-400">{setup.symbol}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        {setup.sectorName}
                      </div>
                    </button>
                  </td>

                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-cyan-950/70 border border-cyan-700/50 text-cyan-200">
                      {setup.setupName}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Conf: {setup.confidencePercent}%
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-semibold text-slate-100">
                    Rs. {setup.currentPrice.toFixed(1)}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-7 rounded font-bold text-xs bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                      {setup.scores.overall}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-[11px] text-slate-300">
                    <span className="text-cyan-300" title="Technical Score">{setup.scores.technical}</span>
                    <span className="text-slate-600"> / </span>
                    <span className="text-amber-300" title="Fundamental Score">{setup.scores.fundamental}</span>
                    <span className="text-slate-600"> / </span>
                    <span className="text-purple-300" title="Broker Score">{setup.scores.broker}</span>
                    <span className="text-slate-600"> / </span>
                    <span className="text-emerald-300" title="Market Score">{setup.scores.market}</span>
                  </td>

                  <td className="py-3 px-3 text-slate-300">
                    Rs. {setup.entryZoneLow} - {setup.entryZoneHigh}
                  </td>

                  <td className="py-3 px-3 font-semibold text-rose-400">
                    Rs. {setup.stopLoss}
                  </td>

                  <td className="py-3 px-3 font-semibold text-emerald-400">
                    Rs. {setup.target1}
                  </td>

                  <td className="py-3 px-3 text-center font-bold text-cyan-300">
                    {setup.riskRewardRatio}:1
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onSelectStock(setup.symbol)}
                      className="px-2.5 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/40 text-cyan-300 hover:text-white text-[11px] transition-colors"
                    >
                      Research
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Bottom Grid: Sector Performance & Watchlist Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sector Turnover & Index Table */}
        <div className="bg-[#111722] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Sector Performance &amp; Turnover Share
              </h2>
            </div>
            <button
              onClick={() => onNavigate('market')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
            >
              Full Market <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {sectors.slice(0, 6).map(sec => (
              <div
                key={sec.id}
                className="p-2 bg-[#0c1018] rounded border border-slate-800/60 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="text-slate-200 font-semibold text-xs truncate">{sec.name}</div>
                  <div className="text-[10px] text-slate-400">
                    Turnover: {formatNepseDenomination(sec.turnover)} ({sec.weightPercent}% weight)
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-semibold text-slate-100">{sec.indexValue.toFixed(2)}</div>
                  <div
                    className={`text-[11px] font-semibold ${
                      sec.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatPercent(sec.changePercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Watchlist Quick Status Tracker */}
        <div className="bg-[#111722] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Personal Watchlist Status ({watchlist.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigate('watchlist')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
            >
              Manage Watchlist <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {watchlist.map(item => (
              <div
                key={item.id}
                className="p-2.5 bg-[#0c1018] rounded border border-slate-800/80 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectStock(item.symbol)}
                      className="font-bold text-cyan-400 hover:underline"
                    >
                      {item.symbol}
                    </button>
                    <span className="text-slate-400 text-[11px]">{item.sectorName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        item.status === 'READY'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : item.status === 'SETUP_FORMING'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 truncate max-w-sm">
                    {item.thesis}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-100">Rs. {item.currentPrice.toFixed(1)}</div>
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    Target: Rs. {item.targetPrice}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
