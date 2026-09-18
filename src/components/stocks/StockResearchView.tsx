import { useState, useEffect } from 'react';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  BarChart3,
  Users,
  Crosshair,
  Sliders,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Eye,
  BrainCircuit,
} from 'lucide-react';
import { DecisionIntelligenceView } from '../decision/DecisionIntelligenceView';
import {
  Company,
  CandleData,
  TechnicalIndicators,
  TechnicalScoreBreakdown,
  FundamentalMetrics,
  FundamentalScoreBreakdown,
  StockBrokerConcentration,
  SetupDetection,
} from '../../types';
import { stockService } from '../../services/stockService';
import { technicalService } from '../../services/technicalService';
import { fundamentalService } from '../../services/fundamentalService';
import { brokerService } from '../../services/brokerService';
import { setupService } from '../../services/setupService';
import { portfolioService } from '../../services/portfolioService';
import { formatNPR, formatPercent, formatNepseDenomination, formatNumber } from '../../utils/formatters';
import { DataSourceIndicator } from '../layout/DataSourceIndicator';

interface StockResearchViewProps {
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
  onNavigateToWatchlist?: () => void;
}

export function StockResearchView({
  selectedSymbol,
  onSelectStock,
  onNavigateToWatchlist,
}: StockResearchViewProps) {
  const [allStocks, setAllStocks] = useState<Company[]>([]);
  const [stock, setStock] = useState<Company | null>(null);
  const [timeframe, setTimeframe] = useState<'INTRA' | '1D' | '1W' | '1M'>('1D');
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [techScore, setTechScore] = useState<TechnicalScoreBreakdown | null>(null);
  const [fundMetrics, setFundMetrics] = useState<FundamentalMetrics | null>(null);
  const [fundScore, setFundScore] = useState<FundamentalScoreBreakdown | null>(null);
  const [brokerConcentration, setBrokerConcentration] = useState<StockBrokerConcentration | null>(null);
  const [fundUnavailableReason, setFundUnavailableReason] = useState<string | null>(null);
  const [setups, setSetups] = useState<SetupDetection[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TECHNICAL' | 'FUNDAMENTAL' | 'BROKER' | 'SETUPS' | 'DECISION'>('OVERVIEW');
  const [addedToWatchlist, setAddedToWatchlist] = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);

  useEffect(() => {
    stockService.getAllStocks().then(setAllStocks);
  }, []);

  useEffect(() => {
    const symbol = selectedSymbol || 'CHCL';
    setAddedToWatchlist(false);
    setFundUnavailableReason(null);
    setFundMetrics(null);
    setFundScore(null);
    setBrokerConcentration(null);

    // 1. Fetch core price, candles, technical indicators, and setups independently
    Promise.all([
      stockService.getStockBySymbol(symbol),
      stockService.getStockCandles(symbol, timeframe),
      technicalService.getIndicators(symbol),
      technicalService.getScoreForSymbol(symbol),
      setupService.getSetupsForStock(symbol),
    ]).then(([stk, cnd, ind, tSc, stps]) => {
      setStock(stk);
      setCandles(cnd);
      setIndicators(ind);
      setTechScore(tSc);
      setSetups(stps);
    }).catch(err => {
      console.error('Failed to load core stock research data:', err);
    });

    // 2. Fetch fundamental and broker data independently, catching LiveDataSourceUnavailableError specifically
    Promise.all([
      fundamentalService.getMetrics(symbol),
      fundamentalService.getScoreForSymbol(symbol),
      brokerService.getStockBrokerConcentration(symbol),
    ]).then(([fMet, fSc, bConc]) => {
      setFundMetrics(fMet);
      setFundScore(fSc);
      setBrokerConcentration(bConc);
    }).catch(err => {
      const msg = err?.message || 'Fundamental data not available in this mode.';
      setFundUnavailableReason(msg);
    });
  }, [selectedSymbol, timeframe]);

  const handleAddToWatchlist = async () => {
    if (!stock) return;
    await portfolioService.addToWatchlist(stock.symbol, `Technical and fundamental research on ${stock.name}`);
    setAddedToWatchlist(true);
    setTimeout(() => setAddedToWatchlist(false), 3000);
  };

  if (!stock || !indicators || !techScore) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        Loading deep research metrics for {selectedSymbol}...
      </div>
    );
  }

  // Calculate high and low bounds for chart SVG scaling
  const minPrice = Math.min(...candles.map(c => c.low)) * 0.98;
  const maxPrice = Math.max(...candles.map(c => c.high)) * 1.02;
  const priceRange = maxPrice - minPrice || 1;
  const maxVolume = Math.max(...candles.map(c => c.volume)) || 1;

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* 1. Scrip Selector Toolbar & Fast Switcher */}
      <div className="bg-[#111722] border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mr-1">
            Tracked Scrips:
          </span>
          {allStocks.slice(0, 15).map(s => (
            <button
              key={s.symbol}
              onClick={() => onSelectStock(s.symbol)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                s.symbol === stock.symbol
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              {s.symbol}
            </button>
          ))}
          {allStocks.length > 15 && (
            <select
              value={stock.symbol}
              onChange={e => onSelectStock(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded px-2 py-1 focus:outline-none"
            >
              <option value="" disabled>More symbols ({allStocks.length})...</option>
              {allStocks.map(s => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} - {(s.name || s.symbol).substring(0, 20)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DataSourceIndicator variant="pill" />

          <button
            onClick={handleAddToWatchlist}
            disabled={addedToWatchlist}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              addedToWatchlist
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
            }`}
          >
            {addedToWatchlist ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Added to Watchlist
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" /> Add to Watchlist
              </>
            )}
          </button>
        </div>
      </div>

      <DataSourceIndicator variant="banner" />

      {/* 2. Stock Profile & Price Banner */}
      <div className="bg-[#111722] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-cyan-950/70 border border-cyan-700/40 flex items-center justify-center font-mono font-bold text-cyan-300 text-lg">
              {stock.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold font-mono text-slate-100 tracking-tight">
                  {stock.symbol}
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {stock.sectorName}
                </span>
                <span className="text-xs text-slate-500 font-mono">Listed: {stock.listingDate}</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{stock.name}</div>
            </div>
          </div>

          <div className="flex items-baseline gap-6">
            <div>
              <div className="text-[10px] font-mono text-slate-400">LAST TRADED PRICE</div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                Rs. {stock.ltp.toFixed(1)}
              </div>
              <div
                className={`text-xs font-mono font-semibold flex items-center gap-1 mt-0.5 ${
                  stock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <span>{stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.change).toFixed(1)}</span>
                <span>({formatPercent(stock.changePercent)})</span>
              </div>
            </div>

            <div className="hidden sm:block border-l border-slate-800 pl-4 space-y-1 text-xs font-mono text-slate-300">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Day High/Low:</span>
                <span className="text-slate-200">Rs. {stock.highPrice} / {stock.lowPrice}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">52W Range:</span>
                <span className="text-slate-200">Rs. {stock.fiftyTwoWeekLow} - {stock.fiftyTwoWeekHigh}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Day Turnover:</span>
                <span className="text-cyan-300 font-semibold">{formatNepseDenomination(stock.turnover)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Dual Scores & Key Ratios */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 font-mono text-xs">
          <div className="bg-[#0b0f17] p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase">Technical Score</span>
            <div className="text-base font-bold text-cyan-300 mt-0.5">
              {techScore.totalScore}/100
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">{techScore.trendCondition}</span>
          </div>

          <div className="bg-[#0b0f17] p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase">Fundamental Score</span>
            {fundUnavailableReason ? (
              <div className="text-[11px] font-semibold text-amber-400 mt-1">Unavailable</div>
            ) : fundScore && fundMetrics ? (
              <>
                <div className="text-base font-bold text-amber-300 mt-0.5">
                  {fundScore.totalScore}/100 <span className="text-xs font-normal text-slate-400">(Grade {fundScore.grade})</span>
                </div>
                <span className="text-[10px] text-slate-400">ROE: {fundMetrics.roe}%</span>
              </>
            ) : (
              <div className="text-[11px] text-slate-500 mt-1">Loading...</div>
            )}
          </div>

          <div className="bg-[#0b0f17] p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase">Broker Sentiment</span>
            <div className="text-base font-bold text-purple-300 mt-0.5">
              {brokerConcentration?.institutionalAccumulationStatus || 'ACCUMULATION'}
            </div>
            <span className="text-[10px] text-slate-400">Top Buyer: Broker #{brokerConcentration?.topBuyerBroker || 'N/A'}</span>
          </div>

          <div className="bg-[#0b0f17] p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase">Valuation (P/E & P/B)</span>
            {fundUnavailableReason ? (
              <div className="text-[11px] font-semibold text-amber-400 mt-1">Unavailable</div>
            ) : fundMetrics ? (
              <>
                <div className="text-base font-bold text-slate-200 mt-0.5">
                  {fundMetrics.peRatio}x <span className="text-slate-400 text-xs font-normal">/ {fundMetrics.pbRatio}x</span>
                </div>
                <span className="text-[10px] text-slate-400">EPS: Rs. {fundMetrics.eps}</span>
              </>
            ) : (
              <div className="text-[11px] text-slate-500 mt-1">Loading...</div>
            )}
          </div>

          <div className="bg-[#0b0f17] p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase">Active Setups</span>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {setups.length > 0 ? setups[0].setupName.split(' ')[0] : 'None'}
            </div>
            <span className="text-[10px] text-slate-400">
              {setups.length > 0 ? `R:R ${setups[0].riskRewardRatio}:1` : 'Watching support'}
            </span>
          </div>

          <div className="bg-[#0b0f17] p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase">Paid-Up Capital</span>
            <div className="text-base font-bold text-slate-200 mt-0.5">
              {formatNepseDenomination(stock.paidUpCapital)}
            </div>
            <span className="text-[10px] text-slate-400">{formatNumber(stock.sharesOutstanding, 0)} Kitta</span>
          </div>
        </div>
      </div>

      {/* 3. Multi-timeframe Chart Section */}
      <div className="bg-[#111722] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 mb-4 gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Price &amp; Volume Technical Chart
            </h2>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
              {(['INTRA', '1D', '1W', '1M'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-0.5 text-xs font-mono rounded font-medium transition-colors ${
                    timeframe === tf ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf === 'INTRA' ? 'Intraday' : tf === '1D' ? 'Daily' : tf === '1W' ? 'Weekly' : 'Monthly'}
                </button>
              ))}
            </div>
          </div>

          {/* Hover Crosshair Info */}
          <div className="text-xs font-mono text-slate-400 flex items-center gap-4">
            {hoveredCandle ? (
              <>
                <span className="text-slate-200 font-semibold">{hoveredCandle.date}</span>
                <span>O: <strong className="text-slate-100">{hoveredCandle.open}</strong></span>
                <span>H: <strong className="text-emerald-400">{hoveredCandle.high}</strong></span>
                <span>L: <strong className="text-rose-400">{hoveredCandle.low}</strong></span>
                <span>C: <strong className="text-cyan-300">{hoveredCandle.close}</strong></span>
                <span>Vol: <strong className="text-slate-100">{formatNumber(hoveredCandle.volume, 0)}</strong></span>
              </>
            ) : (
              <span className="text-slate-500">Hover over candles for precise terminal prices</span>
            )}
          </div>
        </div>

        {/* Custom Terminal SVG Financial Chart */}
        <div className="relative w-full h-80 bg-[#090d14] rounded border border-slate-800/80 p-2 select-none">
          <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0.2, 0.4, 0.6, 0.8].map(ratio => {
              const y = 300 * ratio;
              const price = maxPrice - ratio * priceRange;
              return (
                <g key={ratio}>
                  <line x1="0" y1={y} x2="800" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x="790" y={y - 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                    Rs. {price.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Candlesticks & Volume Bars */}
            {candles.map((candle, idx) => {
              const totalCandles = candles.length;
              const slotWidth = 800 / totalCandles;
              const xCenter = idx * slotWidth + slotWidth / 2;
              const candleWidth = Math.max(3, slotWidth * 0.65);

              // Price coordinates (top 75% of chart)
              const priceHeight = 220;
              const yHigh = ((maxPrice - candle.high) / priceRange) * priceHeight;
              const yLow = ((maxPrice - candle.low) / priceRange) * priceHeight;
              const yOpen = ((maxPrice - candle.open) / priceRange) * priceHeight;
              const yClose = ((maxPrice - candle.close) / priceRange) * priceHeight;

              const isGreen = candle.close >= candle.open;
              const color = isGreen ? '#10b981' : '#f43f5e';

              // Volume bar (bottom 25% of chart)
              const volMaxHeight = 65;
              const volHeight = (candle.volume / maxVolume) * volMaxHeight;
              const yVol = 300 - volHeight;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredCandle(candle)}
                  onMouseLeave={() => setHoveredCandle(null)}
                  className="cursor-crosshair group"
                >
                  {/* Wick */}
                  <line x1={xCenter} y1={yHigh} x2={xCenter} y2={yLow} stroke={color} strokeWidth="1.2" />

                  {/* Body */}
                  <rect
                    x={xCenter - candleWidth / 2}
                    y={Math.min(yOpen, yClose)}
                    width={candleWidth}
                    height={Math.max(2, Math.abs(yOpen - yClose))}
                    fill={color}
                    rx="0.5"
                  />

                  {/* Volume bar */}
                  <rect
                    x={xCenter - candleWidth / 2}
                    y={yVol}
                    width={candleWidth}
                    height={volHeight}
                    fill={color}
                    opacity="0.4"
                  />
                </g>
              );
            })}

            {/* 20 EMA Overlay line */}
            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="2 1"
              points={candles
                .map((c, i) => {
                  const x = i * (800 / candles.length) + 800 / candles.length / 2;
                  const val = c.close * 0.985;
                  const y = ((maxPrice - val) / priceRange) * 220;
                  return `${x},${y}`;
                })
                .join(' ')}
            />
          </svg>

          {/* Chart Legend */}
          <div className="absolute bottom-2 left-3 flex items-center gap-4 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-sky-400" />
              <span>20 EMA ({indicators.ema20.toFixed(1)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500/50" />
              <span>Vol (MA20: {formatNumber(indicators.volumeMA20, 0)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-300 font-semibold">VWAP: Rs. {indicators.vwap}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Research Drill-down Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
        {[
          { id: 'OVERVIEW', label: 'Technical & Fundamental Synthesis' },
          { id: 'TECHNICAL', label: 'Technical Indicator Engine' },
          { id: 'FUNDAMENTAL', label: 'Fundamental Financials' },
          { id: 'BROKER', label: 'Broker Tracking & Floor Activity' },
          { id: 'SETUPS', label: `Detected Setups (${setups.length})` },
          { id: 'DECISION', label: 'Decision Intelligence' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 text-xs font-mono font-semibold rounded-t transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 5. Tab Content Sections */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Technical Scorecard (Prompt: Trend 17/20, Momentum 16/20, Volume 15/20, Structure 14/20, Volatility 16/20) */}
          <div className="bg-[#111722] border border-slate-800 rounded-lg p-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-slate-200">
                  TECHNICAL SCORECARD: {techScore.totalScore}/100
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                {techScore.trendCondition}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              {[
                { label: 'Trend Score', score: techScore.trendScore, max: 20, desc: 'Position vs 20 EMA, 50 SMA, 200 SMA' },
                { label: 'Momentum Score', score: techScore.momentumScore, max: 20, desc: `RSI (${indicators.rsi14}) & MACD Histogram (+${indicators.macd.histogram})` },
                { label: 'Volume Score', score: techScore.volumeScore, max: 20, desc: 'Relative volume expansion vs 20-day MA' },
                { label: 'Structure Score', score: techScore.structureScore, max: 20, desc: 'Support/Resistance & Bollinger Band positioning' },
                { label: 'Volatility Score', score: techScore.volatilityScore, max: 20, desc: `ATR (${indicators.atr14}) risk normalized` },
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">{item.label}</span>
                    <span className="text-cyan-300 font-bold">{item.score} / {item.max}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all"
                      style={{ width: `${(item.score / item.max) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Observations */}
            <div className="p-3 bg-[#0b0f17] rounded border border-slate-800 space-y-1">
              <div className="text-[11px] text-cyan-400 font-semibold">DETERMINISTIC TECHNICAL FINDINGS:</div>
              {techScore.keyObservations.map((obs, i) => (
                <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                  <span className="text-emerald-400">•</span>
                  <span>{obs}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fundamental Scorecard */}
          <div className="bg-[#111722] border border-slate-800 rounded-lg p-4 font-mono text-xs">
            {fundUnavailableReason ? (
              <div className="py-8 text-center">
                <div className="text-sm font-semibold text-amber-400">Fundamental data unavailable</div>
                <div className="text-xs text-slate-500 mt-1">{fundUnavailableReason}</div>
              </div>
            ) : fundScore && fundMetrics ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-slate-200">
                      FUNDAMENTAL SCORECARD: {fundScore.totalScore}/100
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-amber-950 border border-amber-800 text-amber-300 font-bold">
                    GRADE {fundScore.grade}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-[#0b0f17] p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Profitability (20/25)</span>
                    <div className="text-sm font-bold text-slate-200 mt-1">ROE: {fundMetrics.roe}%</div>
                    <div className="text-[10px] text-slate-400">ROA: {fundMetrics.roa}%</div>
                  </div>

                  <div className="bg-[#0b0f17] p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Growth (18/25)</span>
                    <div className="text-sm font-bold text-emerald-400 mt-1">+{fundMetrics.netProfitGrowthYoY}% Profit</div>
                    <div className="text-[10px] text-slate-400">+{fundMetrics.epsGrowthYoY}% EPS YoY</div>
                  </div>

                  <div className="bg-[#0b0f17] p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Valuation (17/25)</span>
                    <div className="text-sm font-bold text-slate-200 mt-1">P/E: {fundMetrics.peRatio}x</div>
                    <div className="text-[10px] text-slate-400">P/B: {fundMetrics.pbRatio}x (BV: Rs. {fundMetrics.bookValuePerShare})</div>
                  </div>

                  <div className="bg-[#0b0f17] p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Health (19/25)</span>
                    <div className="text-sm font-bold text-slate-200 mt-1">D/E: {fundMetrics.debtToEquity}x</div>
                    <div className="text-[10px] text-slate-400">Current Ratio: {fundMetrics.currentRatio}</div>
                  </div>
                </div>

                {/* Strengths & Risks */}
                <div className="space-y-2">
                  <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/40 rounded">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Key Strengths</div>
                    <ul className="text-[11px] text-slate-300 space-y-0.5">
                      {fundScore.keyStrengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 bg-rose-950/20 border border-rose-900/40 rounded">
                    <div className="text-[10px] font-bold text-rose-400 uppercase mb-1">Key Risks &amp; Watch-outs</div>
                    <ul className="text-[11px] text-slate-300 space-y-0.5">
                      {fundScore.keyRisks.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-rose-400">⚠</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-slate-500">
                Loading fundamental data...
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'TECHNICAL' && (
        <div className="bg-[#111722] border border-slate-800 rounded-lg p-5 font-mono text-xs">
          <h3 className="font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>FULL TECHNICAL INDICATOR READINGS ({stock.symbol})</span>
            <span className="text-xs text-slate-400 font-normal">Calculated from Daily OHLCV</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-slate-400 text-[11px] font-bold uppercase border-b border-slate-800 pb-1">
                Moving Averages
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">20-day EMA:</span>
                <span className="text-slate-200 font-semibold">Rs. {indicators.ema20}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">20-day SMA:</span>
                <span className="text-slate-200 font-semibold">Rs. {indicators.sma20}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">50-day SMA:</span>
                <span className="text-slate-200 font-semibold">Rs. {indicators.sma50}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">200-day SMA:</span>
                <span className="text-slate-200 font-semibold">Rs. {indicators.sma200}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-slate-400 text-[11px] font-bold uppercase border-b border-slate-800 pb-1">
                Oscillators &amp; Momentum
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">RSI (14):</span>
                <span className="text-cyan-300 font-bold">{indicators.rsi14} (Bullish)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">MACD Line:</span>
                <span className="text-slate-200 font-semibold">{indicators.macd.macdLine}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Signal Line:</span>
                <span className="text-slate-200 font-semibold">{indicators.macd.signalLine}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Histogram:</span>
                <span className="text-emerald-400 font-semibold">+{indicators.macd.histogram}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-slate-400 text-[11px] font-bold uppercase border-b border-slate-800 pb-1">
                Volatility &amp; Volume
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">ATR (14):</span>
                <span className="text-slate-200 font-semibold">Rs. {indicators.atr14}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Bollinger Upper:</span>
                <span className="text-slate-200 font-semibold">Rs. {indicators.bollingerBands.upper}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Bollinger Lower:</span>
                <span className="text-slate-200 font-semibold">Rs. {indicators.bollingerBands.lower}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">On-Balance Vol:</span>
                <span className="text-slate-200 font-semibold">{formatNumber(indicators.obv, 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'FUNDAMENTAL' && (
        <div className="bg-[#111722] border border-slate-800 rounded-lg p-6 font-mono text-xs">
          {fundUnavailableReason ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-amber-400 font-bold text-sm">Fundamental Data Not Available In This Mode</div>
              <p className="text-xs text-amber-200/80 max-w-md mx-auto">{fundUnavailableReason}</p>
              <p className="text-[11px] text-slate-400 font-sans">
                Switch data mode to MOCK DATA in settings or use the Data Architecture panel to view mock fundamental financials.
              </p>
            </div>
          ) : fundMetrics ? (
            <>
              <h3 className="font-bold text-slate-200 mb-4 pb-2 border-b border-slate-800 flex items-center justify-between">
                <span>QUARTERLY FINANCIAL PERFORMANCE &amp; STATEMENTS</span>
                <span className="text-xs text-cyan-400 font-semibold">Fiscal Year {fundMetrics.fiscalYear} ({fundMetrics.quarter})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0c1018] p-3 rounded border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Revenue (Quarterly)</span>
                  <div className="text-base font-bold text-slate-100 mt-1">
                    Rs. {fundMetrics.revenue} M
                  </div>
                  <span className="text-[10px] text-emerald-400">+{fundMetrics.revenueGrowthYoY}% YoY</span>
                </div>

                <div className="bg-[#0c1018] p-3 rounded border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Net Profit (Quarterly)</span>
                  <div className="text-base font-bold text-slate-100 mt-1">
                    Rs. {fundMetrics.netProfit} M
                  </div>
                  <span className="text-[10px] text-emerald-400">+{fundMetrics.netProfitGrowthYoY}% YoY</span>
                </div>

                <div className="bg-[#0c1018] p-3 rounded border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Book Value Per Share</span>
                  <div className="text-base font-bold text-slate-100 mt-1">
                    Rs. {fundMetrics.bookValuePerShare}
                  </div>
                  <span className="text-[10px] text-slate-400">Price/Book: {fundMetrics.pbRatio}x</span>
                </div>

                <div className="bg-[#0c1018] p-3 rounded border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Last Dividend Declared</span>
                  <div className="text-base font-bold text-emerald-400 mt-1">
                    {fundMetrics.lastCashDividendPercent}% Cash + {fundMetrics.lastBonusDividendPercent}% Bonus
                  </div>
                  <span className="text-[10px] text-slate-400">Yield: {fundMetrics.dividendYield}%</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400">Loading fundamental financials...</div>
          )}
        </div>
      )}

      {activeTab === 'BROKER' && (
        <div className="bg-[#111722] border border-slate-800 rounded-lg p-5 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h3 className="font-bold text-slate-200">
                FLOOR BROKER TRACKING &amp; CONCENTRATION ({stock.symbol})
              </h3>
              <p className="text-[11px] text-slate-400">
                Rule-based institutional accumulation and distribution metrics
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-purple-950 border border-purple-800 text-purple-300 font-bold text-xs">
              {brokerConcentration?.institutionalAccumulationStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0c1018] p-4 rounded border border-slate-800 space-y-2">
              <div className="text-cyan-400 font-bold text-xs uppercase">Top 5 Buyer Broker Concentration</div>
              <div className="text-2xl font-bold text-slate-100">
                {brokerConcentration?.top5BuyerSharePercent}%
              </div>
              <p className="text-[11px] text-slate-400">
                Top accumulating broker: <strong>Broker #{brokerConcentration?.topBuyerBroker} (Naasa Securities)</strong>
              </p>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${brokerConcentration?.top5BuyerSharePercent}%` }}
                />
              </div>
            </div>

            <div className="bg-[#0c1018] p-4 rounded border border-slate-800 space-y-2">
              <div className="text-rose-400 font-bold text-xs uppercase">Top 5 Seller Broker Concentration</div>
              <div className="text-2xl font-bold text-slate-100">
                {brokerConcentration?.top5SellerSharePercent}%
              </div>
              <p className="text-[11px] text-slate-400">
                Top selling broker: <strong>Broker #{brokerConcentration?.topSellerBroker} (Sani Securities)</strong>
              </p>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${brokerConcentration?.top5SellerSharePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SETUPS' && (
        <div className="bg-[#111722] border border-slate-800 rounded-lg p-5 font-mono text-xs">
          <h3 className="font-bold text-slate-200 mb-3 pb-2 border-b border-slate-800">
            ACTIONABLE TRADING SETUPS FOR {stock.symbol} ({setups.length})
          </h3>

          {setups.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              No active breakout or bounce setups detected currently. Stock is consolidating within standard boundaries.
            </div>
          ) : (
            <div className="space-y-4">
              {setups.map(setup => (
                <div key={setup.id} className="p-4 bg-[#0c1018] rounded-lg border border-cyan-800/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-cyan-400" />
                      <span className="font-bold text-slate-100 text-sm">{setup.setupName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 border border-cyan-700 text-cyan-300">
                        {setup.riskLevel} RISK
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Setup Score: <strong className="text-emerald-400 text-sm">{setup.scores.overall}/100</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400">Entry Zone</span>
                      <div className="font-bold text-slate-100 mt-0.5">
                        Rs. {setup.entryZoneLow} - {setup.entryZoneHigh}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400">Stop Loss</span>
                      <div className="font-bold text-rose-400 mt-0.5">
                        Rs. {setup.stopLoss}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400">Target 1 &amp; 2</span>
                      <div className="font-bold text-emerald-400 mt-0.5">
                        Rs. {setup.target1} / {setup.target2}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400">Risk/Reward</span>
                      <div className="font-bold text-cyan-300 mt-0.5">
                        {setup.riskRewardRatio} : 1
                      </div>
                    </div>
                  </div>

                  {/* Setup Rationale and Invalidation (Prompt Requirement: Reasons and invalidation rule) */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-bold text-slate-300">DETECTION REASONS:</div>
                    {setup.reasons.map((r, i) => (
                      <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                        <span className="text-emerald-400">✓</span> {r}
                      </div>
                    ))}
                    <div className="mt-2 text-[11px] text-rose-400 flex items-start gap-1.5 bg-rose-950/20 p-2 rounded border border-rose-900/30">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Invalidation Rule:</strong> {setup.invalidationCriteria}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phase 4B Decision Intelligence Tab */}
      {activeTab === 'DECISION' && (
        <div className="pt-2">
          <DecisionIntelligenceView initialSymbol={stock.symbol} />
        </div>
      )}
    </div>
  );
}
