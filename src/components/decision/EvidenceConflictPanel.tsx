/**
 * Evidence Conflict & Alignment Panel Component (Phase 4B)
 * Explicitly surfaces multi-dimensional contradictions between technical, fundamental,
 * liquidity, and market regime evidence. Never hides conflicting evidence.
 */

import React from 'react';
import {
  EvidenceAlignmentResult,
  EvidenceConflictResult,
  EvidenceConflict
} from '../../types/decisionIntelligence';
import {
  AlertTriangle,
  CheckCircle2,
  GitCommit,
  ShieldAlert,
  ArrowRight,
  Split,
  TrendingUp,
  Activity
} from 'lucide-react';

interface EvidenceConflictPanelProps {
  alignment: EvidenceAlignmentResult;
  conflicts: EvidenceConflictResult;
}

export const EvidenceConflictPanel: React.FC<EvidenceConflictPanelProps> = ({
  alignment,
  conflicts
}) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/50 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> CRITICAL CONFLICT
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/50 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> HIGH CONFLICT
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-yellow-950/60 text-yellow-300 border border-yellow-500/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> MODERATE CONFLICT
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Alignment Overview Bar */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-lg p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Cross-Dimensional Evidence Alignment
            </div>
            <div className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-0.5">
              <span
                className={`px-2.5 py-0.5 rounded text-sm font-mono ${
                  alignment.overallAlignment.includes('STRONG_CONVERGENT_BULLISH')
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                    : alignment.overallAlignment.includes('CONFLICTED')
                    ? 'bg-rose-950 text-rose-300 border border-rose-500/50'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                {alignment.overallAlignment.replace(/_/g, ' ')}
              </span>
              <span className="text-sm font-mono text-slate-400">
                ({Math.round(alignment.alignmentScore * 100)}% Consensus)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
              {alignment.bullishEvidenceCount} Bullish
            </div>
            <div className="px-3 py-1.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-400">
              {alignment.bearishEvidenceCount} Bearish
            </div>
            <div className="px-3 py-1.5 rounded bg-slate-800/60 border border-slate-700 text-slate-300">
              {alignment.neutralEvidenceCount} Neutral
            </div>
            <div className="px-3 py-1.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
              {alignment.independentEvidenceCount} Independent Factors
            </div>
          </div>
        </div>

        {/* Category Breakdown Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-3 border-t border-slate-800/80">
          {(Object.entries(alignment.categoryBreakdown) as [string, { itemCount: number; direction: string; effectiveScore: number }][])
            .filter(([_, cat]) => cat.itemCount > 0)
            .map(([catName, cat]) => {
              const isBull = cat.direction === 'BULLISH';
              const isBear = cat.direction === 'BEARISH';
              return (
                <div
                  key={catName}
                  className={`p-2 rounded border text-xs ${
                    isBull
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : isBear
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-mono text-[10px] text-slate-500 truncate">
                    {catName.replace(/_/g, ' ')}
                  </div>
                  <div className="font-semibold flex items-center justify-between mt-1">
                    <span>{cat.direction}</span>
                    <span className="font-mono text-[10px]">
                      {cat.effectiveScore > 0 ? '+' : ''}
                      {cat.effectiveScore.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 2. Explicit Conflicts Section */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Split className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Contradiction & Divergence Detector
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            {conflicts.conflictCount === 0
              ? 'No structural conflicts detected'
              : `${conflicts.conflictCount} active contradiction(s) requiring caution`}
          </div>
        </div>

        {conflicts.conflictCount === 0 ? (
          <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <div>
              <div className="font-semibold">Complete Factor Agreement</div>
              <div className="text-slate-400 mt-0.5">
                Technical price structure, volume flow, liquidity, and fundamental parameters do not exhibit active contradictions.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {conflicts.conflicts.map(conflict => (
              <div
                key={conflict.id}
                className="p-3.5 rounded-lg bg-[#0e1628] border border-slate-700/80 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                    <span>{conflict.title}</span>
                  </div>
                  {getSeverityBadge(conflict.severity)}
                </div>

                {/* Side-by-Side Contradicting Evidence Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  {/* Evidence A */}
                  <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30">
                    <div className="text-emerald-400 font-bold flex items-center justify-between">
                      <span>EVIDENCE A: {conflict.evidenceA.category}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300">
                        {conflict.evidenceA.direction}
                      </span>
                    </div>
                    <div className="text-slate-200 font-medium mt-1">
                      {conflict.evidenceA.name}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {conflict.evidenceA.details}
                    </div>
                  </div>

                  {/* Evidence B */}
                  <div className="p-2.5 rounded bg-rose-950/20 border border-rose-500/30">
                    <div className="text-rose-400 font-bold flex items-center justify-between">
                      <span>EVIDENCE B: {conflict.evidenceB.category}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-900/60 text-rose-300">
                        {conflict.evidenceB.direction}
                      </span>
                    </div>
                    <div className="text-slate-200 font-medium mt-1">
                      {conflict.evidenceB.name}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {conflict.evidenceB.details}
                    </div>
                  </div>
                </div>

                {/* Explanation & Impact on Decision */}
                <div className="text-xs text-slate-300 pt-1 space-y-1">
                  <div>
                    <span className="font-semibold text-cyan-400">Mechanism: </span>
                    {conflict.explanation}
                  </div>
                  <div>
                    <span className="font-semibold text-amber-400">Impact on Decision: </span>
                    {conflict.impactOnDecision}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
