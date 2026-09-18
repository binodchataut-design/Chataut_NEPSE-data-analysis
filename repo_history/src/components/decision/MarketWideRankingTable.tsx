/**
 * Market-Wide Evidence Ranking Table (Phase 4B)
 * Evaluates and ranks stocks across the NEPSE universe using multi-factor evidence:
 * Alignment, Research Grade, Sample Size, Conditional Probabilities, and Real-world Liquidity.
 */

import React, { useState, useEffect } from 'react';
import { MarketWideEvidenceRankingItem } from '../../types/decisionIntelligence';
import { DecisionIntelligenceOrchestrator } from '../../services/decisionIntelligence/decisionIntelligenceOrchestrator';
import {
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  AlertTriangle,
  Search,
  ExternalLink,
  Filter
} from 'lucide-react';

interface MarketWideRankingTableProps {
  asOfDate: string;
  onSelectStock: (symbol: string) => void;
}

export const MarketWideRankingTable: React.FC<MarketWideRankingTableProps> = ({
  asOfDate,
  onSelectStock
}) => {
  const [rankings, setRankings] = useState<MarketWideEvidenceRankingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    DecisionIntelligenceOrchestrator.getMarketWideRanking(asOfDate)
      .then(data => {
        if (isMounted) {
          setRankings(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to compute market wide ranking:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [asOfDate]);

  const sectors = ['ALL', ...Array.from(new Set(rankings.map(r => r.sector)))];

  const filteredRankings = rankings.filter(r => {
    const matchesSearch =
      r.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'ALL' || r.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  const getEligibilityBadge = (status: string) => {
    switch (status) {
      case 'ELIGIBLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">ELIGIBLE</span>;
      case 'ELIGIBLE_WITH_WARNING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950 text-amber-300 border border-amber-500/40">WARNING</span>;
      case 'WATCH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-yellow-950 text-yellow-300 border border-yellow-500/40">WATCH</span>;
      case 'BLOCKED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/40">BLOCKED</span>;
      case 'INSUFFICIENT_EVIDENCE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">INSUFFICIENT</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">UNAVAILABLE</span>;
    }
  };

  return (
    <div className="bg-[#0b101b] border border-slate-800 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-[#0d1424]">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Market-Wide Evidence & Setup Ranking
          </span>
          <span className="text-xs font-mono text-slate-400">
            ({filteredRankings.length} stocks ranked by composite empirical evidence)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs rounded bg-[#090d16] border border-slate-700 text-slate-200 font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={e => setSelectedSector(e.target.value)}
            className="px-2.5 py-1 text-xs rounded bg-[#090d16] border border-slate-700 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          >
            {sectors.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-slate-400">
          Computing multi-factor evidence and historical conditional probabilities across NEPSE universe...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e1628] text-slate-400 border-b border-slate-800 uppercase font-mono tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Symbol & Company</th>
                <th className="py-2.5 px-3">Sector</th>
                <th className="py-2.5 px-3">Composite Score</th>
                <th className="py-2.5 px-3">Alignment</th>
                <th className="py-2.5 px-3">5D Win Rate (95% CI)</th>
                <th className="py-2.5 px-3">20D Win Rate (95% CI)</th>
                <th className="py-2.5 px-3">Grade</th>
                <th className="py-2.5 px-3">Liquidity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredRankings.map((r, idx) => (
                <tr
                  key={r.symbol}
                  onClick={() => onSelectStock(r.symbol)}
                  className="hover:bg-slate-850/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-slate-400 w-12">
                    #{idx + 1}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-100 flex items-center gap-1.5 font-mono">
                      {r.symbol}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                      {r.companyName}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-300 text-[11px]">
                    {r.sector}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 font-mono">
                      <span
                        className={`font-bold text-sm ${
                          r.compositeScore >= 75
                            ? 'text-cyan-400'
                            : r.compositeScore >= 55
                            ? 'text-blue-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {r.compositeScore}
                      </span>
                      <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${r.compositeScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px]">
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        r.evidenceAlignment.includes('BULLISH')
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                          : r.evidenceAlignment.includes('CONFLICTED')
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                          : 'bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      {r.evidenceAlignment.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs">
                    <span className="font-semibold text-slate-200">{r.fiveDayProb.toFixed(1)}%</span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      [{r.fiveDayWilsonCI.lower.toFixed(0)}-{r.fiveDayWilsonCI.upper.toFixed(0)}%]
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs">
                    <span className="font-semibold text-slate-200">{r.twentyDayProb.toFixed(1)}%</span>
                    <span className="text-[10px] text-slate-500 ml-1">
                      [{r.twentyDayWilsonCI.lower.toFixed(0)}-{r.twentyDayWilsonCI.upper.toFixed(0)}%]
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 font-bold text-xs">
                      {r.researchGrade}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px]">
                    <span className={r.liquidityRating === 'HIGH' ? 'text-emerald-400' : 'text-slate-400'}>
                      {r.liquidityRating}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {getEligibilityBadge(r.eligibilityStatus)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 group-hover:underline">
                      Assess <ExternalLink className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
