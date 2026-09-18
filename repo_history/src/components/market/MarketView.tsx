import { useState, useEffect } from 'react';
import { MarketIndex, Sector, MarketBreadth } from '../../types';
import { marketService } from '../../services/marketService';
import { formatNepseDenomination, formatPercent, formatNumber } from '../../utils/formatters';
import { TrendingUp, Activity, BarChart2, PieChart } from 'lucide-react';

export function MarketView({ onSelectStock }: { onSelectStock: (symbol: string) => void }) {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [breadth, setBreadth] = useState<MarketBreadth | null>(null);

  useEffect(() => {
    Promise.all([
      marketService.getMarketIndices(),
      marketService.getSectors(),
      marketService.getMarketBreadth(),
    ]).then(([idx, sec, brd]) => {
      setIndices(idx);
      setSectors(sec);
      setBreadth(brd);
    });
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto font-mono text-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span>NEPSE MARKET CONDITION &amp; SECTOR INTELLIGENCE</span>
        </h1>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Comprehensive market breadth, sub-index performance, and turnover distribution
        </p>
      </div>

      {/* Indices Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {indices.map((idx, index) => (
          <div key={`${idx.symbol}-${idx.timestamp || index}`} className="bg-[#111722] border border-slate-800 rounded-lg p-3.5">
            <div className="text-slate-400 text-[11px]">{idx.name}</div>
            <div className="text-xl font-bold text-slate-100 my-1">{idx.currentValue.toFixed(2)}</div>
            <div className={`text-xs font-semibold ${idx.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {idx.change >= 0 ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)} ({formatPercent(idx.changePercent)})
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
              <span>Turnover:</span>
              <span className="text-slate-200">{formatNepseDenomination(idx.turnover)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sector Sub-Indices Table */}
      <div className="bg-[#111722] border border-slate-800 rounded-lg p-4">
        <h2 className="font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2 text-xs">
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <span>Sector Indices Breakdown (All Sectors)</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase bg-slate-900/40">
                <th className="py-2.5 px-3">Sector Name</th>
                <th className="py-2.5 px-3 text-right">Index Value</th>
                <th className="py-2.5 px-3 text-right">Change</th>
                <th className="py-2.5 px-3 text-right">% Change</th>
                <th className="py-2.5 px-3 text-right">Daily Turnover</th>
                <th className="py-2.5 px-3 text-right">Volume</th>
                <th className="py-2.5 px-3 text-right">Market Cap Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sectors.map(sec => (
                <tr key={sec.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{sec.name}</td>
                  <td className="py-2.5 px-3 text-right text-slate-100 font-bold">{sec.indexValue.toFixed(2)}</td>
                  <td className={`py-2.5 px-3 text-right font-semibold ${sec.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {sec.change >= 0 ? '+' : ''}{sec.change.toFixed(2)}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold ${sec.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatPercent(sec.changePercent)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-cyan-300 font-medium">
                    {formatNepseDenomination(sec.turnover)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {formatNumber(sec.volume, 0)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {sec.weightPercent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
