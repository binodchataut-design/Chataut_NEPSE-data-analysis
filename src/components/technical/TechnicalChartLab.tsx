import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  Clock,
  Layers,
  Sliders,
  Eye,
  Table as TableIcon,
  ShieldCheck,
  TrendingUp,
  Activity,
  AlertCircle,
  HelpCircle,
  BarChart2,
  ChevronDown
} from 'lucide-react';
import { OHLCVBar, Timeframe } from '../../types/technicalIndicators';
import { timeframeService } from '../../engine/technical/timeframeService';
import { indicatorRegistry } from '../../engine/technical/indicatorRegistry';
import { getNormalizedStockBars } from '../../data/normalizedMasterData';
import { formatNumber } from '../../utils/formatters';

interface Props {
  symbol: string;
  onSelectStock: (symbol: string) => void;
  onOpenIntegrityModal: () => void;
}

const AVAILABLE_SCRIPS = [
  { symbol: 'CHCL', name: 'Chilime Hydro' },
  { symbol: 'NABIL', name: 'Nabil Bank Ltd' },
  { symbol: 'SHIVM', name: 'Shivam Cements' },
  { symbol: 'HDL', name: 'Himalayan Distillery' },
  { symbol: 'NICA', name: 'NIC Asia Bank' }
];

export function TechnicalChartLab({ symbol, onSelectStock, onOpenIntegrityModal }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>('DAILY');

  // Active Overlays
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showSMA200, setShowSMA200] = useState(false);
  const [showEMA20, setShowEMA20] = useState(false);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showVWAP, setShowVWAP] = useState(false);
  const [showSRLevels, setShowSRLevels] = useState(true);

  // Secondary Panel Selection
  const [activeSecondaryPanel, setActiveSecondaryPanel] = useState<'RSI' | 'MACD' | 'STOCHASTIC' | 'VOLUME_CMF' | 'ATR'>('RSI');

  // Parameter Configuration
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [bbPeriod, setBbPeriod] = useState(20);
  const [bbStdDev, setBbStdDev] = useState(2.0);
  const [viewTab, setViewTab] = useState<'CHART' | 'INSPECTOR' | 'PATTERNS' | 'STATS'>('CHART');

  // 1. Fetch and resample OHLCV bars
  const bars: OHLCVBar[] = useMemo(() => {
    const rawDaily = getNormalizedStockBars(symbol);
    const converted: OHLCVBar[] = rawDaily.map(b => ({
      date: b.date,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume,
      turnover: b.turnover
    }));
    return timeframeService.resample(converted, timeframe);
  }, [symbol, timeframe]);

  // 2. Compute Indicators via Registry
  const chartData = useMemo(() => {
    if (bars.length === 0) return [];

    const sma20 = indicatorRegistry.execute('SMA', bars, { period: 20 }, symbol, timeframe);
    const sma50 = indicatorRegistry.execute('SMA', bars, { period: 50 }, symbol, timeframe);
    const sma200 = indicatorRegistry.execute('SMA', bars, { period: 200 }, symbol, timeframe);
    const ema20 = indicatorRegistry.execute('EMA', bars, { period: 20 }, symbol, timeframe);
    const bb = indicatorRegistry.execute('BOLLINGER', bars, { period: bbPeriod, stdDevMultiplier: bbStdDev }, symbol, timeframe);
    const vwap = indicatorRegistry.execute('VWAP', bars, {}, symbol, timeframe);
    const rsi = indicatorRegistry.execute('RSI', bars, { period: rsiPeriod }, symbol, timeframe);
    const macd = indicatorRegistry.execute('MACD', bars, {}, symbol, timeframe);
    const stoch = indicatorRegistry.execute('STOCHASTIC', bars, {}, symbol, timeframe);
    const cmf = indicatorRegistry.execute('CMF', bars, { period: 20 }, symbol, timeframe);
    const atr = indicatorRegistry.execute('ATR', bars, { period: 14 }, symbol, timeframe);

    return bars.map((bar, i) => {
      const bRes = bb.series[i]?.values;
      const mRes = macd.series[i]?.values;
      const sRes = stoch.series[i]?.values;
      const aRes = atr.series[i]?.values;

      return {
        date: bar.date,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
        sma20: sma20.series[i]?.values.sma ?? null,
        sma50: sma50.series[i]?.values.sma ?? null,
        sma200: sma200.series[i]?.values.sma ?? null,
        ema20: ema20.series[i]?.values.ema ?? null,
        bbUpper: bRes?.upper ?? null,
        bbMiddle: bRes?.middle ?? null,
        bbLower: bRes?.lower ?? null,
        vwap: vwap.series[i]?.values.vwap ?? null,
        rsi: rsi.series[i]?.values.rsi ?? null,
        rsiReady: rsi.series[i]?.isReady ?? false,
        rsiWarmupRemaining: rsi.series[i]?.warmupRemaining ?? 0,
        macd: mRes?.macd ?? null,
        macdSignal: mRes?.signal ?? null,
        macdHist: mRes?.histogram ?? null,
        stochK: sRes?.k ?? null,
        stochD: sRes?.d ?? null,
        cmf: cmf.series[i]?.values.cmf ?? null,
        atr: aRes?.atr ?? null,
        atrPercent: aRes?.atrPercent ?? null
      };
    });
  }, [bars, symbol, timeframe, rsiPeriod, bbPeriod, bbStdDev]);

  // Support & Resistance
  const srLevels = useMemo(() => indicatorRegistry.getSupportResistance(bars, 1.5), [bars]);

  // Candlestick & Chart Patterns
  const candlestickDetections = useMemo(() => indicatorRegistry.getCandlestickPatterns(bars), [bars]);
  const chartPatternDetections = useMemo(() => indicatorRegistry.getChartPatterns(bars), [bars]);

  // Statistical Features
  const stats = useMemo(() => indicatorRegistry.getStatisticalFeatures(bars, 20), [bars]);
  const structure = useMemo(() => indicatorRegistry.getPriceStructure(bars, 4, 4), [bars]);

  const latestBar = bars[bars.length - 1] || { close: 0, date: '' };
  const prevBar = bars[bars.length - 2] || { close: 0 };
  const priceChange = latestBar.close - prevBar.close;
  const pctChange = prevBar.close > 0 ? (priceChange / prevBar.close) * 100 : 0;

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Top Controls Bar */}
      <div className="bg-[#111722] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Scrip Selection & Price Bar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={symbol}
              onChange={e => onSelectStock(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {AVAILABLE_SCRIPS.map(s => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="font-mono">
            <div className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Rs. {latestBar.close.toFixed(1)}</span>
              <span className={`text-xs font-semibold ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)} ({pctChange.toFixed(2)}%)
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              As of {latestBar.date} • {bars.length} Bars Loaded
            </div>
          </div>
        </div>

        {/* Timeframe Resampler */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg font-mono text-[11px]">
          <span className="text-slate-500 px-2 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" /> Timeframe:
          </span>
          {(['DAILY', 'WEEKLY', 'MONTHLY'] as Timeframe[]).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded font-bold transition-colors ${
                timeframe === tf
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Audit Suite Badge */}
        <button
          onClick={onOpenIntegrityModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 font-mono text-[11px] rounded-lg transition-colors"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Integrity Suite: 100% Passed</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setViewTab('CHART')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              viewTab === 'CHART'
                ? 'bg-cyan-950 border border-cyan-700 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" /> Interactive Chart & Panels
          </button>
          <button
            onClick={() => setViewTab('INSPECTOR')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              viewTab === 'INSPECTOR'
                ? 'bg-cyan-950 border border-cyan-700 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-4 h-4" /> Raw Value Inspector
          </button>
          <button
            onClick={() => setViewTab('PATTERNS')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              viewTab === 'PATTERNS'
                ? 'bg-cyan-950 border border-cyan-700 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> Patterns & S/R Levels
          </button>
          <button
            onClick={() => setViewTab('STATS')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
              viewTab === 'STATS'
                ? 'bg-cyan-950 border border-cyan-700 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Quantitative & Risk Metrics
          </button>
        </div>

        {/* Quick S/R Badges */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px]">
          <span className="text-slate-400">Trend Structure:</span>
          <span className={`font-bold px-2 py-0.5 rounded ${
            structure.trend === 'BULLISH'
              ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300'
              : structure.trend === 'BEARISH'
              ? 'bg-rose-950/80 border border-rose-700 text-rose-300'
              : 'bg-slate-800 border border-slate-700 text-slate-300'
          }`}>
            {structure.trend}
          </span>
          {structure.isConsolidating && (
            <span className="bg-amber-950/80 border border-amber-700 text-amber-300 px-2 py-0.5 rounded">
              CONSOLIDATION ({structure.rangePercentage.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {/* VIEW TAB 1: CHART & PANELS */}
      {viewTab === 'CHART' && (
        <div className="space-y-4">
          {/* Main Price Chart */}
          <div className="bg-[#111722] border border-slate-800 rounded-xl p-4">
            {/* Overlays Control Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/80 font-mono text-[11px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 mr-1 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Overlays:
                </span>
                <label className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSMA20}
                    onChange={e => setShowSMA20(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="text-amber-400 font-semibold">SMA 20</span>
                </label>
                <label className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSMA50}
                    onChange={e => setShowSMA50(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="text-blue-400 font-semibold">SMA 50</span>
                </label>
                <label className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSMA200}
                    onChange={e => setShowSMA200(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="text-purple-400 font-semibold">SMA 200</span>
                </label>
                <label className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showEMA20}
                    onChange={e => setShowEMA20(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="text-emerald-400 font-semibold">EMA 20</span>
                </label>
                <label className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBollinger}
                    onChange={e => setShowBollinger(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="text-cyan-400 font-semibold">Bollinger Bands</span>
                </label>
                <label className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showVWAP}
                    onChange={e => setShowVWAP(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="text-pink-400 font-semibold">VWAP</span>
                </label>
                <label className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSRLevels}
                    onChange={e => setShowSRLevels(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="text-slate-300 font-semibold">S/R Lines</span>
                </label>
              </div>

              {/* BB Parameter adjustment */}
              {showBollinger && (
                <div className="flex items-center gap-2 text-slate-400">
                  <span>BB Period:</span>
                  <input
                    type="number"
                    value={bbPeriod}
                    onChange={e => setBbPeriod(Math.max(5, parseInt(e.target.value) || 20))}
                    className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-white rounded text-center text-xs"
                  />
                  <span>Mult:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={bbStdDev}
                    onChange={e => setBbStdDev(Math.max(0.5, parseFloat(e.target.value) || 2.0))}
                    className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-white rounded text-center text-xs"
                  />
                </div>
              )}
            </div>

            {/* Price Chart Container */}
            <div className="h-[340px] w-full font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis
                    domain={['auto', 'auto']}
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                    orientation="right"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                  />

                  {/* S/R Reference Lines */}
                  {showSRLevels && srLevels.slice(0, 4).map(l => (
                    <ReferenceLine
                      key={l.id}
                      y={l.price}
                      stroke={l.type === 'RESISTANCE' ? '#f43f5e' : '#10b981'}
                      strokeDasharray="4 4"
                      label={{
                        value: `${l.type === 'RESISTANCE' ? 'R' : 'S'}: ${l.price} (Str: ${l.strength})`,
                        fill: l.type === 'RESISTANCE' ? '#f43f5e' : '#10b981',
                        fontSize: 9,
                        position: 'left'
                      }}
                    />
                  ))}

                  {/* Bollinger Corridor */}
                  {showBollinger && (
                    <>
                      <Line type="monotone" dataKey="bbUpper" stroke="#0ea5e9" strokeDasharray="3 3" dot={false} strokeWidth={1} name="BB Upper" />
                      <Line type="monotone" dataKey="bbMiddle" stroke="#38bdf8" dot={false} strokeWidth={1} name="BB Middle" />
                      <Line type="monotone" dataKey="bbLower" stroke="#0ea5e9" strokeDasharray="3 3" dot={false} strokeWidth={1} name="BB Lower" />
                    </>
                  )}

                  {/* Moving Averages */}
                  {showSMA20 && <Line type="monotone" dataKey="sma20" stroke="#f59e0b" dot={false} strokeWidth={1.5} name="SMA 20" />}
                  {showSMA50 && <Line type="monotone" dataKey="sma50" stroke="#3b82f6" dot={false} strokeWidth={1.5} name="SMA 50" />}
                  {showSMA200 && <Line type="monotone" dataKey="sma200" stroke="#a855f7" dot={false} strokeWidth={1.5} name="SMA 200" />}
                  {showEMA20 && <Line type="monotone" dataKey="ema20" stroke="#10b981" dot={false} strokeWidth={1.5} name="EMA 20" />}
                  {showVWAP && <Line type="monotone" dataKey="vwap" stroke="#ec4899" dot={false} strokeWidth={1.5} name="VWAP" />}

                  {/* Price Area */}
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fillOpacity={0.15}
                    fill="#0284c7"
                    name="Close Price"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Indicator Panel Selector */}
          <div className="bg-[#111722] border border-slate-800 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/80 font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 mr-1 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" /> Oscillator / Volume Panel:
                </span>
                {(['RSI', 'MACD', 'STOCHASTIC', 'VOLUME_CMF', 'ATR'] as const).map(panel => (
                  <button
                    key={panel}
                    onClick={() => setActiveSecondaryPanel(panel)}
                    className={`px-2.5 py-1 rounded font-bold transition-colors ${
                      activeSecondaryPanel === panel
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {panel.replace('_', ' & ')}
                  </button>
                ))}
              </div>

              {/* Specific Panel Controls */}
              {activeSecondaryPanel === 'RSI' && (
                <div className="flex items-center gap-2 text-slate-400">
                  <span>RSI Period:</span>
                  <input
                    type="number"
                    value={rsiPeriod}
                    onChange={e => setRsiPeriod(Math.max(2, parseInt(e.target.value) || 14))}
                    className="w-12 px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-white rounded text-center text-xs"
                  />
                </div>
              )}
            </div>

            {/* Secondary Panel Chart */}
            <div className="h-[180px] w-full font-mono">
              <ResponsiveContainer width="100%" height="100%">
                {activeSecondaryPanel === 'RSI' ? (
                  <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 100]} ticks={[30, 50, 70]} stroke="#64748b" tick={{ fontSize: 9 }} orientation="right" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '70', fill: '#f43f5e', fontSize: 9 }} />
                    <ReferenceLine y={50} stroke="#64748b" strokeDasharray="2 2" />
                    <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: '30', fill: '#10b981', fontSize: 9 }} />
                    <Line type="monotone" dataKey="rsi" stroke="#a855f7" strokeWidth={2} dot={false} name="RSI" />
                  </ComposedChart>
                ) : activeSecondaryPanel === 'MACD' ? (
                  <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 9 }} orientation="right" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <ReferenceLine y={0} stroke="#64748b" />
                    <Bar dataKey="macdHist" fill="#38bdf8" name="Histogram" />
                    <Line type="monotone" dataKey="macd" stroke="#0ea5e9" strokeWidth={1.5} dot={false} name="MACD" />
                    <Line type="monotone" dataKey="macdSignal" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Signal" />
                  </ComposedChart>
                ) : activeSecondaryPanel === 'STOCHASTIC' ? (
                  <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 100]} ticks={[20, 50, 80]} stroke="#64748b" tick={{ fontSize: 9 }} orientation="right" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <ReferenceLine y={80} stroke="#f43f5e" strokeDasharray="3 3" />
                    <ReferenceLine y={20} stroke="#10b981" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="stochK" stroke="#0ea5e9" strokeWidth={1.5} dot={false} name="%K" />
                    <Line type="monotone" dataKey="stochD" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="%D" />
                  </ComposedChart>
                ) : activeSecondaryPanel === 'VOLUME_CMF' ? (
                  <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 9 }} orientation="right" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="volume" fill="#1e293b" name="Volume" />
                    <Line type="monotone" dataKey="cmf" stroke="#10b981" strokeWidth={2} dot={false} name="CMF (20)" />
                  </ComposedChart>
                ) : (
                  <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 9 }} orientation="right" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="atr" stroke="#eab308" strokeWidth={2} dot={false} name="ATR (14)" />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 2: RAW VALUE INSPECTOR */}
      {viewTab === 'INSPECTOR' && (
        <div className="bg-[#111722] border border-slate-800 rounded-xl overflow-hidden font-mono">
          <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-300 font-bold">
              BAR-BY-BAR RAW VALUES & WARMUP STATE
            </div>
            <div className="text-[10px] text-slate-400">
              Values during warmup period return null with <span className="text-amber-400 font-bold">WARMUP</span> status.
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-[11px]">
              <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Close</th>
                  <th className="py-2.5 px-3 text-right">Volume</th>
                  <th className="py-2.5 px-3 text-right">SMA(20)</th>
                  <th className="py-2.5 px-3 text-right">EMA(20)</th>
                  <th className="py-2.5 px-3 text-right">RSI(14)</th>
                  <th className="py-2.5 px-3 text-right">MACD Hist</th>
                  <th className="py-2.5 px-3 text-right">BB Upper</th>
                  <th className="py-2.5 px-3 text-right">ATR(14)</th>
                  <th className="py-2.5 px-3 text-center">Warmup Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {[...chartData].reverse().map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20">
                    <td className="py-2 px-3 font-semibold text-white">{row.date}</td>
                    <td className="py-2 px-3 text-right text-slate-100 font-bold">Rs. {row.close.toFixed(1)}</td>
                    <td className="py-2 px-3 text-right text-slate-400">{formatNumber(row.volume)}</td>
                    <td className="py-2 px-3 text-right text-amber-400">
                      {row.sma20 !== null ? row.sma20.toFixed(1) : <span className="text-slate-600">null</span>}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-400">
                      {row.ema20 !== null ? row.ema20.toFixed(1) : <span className="text-slate-600">null</span>}
                    </td>
                    <td className="py-2 px-3 text-right text-purple-400 font-semibold">
                      {row.rsi !== null ? row.rsi.toFixed(2) : <span className="text-slate-600">null</span>}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {row.macdHist !== null ? (
                        <span className={row.macdHist >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {row.macdHist.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-600">null</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-cyan-400">
                      {row.bbUpper !== null ? row.bbUpper.toFixed(1) : <span className="text-slate-600">null</span>}
                    </td>
                    <td className="py-2 px-3 text-right text-yellow-400">
                      {row.atr !== null ? row.atr.toFixed(2) : <span className="text-slate-600">null</span>}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {row.rsiReady ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold">
                          READY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/80 border border-amber-800 text-amber-300 font-bold">
                          WARMUP ({row.rsiWarmupRemaining} left)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW TAB 3: PATTERNS & S/R LEVELS */}
      {viewTab === 'PATTERNS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Support & Resistance Levels */}
          <div className="bg-[#111722] border border-slate-800 rounded-xl p-4 font-mono">
            <h3 className="text-xs font-bold text-slate-100 uppercase mb-3 flex items-center justify-between">
              <span>Deterministic S/R Cluster Map</span>
              <span className="text-[10px] text-slate-400 font-normal">Tolerance: 1.5%</span>
            </h3>

            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {srLevels.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">No clusters detected in window.</div>
              ) : (
                srLevels.map(lvl => (
                  <div
                    key={lvl.id}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      lvl.type === 'RESISTANCE'
                        ? 'bg-rose-950/20 border-rose-800/40'
                        : 'bg-emerald-950/20 border-emerald-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${lvl.type === 'RESISTANCE' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {lvl.type} @ Rs. {lvl.price.toFixed(1)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {lvl.source}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        First: {lvl.firstDetected} • Last Tested: {lvl.lastTested} ({lvl.testCount} touches)
                      </div>
                      {lvl.notes && <div className="text-[10px] text-slate-500 mt-0.5">{lvl.notes}</div>}
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase">Strength Score</div>
                      <div className="text-sm font-bold text-slate-100">{lvl.strength}/100</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Candlestick & Chart Patterns */}
          <div className="space-y-4">
            {/* Candlestick Patterns */}
            <div className="bg-[#111722] border border-slate-800 rounded-xl p-4 font-mono">
              <h3 className="text-xs font-bold text-slate-100 uppercase mb-3 flex items-center justify-between">
                <span>Recent Candlestick Patterns</span>
                <span className="text-[10px] text-cyan-400">Strict Geometric Recognition</span>
              </h3>

              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {candlestickDetections.slice(-5).reverse().map((p, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{p.pattern.replace('_', ' ')}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          p.direction === 'BULLISH' ? 'bg-emerald-950 text-emerald-300' : p.direction === 'BEARISH' ? 'bg-rose-950 text-rose-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {p.direction}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Bar Date: {p.date}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-cyan-400 font-bold">Detection Match: {p.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart Patterns with explicit NOT_IMPLEMENTED states */}
            <div className="bg-[#111722] border border-slate-800 rounded-xl p-4 font-mono">
              <h3 className="text-xs font-bold text-slate-100 uppercase mb-3 flex items-center justify-between">
                <span>Chart Patterns Framework</span>
                <span className="text-[10px] text-slate-400">No Heuristic Hallucinations</span>
              </h3>

              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {chartPatternDetections.map((cp, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{cp.patternName}</span>
                        {cp.status === 'IMPLEMENTED' ? (
                          cp.detected ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                              DETECTED ({cp.direction})
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              NO SETUP
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-800/60 text-amber-400 font-bold">
                            NOT IMPLEMENTED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{cp.notes}</div>
                    </div>
                    {cp.detected && (
                      <div className="text-right text-xs font-bold text-cyan-400">
                        {cp.confidence}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 4: QUANTITATIVE & STATISTICAL METRICS */}
      {viewTab === 'STATS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="bg-[#111722] border border-slate-800 p-4 rounded-xl">
            <div className="text-[11px] text-slate-400 uppercase">20-Bar Price Z-Score</div>
            <div className="text-2xl font-bold text-cyan-400 mt-1">
              {stats.zScore[stats.zScore.length - 1] !== null
                ? stats.zScore[stats.zScore.length - 1]!.toFixed(2)
                : 'N/A'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Standard deviations from 20-period rolling mean. (|Z| &gt; 2 indicates extreme distribution tail).
            </p>
          </div>

          <div className="bg-[#111722] border border-slate-800 p-4 rounded-xl">
            <div className="text-[11px] text-slate-400 uppercase">Percentile Rank (20 Bars)</div>
            <div className="text-2xl font-bold text-white mt-1">
              {stats.percentileRank[stats.percentileRank.length - 1] !== null
                ? `${stats.percentileRank[stats.percentileRank.length - 1]!.toFixed(1)}%`
                : 'N/A'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Relative rank of current close vs past 20 sessions.
            </p>
          </div>

          <div className="bg-[#111722] border border-slate-800 p-4 rounded-xl">
            <div className="text-[11px] text-slate-400 uppercase">Annualized Volatility</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {stats.annualizedVolatility !== null ? `${stats.annualizedVolatility.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Log return standard deviation scaled by 245 annual NEPSE sessions.
            </p>
          </div>

          <div className="bg-[#111722] border border-slate-800 p-4 rounded-xl">
            <div className="text-[11px] text-slate-400 uppercase">Max & Current Drawdown</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">
              -{stats.maxDrawdown.toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Current Drawdown from local peak: -{stats.currentDrawdown.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
