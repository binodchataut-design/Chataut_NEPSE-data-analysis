import { useState, useEffect } from 'react';
import { Search, Sliders, Database, Clock } from 'lucide-react';
import { MarketIndex } from '../../types';
import { marketService } from '../../services/marketService';
import { stockService } from '../../services/stockService';
import { formatPercent } from '../../utils/formatters';
import { DataSourceIndicator } from './DataSourceIndicator';

interface HeaderProps {
  onSelectStock: (symbol: string) => void;
  onNavigate: (section: string) => void;
}

export function Header({ onSelectStock, onNavigate }: HeaderProps) {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ symbol: string; name: string; ltp: number }>>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [nepalTime, setNepalTime] = useState('');

  useEffect(() => {
    marketService.getMarketIndices().then(setIndices).catch(() => setIndices([]));

    // Update Nepal Time clock (UTC + 5:45)
    const updateTime = () => {
      const now = new Date();
      // Calculate NPT offset: 5 hours 45 mins = 345 mins
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const nptDate = new Date(utc + 345 * 60000);
      const timeStr = nptDate.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setNepalTime(`${timeStr} NPT`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const results = await stockService.searchStocks(query);
    setSearchResults(results.map(r => ({ symbol: r.symbol, name: r.name, ltp: r.ltp })));
    setShowSearchDropdown(true);
  };

  const handlePickStock = (symbol: string) => {
    onSelectStock(symbol);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#0d121d]/90 backdrop-blur sticky top-0 z-30 flex flex-col">
      {/* Top Ticker Ribbon */}
      <div className="border-b border-slate-800/60 bg-[#090d15] px-4 py-1.5 flex items-center justify-between text-xs font-mono overflow-x-auto gap-6 select-none scrollbar-none">
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 font-semibold tracking-wider">NEPSE REALM:</span>
          </div>

          {indices.map((idx, index) => (
            <div key={`${idx.symbol}-${idx.timestamp || index}`} className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">{idx.name}:</span>
              <span className="text-slate-100 font-semibold">{idx.currentValue.toFixed(2)}</span>
              <span
                className={`font-semibold flex items-center ${
                  idx.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {idx.change >= 0 ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)} ({formatPercent(idx.changePercent)})
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 shrink-0 text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-300">{nepalTime}</span>
            <span className="text-amber-400/90 font-medium ml-1">[REGULAR SESSION CLOSED]</span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-5 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 max-w-xl relative">
          {/* Quick Scrip Finder */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
              placeholder="Search scrip (e.g. CHCL, NABIL, SHIVM, UPPER, NICA)... [Press /]"
              className="w-full bg-[#131926] border border-slate-700/70 rounded-md pl-9 pr-12 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 font-mono transition-colors"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
              /
            </kbd>

            {/* Dropdown Results */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#111724] border border-slate-700 rounded-md shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                <div className="p-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-slate-900/50">
                  Listed NEPSE Scrips ({searchResults.length})
                </div>
                {searchResults.map(stock => (
                  <button
                    key={stock.symbol}
                    onClick={() => handlePickStock(stock.symbol)}
                    className="w-full px-3 py-2 text-left hover:bg-cyan-950/40 border-b border-slate-800/40 last:border-b-0 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <span className="font-mono font-bold text-cyan-300 group-hover:text-cyan-200 text-xs">
                        {stock.symbol}
                      </span>
                      <span className="text-slate-400 text-xs ml-2 truncate">{stock.name}</span>
                    </div>
                    <span className="font-mono text-xs text-slate-300">Rs. {stock.ltp.toFixed(1)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls & Data Mode Indicator */}
        <div className="flex items-center gap-3">
          <DataSourceIndicator />

          <button
            onClick={() => onNavigate('settings')}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            title="System Settings & Scoring Weights"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('data')}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            title="Data Architecture & Relational Models"
          >
            <Database className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
