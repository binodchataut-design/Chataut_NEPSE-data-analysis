import React, { useState } from 'react';
import { BookOpen, Plus, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { formatNPR, formatPercent } from '../../utils/formatters';

interface JournalEntry {
  id: string;
  symbol: string;
  setupName: string;
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  status: 'OPEN' | 'TARGET_HIT' | 'STOPPED_OUT' | 'MANUAL_EXIT';
  thesis: string;
  outcomeNotes: string;
  lessonsLearned: string;
  pnlNpr?: number;
  pnlPercent?: number;
}

const INITIAL_JOURNAL: JournalEntry[] = [
  {
    id: 'j-1',
    symbol: 'CHCL',
    setupName: 'Consolidation Breakout + Volume',
    entryDate: '2026-08-15',
    entryPrice: 535,
    quantity: 600,
    status: 'OPEN',
    thesis: 'Chilime consolidated for 6 weeks between 500-530 NPR. High institutional volume from broker #58 confirmed breakout above 50-day SMA.',
    outcomeNotes: 'Position currently in profit at 548 NPR (+2.4%). Stop moved to breakeven at 535 NPR.',
    lessonsLearned: 'Patience in waiting for the daily volume candle to close above resistance proved essential.',
    pnlNpr: 7800,
    pnlPercent: 2.43,
  },
  {
    id: 'j-2',
    symbol: 'SHIVM',
    setupName: '20 EMA Pullback Bounce',
    entryDate: '2026-07-20',
    exitDate: '2026-08-10',
    entryPrice: 560,
    exitPrice: 625,
    quantity: 500,
    status: 'TARGET_HIT',
    thesis: 'Classic pullback to rising 20 EMA in strong manufacturing sector uptrend. RSI held 50 support line.',
    outcomeNotes: 'Target 1 hit at 625 NPR cleanly. Exited 100% position on heavy upper wick.',
    lessonsLearned: 'Holding through minor intraday noise was rewarded by disciplined stop-loss placement below swing low.',
    pnlNpr: 32500,
    pnlPercent: 11.6,
  },
  {
    id: 'j-3',
    symbol: 'NABIL',
    setupName: 'Support Bounce',
    entryDate: '2026-06-10',
    exitDate: '2026-06-25',
    entryPrice: 540,
    exitPrice: 522,
    quantity: 400,
    status: 'STOPPED_OUT',
    thesis: 'Attempted to buy historical support line before Q4 results announcement.',
    outcomeNotes: 'Sector-wide banking pressure caused stop loss trigger at 522 NPR. Closed automatically without hesitation.',
    lessonsLearned: 'Do not front-run earnings in banking sector when sector breadth is below 50-day moving average.',
    pnlNpr: -7200,
    pnlPercent: -3.33,
  },
];

export function TradeJournalView({ onSelectStock }: { onSelectStock: (symbol: string) => void }) {
  const [entries, setEntries] = useState<JournalEntry[]>(INITIAL_JOURNAL);
  const [showModal, setShowModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('HDL');
  const [newSetup, setNewSetup] = useState('Breakout + Volume');
  const [newEntryPrice, setNewEntryPrice] = useState(1850);
  const [newQty, setNewQty] = useState(100);
  const [newThesis, setNewThesis] = useState('');
  const [newLesson, setNewLesson] = useState('');

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: JournalEntry = {
      id: `j-${Date.now()}`,
      symbol: newSymbol.toUpperCase(),
      setupName: newSetup,
      entryDate: new Date().toISOString().split('T')[0],
      entryPrice: Number(newEntryPrice),
      quantity: Number(newQty),
      status: 'OPEN',
      thesis: newThesis,
      outcomeNotes: 'Position recently initiated.',
      lessonsLearned: newLesson || 'Stick to pre-defined stop loss without emotional tampering.',
      pnlNpr: 0,
      pnlPercent: 0,
    };
    setEntries([newEntry, ...entries]);
    setShowModal(false);
    setNewThesis('');
    setNewLesson('');
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>HISTORICAL TRADE JOURNAL &amp; DECISION AUDIT</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Audit why setups were entered, lessons learned, and execution discipline tracking
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Record New Trade Decision
        </button>
      </div>

      {/* Journal Cards */}
      <div className="space-y-4">
        {entries.map(entry => (
          <div
            key={entry.id}
            className="bg-[#111722] border border-slate-800 rounded-lg p-5 space-y-3 hover:border-slate-700 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onSelectStock(entry.symbol)}
                  className="text-base font-bold text-cyan-400 hover:underline"
                >
                  {entry.symbol}
                </button>
                <span className="px-2 py-0.5 rounded text-[11px] bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
                  {entry.setupName}
                </span>
                <span className="text-slate-500 text-[11px]">
                  Entry: {entry.entryDate} {entry.exitDate && `| Exit: ${entry.exitDate}`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    entry.status === 'TARGET_HIT'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : entry.status === 'STOPPED_OUT'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  }`}
                >
                  {entry.status}
                </span>
                {entry.pnlNpr !== undefined && (
                  <span
                    className={`font-bold text-sm ${
                      entry.pnlNpr >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {entry.pnlNpr >= 0 ? '+' : ''}{formatNPR(entry.pnlNpr, false)} ({entry.pnlPercent}%)
                  </span>
                )}
              </div>
            </div>

            {/* Core trade metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="text-slate-400">
                Entry Price: <span className="text-slate-100 font-semibold">Rs. {entry.entryPrice}</span>
              </div>
              <div className="text-slate-400">
                Exit Price: <span className="text-slate-100 font-semibold">{entry.exitPrice ? `Rs. ${entry.exitPrice}` : 'Open'}</span>
              </div>
              <div className="text-slate-400">
                Position Size: <span className="text-slate-100 font-semibold">{entry.quantity} Kitta</span>
              </div>
              <div className="text-slate-400">
                Capital Deployed: <span className="text-slate-100 font-semibold">{formatNPR(entry.entryPrice * entry.quantity, false)}</span>
              </div>
            </div>

            {/* Qualitative analysis: Thesis & Lessons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="bg-[#0b0f17] p-3 rounded border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-cyan-400 mb-1">
                  Why Stock Was Selected (Thesis)
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">{entry.thesis}</p>
              </div>

              <div className="bg-[#0b0f17] p-3 rounded border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-amber-400 mb-1">
                  Post-Trade Audit &amp; Lessons Learned
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">{entry.lessonsLearned}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Record Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111722] border border-slate-700 rounded-lg max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-slate-100 text-sm mb-4 pb-2 border-b border-slate-800">
              Record Trading Decision &amp; Thesis
            </h3>
            <form onSubmit={handleAddEntry} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Scrip Ticker</label>
                  <input
                    type="text"
                    value={newSymbol}
                    onChange={e => setNewSymbol(e.target.value)}
                    className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Setup Type</label>
                  <input
                    type="text"
                    value={newSetup}
                    onChange={e => setNewSetup(e.target.value)}
                    className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Entry Price (NPR)</label>
                  <input
                    type="number"
                    value={newEntryPrice}
                    onChange={e => setNewEntryPrice(Number(e.target.value))}
                    className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Quantity (Kitta)</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={e => setNewQty(Number(e.target.value))}
                    className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Entry Thesis (Detailed Rationale)</label>
                <textarea
                  value={newThesis}
                  onChange={e => setNewThesis(e.target.value)}
                  placeholder="Record why this setup met your criteria..."
                  className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100 h-20"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Rules &amp; Discipline Notes</label>
                <input
                  type="text"
                  value={newLesson}
                  onChange={e => setNewLesson(e.target.value)}
                  placeholder="e.g. Pre-planned stop at 1810 NPR."
                  className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Commit Journal Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
