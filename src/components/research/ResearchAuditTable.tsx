import React, { useState } from 'react';
import {
  Table,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { ResearchResult, ResearchObservation } from '../../types/historicalResearch';
import { historicalResearchService } from '../../services/historicalResearchService';

interface ResearchAuditTableProps {
  result: ResearchResult;
}

export const ResearchAuditTable: React.FC<ResearchAuditTableProps> = ({ result }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [regimeFilter, setRegimeFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WINNERS' | 'LOSERS'>('ALL');
  const [sortField, setSortField] = useState<'DATE' | 'SYMBOL' | 'RETURN10D' | 'MFE10D'>('DATE');
  const [sortAsc, setSortAsc] = useState(false);

  const handleExportCSV = () => {
    const csvContent = historicalResearchService.exportToCSV(result);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${result.runConfig.runId}_backtest_audit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter and Sort observations
  const filteredObservations = result.observations.filter(obs => {
    // Search match
    if (searchTerm && !obs.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Regime match
    if (regimeFilter !== 'ALL' && obs.marketRegime !== regimeFilter) {
      return false;
    }
    // Outcome match (using primary horizon)
    const ret = obs.forwardOutcomes[result.primaryHorizon]?.netReturnPercent ?? 0;
    if (outcomeFilter === 'WINNERS' && ret <= 0) return false;
    if (outcomeFilter === 'LOSERS' && ret >= 0) return false;

    return true;
  });

  const sortedObservations = [...filteredObservations].sort((a, b) => {
    let diff = 0;
    if (sortField === 'DATE') {
      diff = new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
    } else if (sortField === 'SYMBOL') {
      diff = a.symbol.localeCompare(b.symbol);
    } else if (sortField === 'RETURN10D') {
      const retA = a.forwardOutcomes[10]?.netReturnPercent ?? -999;
      const retB = b.forwardOutcomes[10]?.netReturnPercent ?? -999;
      diff = retA - retB;
    } else if (sortField === 'MFE10D') {
      const mfeA = a.mfe[10]?.favorablePercent ?? 0;
      const mfeB = b.mfe[10]?.favorablePercent ?? 0;
      diff = mfeA - mfeB;
    }
    return sortAsc ? diff : -diff;
  });

  return (
    <div className="bg-[#111622] border border-slate-800 rounded-lg p-4 space-y-3">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Table className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Research Event Audit Log (Section 34)
          </h3>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {sortedObservations.length} of {result.observationsCount} Events
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter symbol..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-[#0d111a] border border-slate-700 rounded pl-8 pr-2.5 py-1 text-slate-200 placeholder-slate-500 text-xs w-32 focus:w-40 transition-all outline-none"
            />
          </div>

          {/* Regime Filter */}
          <select
            value={regimeFilter}
            onChange={e => setRegimeFilter(e.target.value)}
            className="bg-[#0d111a] border border-slate-700 rounded px-2 py-1 text-slate-300"
          >
            <option value="ALL">All Regimes</option>
            <option value="BULL">Bull</option>
            <option value="BEAR">Bear</option>
            <option value="SIDEWAYS">Sideways</option>
            <option value="HIGH_VOLATILITY">High Vol</option>
            <option value="LOW_VOLATILITY">Low Vol</option>
          </select>

          {/* Win/Loss Filter */}
          <select
            value={outcomeFilter}
            onChange={e => setOutcomeFilter(e.target.value as any)}
            className="bg-[#0d111a] border border-slate-700 rounded px-2 py-1 text-slate-300"
          >
            <option value="ALL">All Outcomes</option>
            <option value="WINNERS">Winners Only (&gt; 0)</option>
            <option value="LOSERS">Losers Only (&lt; 0)</option>
          </select>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-semibold px-3 py-1 rounded text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="overflow-x-auto border border-slate-800 rounded">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#0b0e14] text-slate-400 border-b border-slate-800 uppercase text-[10px] font-mono tracking-wider">
            <tr>
              <th
                className="p-2 cursor-pointer hover:text-slate-200"
                onClick={() => {
                  setSortField('DATE');
                  setSortAsc(!sortAsc);
                }}
              >
                Date {sortField === 'DATE' && (sortAsc ? '▲' : '▼')}
              </th>
              <th
                className="p-2 cursor-pointer hover:text-slate-200"
                onClick={() => {
                  setSortField('SYMBOL');
                  setSortAsc(!sortAsc);
                }}
              >
                Symbol {sortField === 'SYMBOL' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="p-2">Regime</th>
              <th className="p-2 text-right">Entry Price</th>
              <th className="p-2 text-right">1D Ret</th>
              <th className="p-2 text-right">3D Ret</th>
              <th className="p-2 text-right">5D Ret</th>
              <th
                className="p-2 text-right cursor-pointer hover:text-slate-200"
                onClick={() => {
                  setSortField('RETURN10D');
                  setSortAsc(!sortAsc);
                }}
              >
                10D Ret {sortField === 'RETURN10D' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="p-2 text-right">20D Ret</th>
              <th
                className="p-2 text-right cursor-pointer hover:text-slate-200 text-emerald-400"
                onClick={() => {
                  setSortField('MFE10D');
                  setSortAsc(!sortAsc);
                }}
              >
                10D MFE {sortField === 'MFE10D' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="p-2 text-right text-rose-400">10D MAE</th>
              <th className="p-2 text-center">Target/Stop Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
            {sortedObservations.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-6 text-center text-slate-500 font-sans">
                  No historical signal observations match current filters.
                </td>
              </tr>
            ) : (
              sortedObservations.map(obs => {
                const r1 = obs.forwardOutcomes[1]?.netReturnPercent;
                const r3 = obs.forwardOutcomes[3]?.netReturnPercent;
                const r5 = obs.forwardOutcomes[5]?.netReturnPercent;
                const r10 = obs.forwardOutcomes[10]?.netReturnPercent;
                const r20 = obs.forwardOutcomes[20]?.netReturnPercent;
                const mfe10 = obs.mfe[10]?.favorablePercent;
                const mae10 = obs.mae[10]?.adversePercent;

                return (
                  <tr key={obs.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-2 text-slate-400 font-sans">{obs.entryDate}</td>
                    <td className="p-2 font-bold text-slate-200 font-mono">{obs.symbol}</td>
                    <td className="p-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                        {obs.marketRegime}
                      </span>
                    </td>
                    <td className="p-2 text-right font-medium text-slate-200">
                      Rs. {obs.entryPrice.toFixed(1)}
                    </td>

                    {/* Returns */}
                    <td className={`p-2 text-right ${r1 !== undefined && r1 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {r1 !== undefined ? `${r1 > 0 ? '+' : ''}${r1.toFixed(1)}%` : '—'}
                    </td>
                    <td className={`p-2 text-right ${r3 !== undefined && r3 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {r3 !== undefined ? `${r3 > 0 ? '+' : ''}${r3.toFixed(1)}%` : '—'}
                    </td>
                    <td className={`p-2 text-right ${r5 !== undefined && r5 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {r5 !== undefined ? `${r5 > 0 ? '+' : ''}${r5.toFixed(1)}%` : '—'}
                    </td>
                    <td
                      className={`p-2 text-right font-bold ${
                        r10 !== undefined && r10 >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {r10 !== undefined ? `${r10 > 0 ? '+' : ''}${r10.toFixed(1)}%` : '—'}
                    </td>
                    <td className={`p-2 text-right ${r20 !== undefined && r20 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {r20 !== undefined ? `${r20 > 0 ? '+' : ''}${r20.toFixed(1)}%` : '—'}
                    </td>

                    {/* Excursions */}
                    <td className="p-2 text-right text-emerald-400">
                      {mfe10 !== undefined ? `+${mfe10.toFixed(1)}%` : '—'}
                    </td>
                    <td className="p-2 text-right text-rose-400">
                      {mae10 !== undefined ? `-${mae10.toFixed(1)}%` : '—'}
                    </td>

                    {/* Simulation Outcome */}
                    <td className="p-2 text-center font-sans">
                      {obs.simulation ? (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            obs.simulation.outcome === 'TARGET_HIT'
                              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                              : obs.simulation.outcome === 'STOP_HIT'
                              ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                              : obs.simulation.outcome === 'AMBIGUOUS'
                              ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          {obs.simulation.outcome.replace('_', ' ')} (
                          {obs.simulation.barsHeld}d)
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
