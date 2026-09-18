import React, { useState, useEffect } from 'react';
import { PortfolioPosition, PortfolioSummary } from '../../types';
import { portfolioService } from '../../services/portfolioService';
import { Briefcase, TrendingUp, TrendingDown, Plus, Trash2, PieChart } from 'lucide-react';
import { formatNPR, formatPercent, formatNepseDenomination, formatNumber } from '../../utils/formatters';

export function PortfolioView({ onSelectStock }: { onSelectStock: (symbol: string) => void }) {
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('CIT');
  const [newQty, setNewQty] = useState(100);
  const [newPrice, setNewPrice] = useState(2250);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    const pos = await portfolioService.getPortfolioPositions();
    const sum = await portfolioService.getPortfolioSummary();
    setPositions(pos);
    setSummary(sum);
  };

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim() || newQty <= 0 || newPrice <= 0) return;
    await portfolioService.addPosition(newSymbol.trim().toUpperCase(), Number(newQty), Number(newPrice));
    setShowAddModal(false);
    loadPortfolio();
  };

  const handleRemove = async (id: string) => {
    await portfolioService.removePosition(id);
    loadPortfolio();
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>PERSONAL NEPSE PORTFOLIO &amp; RISK ALLOCATION</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Holdings tracker with benchmark comparison, dividends, and position weights
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Manual Position
        </button>
      </div>

      {/* Portfolio Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-[#111722] border border-slate-800 rounded-lg p-4">
            <span className="text-slate-400 text-[11px] uppercase">Current Portfolio Value</span>
            <div className="text-xl font-bold text-slate-100 mt-1">
              {formatNPR(summary.totalCurrentValue)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Invested Capital: {formatNPR(summary.totalInvested)}
            </div>
          </div>

          <div className="bg-[#111722] border border-slate-800 rounded-lg p-4">
            <span className="text-slate-400 text-[11px] uppercase">Unrealized P/L</span>
            <div
              className={`text-xl font-bold mt-1 ${
                summary.totalUnrealizedPL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {summary.totalUnrealizedPL >= 0 ? '+' : ''}
              {formatNPR(summary.totalUnrealizedPL)} ({formatPercent(summary.totalUnrealizedPLPercent)})
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Cash Liquid Buffer: {formatNPR(summary.cashBalance)}
            </div>
          </div>

          <div className="bg-[#111722] border border-slate-800 rounded-lg p-4">
            <span className="text-slate-400 text-[11px] uppercase">Total Dividends Earned</span>
            <div className="text-xl font-bold text-cyan-300 mt-1">
              {formatNPR(summary.totalDividends)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Active Positions: {summary.positionsCount} Equities
            </div>
          </div>

          <div className="bg-[#111722] border border-slate-800 rounded-lg p-4">
            <span className="text-slate-400 text-[11px] uppercase">Benchmark Alpha vs NEPSE</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              +{Math.abs(summary.totalUnrealizedPLPercent - summary.nepseBenchmarkReturnPercent).toFixed(2)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              NEPSE Return: +{summary.nepseBenchmarkReturnPercent}%
            </div>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="bg-[#111722] border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase bg-slate-900/50">
                <th className="py-3 px-4">Scrip / Sector</th>
                <th className="py-3 px-3 text-right">Kitta (Qty)</th>
                <th className="py-3 px-3 text-right">Avg Purchase</th>
                <th className="py-3 px-3 text-right">Current LTP</th>
                <th className="py-3 px-3 text-right">Current Value</th>
                <th className="py-3 px-3 text-right">Unrealized P/L</th>
                <th className="py-3 px-3 text-right">Dividends</th>
                <th className="py-3 px-3 text-right">Allocation</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {positions.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onSelectStock(p.symbol)}
                      className="font-bold text-cyan-400 hover:underline text-sm block"
                    >
                      {p.symbol}
                    </button>
                    <span className="text-[10px] text-slate-400">{p.sectorName}</span>
                  </td>

                  <td className="py-3 px-3 text-right font-semibold text-slate-200">
                    {formatNumber(p.quantity, 0)}
                  </td>

                  <td className="py-3 px-3 text-right text-slate-300">
                    Rs. {p.averagePurchasePrice.toFixed(1)}
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-slate-100">
                    Rs. {p.currentPrice.toFixed(1)}
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-slate-200">
                    {formatNPR(p.currentValue, false)}
                  </td>

                  <td
                    className={`py-3 px-3 text-right font-bold ${
                      p.unrealizedPL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {p.unrealizedPL >= 0 ? '+' : ''}{formatNPR(p.unrealizedPL, false)}
                    <div className="text-[10px] font-normal">{formatPercent(p.unrealizedPLPercent)}</div>
                  </td>

                  <td className="py-3 px-3 text-right text-cyan-300">
                    {p.dividendReceived > 0 ? formatNPR(p.dividendReceived, false) : '—'}
                  </td>

                  <td className="py-3 px-3 text-right font-semibold text-slate-300">
                    {p.weightPercent}%
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="p-1 text-slate-400 hover:text-rose-400"
                      title="Remove position"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Position Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111722] border border-slate-700 rounded-lg max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-slate-100 text-sm mb-4 pb-2 border-b border-slate-800">
              Add Manual Equity Position
            </h3>
            <form onSubmit={handleAddPosition} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Scrip Ticker</label>
                <input
                  type="text"
                  value={newSymbol}
                  onChange={e => setNewSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Number of Shares (Kitta)</label>
                <input
                  type="number"
                  value={newQty}
                  onChange={e => setNewQty(Number(e.target.value))}
                  min="1"
                  className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Average Purchase Price (NPR)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={e => setNewPrice(Number(e.target.value))}
                  min="1"
                  step="0.1"
                  className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Record Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
