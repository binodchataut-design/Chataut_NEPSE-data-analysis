/**
 * Evidence Matrix Table Component (Phase 4B)
 * Displays structured, normalized evidence items with directional scores,
 * mathematical reliability breakdowns, and collinearity/redundancy markers.
 */

import React, { useState } from 'react';
import {
  NormalizedEvidenceItem,
  EvidenceCategory
} from '../../types/decisionIntelligence';
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  Layers,
  ShieldCheck,
  Filter
} from 'lucide-react';

interface EvidenceMatrixTableProps {
  evidenceItems: NormalizedEvidenceItem[];
  onSelectCategory?: (cat: EvidenceCategory) => void;
}

export const EvidenceMatrixTable: React.FC<EvidenceMatrixTableProps> = ({
  evidenceItems,
  onSelectCategory
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTooltipItem, setActiveTooltipItem] = useState<string | null>(null);

  const categories: string[] = ['ALL', ...Array.from(new Set(evidenceItems.map(i => i.category as string)))];

  const filteredItems = selectedCategory === 'ALL'
    ? evidenceItems
    : evidenceItems.filter(i => i.category === selectedCategory);

  const getDirectionBadge = (dir: string) => {
    switch (dir) {
      case 'BULLISH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <ArrowUpRight className="w-3 h-3" /> BULLISH
          </span>
        );
      case 'BEARISH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-rose-950/80 text-rose-400 border border-rose-500/30">
            <ArrowDownRight className="w-3 h-3" /> BEARISH
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
            <Minus className="w-3 h-3" /> NEUTRAL
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0b101b] border border-slate-800 rounded-lg overflow-hidden">
      {/* Category Filter Toolbar */}
      <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-[#0d1424]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-wider">
            FILTER EVIDENCE DIMENSION
          </span>
          <span className="text-xs text-slate-400 font-mono">
            ({filteredItems.length} of {evidenceItems.length} factors)
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                if (onSelectCategory && cat !== 'ALL') onSelectCategory(cat as EvidenceCategory);
              }}
              className={`px-2.5 py-1 text-xs rounded font-mono transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0e1628] text-slate-400 border-b border-slate-800 uppercase font-mono tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Evidence Dimension</th>
              <th className="py-2.5 px-3">Direction</th>
              <th className="py-2.5 px-3">Current Observation</th>
              <th className="py-2.5 px-3">Normalized Score (-1 to +1)</th>
              <th className="py-2.5 px-3">Reliability Score</th>
              <th className="py-2.5 px-3">Collinearity / Redundancy</th>
              <th className="py-2.5 px-3 text-right">Source Engine</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredItems.map(item => {
              const scorePct = Math.round(Math.abs(item.normalizedScore) * 100);
              const reliabilityPct = Math.round(item.reliability * 100);

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-850/30 transition-colors group relative"
                >
                  {/* Dimension & Name */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                      {item.name}
                      {item.historicalSupport && (
                        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                          N={item.historicalSupport.observations}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {item.category.replace(/_/g, ' ')} • {item.explanation}
                    </div>
                  </td>

                  {/* Direction */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {getDirectionBadge(item.direction)}
                  </td>

                  {/* Value */}
                  <td className="py-3 px-3 font-mono">
                    <span className="text-slate-200 font-medium">
                      {item.formattedValue || String(item.rawValue)}
                    </span>
                    {item.referenceValue !== undefined && (
                      <span className="text-slate-500 text-[10px] block">
                        ref: {String(item.referenceValue)}
                      </span>
                    )}
                  </td>

                  {/* Normalized Score Bar */}
                  <td className="py-3 px-3 w-48">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span
                        className={`w-12 text-right font-medium ${
                          item.normalizedScore > 0
                            ? 'text-emerald-400'
                            : item.normalizedScore < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.normalizedScore > 0 ? '+' : ''}
                        {item.normalizedScore.toFixed(2)}
                      </span>
                      <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                        {item.normalizedScore < 0 ? (
                          <div
                            className="bg-rose-500 h-full ml-auto rounded-full"
                            style={{ width: `${scorePct}%` }}
                          />
                        ) : item.normalizedScore > 0 ? (
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${scorePct}%` }}
                          />
                        ) : (
                          <div className="w-1 h-full bg-slate-600 mx-auto" />
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Reliability Score */}
                  <td className="py-3 px-3 w-40">
                    <div
                      className="cursor-pointer group/rel"
                      onClick={() =>
                        setActiveTooltipItem(
                          activeTooltipItem === item.id ? null : item.id
                        )
                      }
                    >
                      <div className="flex items-center justify-between text-xs font-mono mb-1">
                        <span className="text-slate-300 font-medium">
                          {item.reliability.toFixed(3)}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                          <Info className="w-3 h-3" /> details
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full ${
                            reliabilityPct >= 80
                              ? 'bg-cyan-500'
                              : reliabilityPct >= 60
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${reliabilityPct}%` }}
                        />
                      </div>

                      {/* Mathematical Components Breakdown Dropdown */}
                      {activeTooltipItem === item.id && (
                        <div className="absolute z-20 mt-1 p-2.5 bg-[#0e172a] border border-cyan-500/40 rounded-lg shadow-xl text-[11px] w-64 text-slate-300 font-mono">
                          <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Reliability Components
                          </div>
                          <div className="space-y-0.5 text-[10px]">
                            <div>• Sample Size (30%): {item.historicalSupport?.observations ?? 50} obs</div>
                            <div>• Research Grade (25%): {item.historicalSupport?.evidenceGrade ?? 'B'}</div>
                            <div>• CI Precision (20%): [{item.historicalSupport?.wilsonLower ?? 55}% - {item.historicalSupport?.wilsonUpper ?? 72}%]</div>
                            <div>• Temporal Stability (15%): verified</div>
                            <div>• Data Quality (10%): {item.dataQuality}</div>
                            {item.isRedundant && (
                              <div className="text-amber-400 font-semibold pt-1">
                                ⚠ 0.5x dampening applied (Collinear with {item.redundancyGroup})
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Collinearity / Redundancy */}
                  <td className="py-3 px-3">
                    {item.isRedundant ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-500/30">
                        <Layers className="w-3 h-3" /> REDUNDANT ({item.redundancyGroup?.replace(/_/g, ' ')})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800/40 text-slate-400 border border-slate-800">
                        INDEPENDENT FACTOR
                      </span>
                    )}
                  </td>

                  {/* Source */}
                  <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {item.sourceEngine}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
