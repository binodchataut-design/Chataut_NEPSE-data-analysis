import React, { useState, useEffect } from 'react';
import { WatchlistItem, WatchlistStatus } from '../../types';
import { portfolioService } from '../../services/portfolioService';
import { stockService } from '../../services/stockService';
import { Eye, Plus, Trash2, Edit2, Check, ArrowRight, ExternalLink } from 'lucide-react';
import { formatNPR } from '../../utils/formatters';

export function WatchlistView({ onSelectStock }: { onSelectStock: (symbol: string) => void }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('NICA');
  const [newThesis, setNewThesis] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    const list = await portfolioService.getWatchlist();
    setItems(list);
  };

  const handleStatusChange = async (id: string, newStatus: WatchlistStatus) => {
    await portfolioService.updateWatchlistStatus(id, newStatus);
    loadWatchlist();
  };

  const handleRemove = async (id: string) => {
    await portfolioService.removeFromWatchlist(id);
    loadWatchlist();
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;
    await portfolioService.addToWatchlist(newSymbol.trim().toUpperCase(), newThesis, newNotes);
    setNewThesis('');
    setNewNotes('');
    setShowAddModal(false);
    loadWatchlist();
  };

  const statuses: WatchlistStatus[] = [
    'WATCHING',
    'SETUP_FORMING',
    'READY',
    'ENTERED',
    'INVALIDATED',
    'EXITED',
  ];

  const getStatusBadge = (status: WatchlistStatus) => {
    switch (status) {
      case 'READY':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'SETUP_FORMING':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'ENTERED':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'INVALIDATED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'EXITED':
        return 'bg-slate-700 text-slate-300 border-slate-600';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>PERSONAL NEPSE WATCHLIST &amp; THESIS TRACKER</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Stage monitoring from setup formation through execution and invalidation
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Scrip to Watchlist
        </button>
      </div>

      {/* Watchlist Table */}
      <div className="bg-[#111722] border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase bg-slate-900/50">
                <th className="py-3 px-4">Scrip / Sector</th>
                <th className="py-3 px-3 text-right">LTP (NPR)</th>
                <th className="py-3 px-3 text-center">Status Stage</th>
                <th className="py-3 px-3">Target Price</th>
                <th className="py-3 px-3">Stop Loss</th>
                <th className="py-3 px-4">Thesis &amp; Notes</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => onSelectStock(item.symbol)}
                      className="font-bold text-cyan-400 hover:underline text-sm block"
                    >
                      {item.symbol}
                    </button>
                    <span className="text-[11px] text-slate-400">{item.companyName}</span>
                  </td>

                  <td className="py-3.5 px-3 text-right font-bold text-slate-100">
                    Rs. {item.currentPrice.toFixed(1)}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <select
                      value={item.status}
                      onChange={e => handleStatusChange(item.id, e.target.value as WatchlistStatus)}
                      className={`px-2 py-1 rounded text-[11px] font-bold border cursor-pointer bg-slate-900 ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {statuses.map(st => (
                        <option key={st} value={st} className="bg-slate-900 text-slate-200">
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="py-3.5 px-3 font-semibold text-emerald-400">
                    {item.targetPrice ? `Rs. ${item.targetPrice}` : '—'}
                  </td>

                  <td className="py-3.5 px-3 font-semibold text-rose-400">
                    {item.stopLossPrice ? `Rs. ${item.stopLossPrice}` : '—'}
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="text-slate-200 text-xs truncate">{item.thesis}</div>
                    <div className="text-slate-500 text-[10px] mt-0.5 truncate">{item.notes}</div>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectStock(item.symbol)}
                        className="p-1 text-slate-400 hover:text-cyan-300"
                        title="Stock Research"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111722] border border-slate-700 rounded-lg max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-slate-100 text-sm mb-4 pb-2 border-b border-slate-800">
              Add Scrip to Personal Watchlist
            </h3>
            <form onSubmit={handleAddStock} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">NEPSE Symbol (Ticker)</label>
                <input
                  type="text"
                  value={newSymbol}
                  onChange={e => setNewSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. NICA, HDL, UPPER, CIT"
                  className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Investment / Trading Thesis</label>
                <textarea
                  value={newThesis}
                  onChange={e => setNewThesis(e.target.value)}
                  placeholder="e.g. Stage 1 base breakout with increasing institutional turnover."
                  className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 h-20"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Trigger Notes &amp; Conditions</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="e.g. Watch daily close above 445 NPR with > 200k volume."
                  className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
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
                  Save to Watchlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
