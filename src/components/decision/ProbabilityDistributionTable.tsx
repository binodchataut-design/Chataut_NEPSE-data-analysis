/**
 * Multi-Horizon Probability Distribution & Historical Comparables Component (Phase 4B)
 * Displays historical conditional probability distributions across 1, 3, 5, 10, 20, 30, and 60 sessions.
 * Never labels historical conditional distributions as "future prediction".
 * Shows Wilson 95% Confidence Intervals, Bayesian Smoothing, and matching historical conditions.
 */

import React, { useState } from 'react';
import {
  DecisionProbabilityResult,
  HistoricalComparableCondition,
  HorizonProbabilityDistribution
} from '../../types/decisionIntelligence';
import { HoldingHorizon } from '../../types/historicalResearch';
import {
  Calendar,
  Layers,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Clock,
  BarChart2,
  Lock
} from 'lucide-react';

interface ProbabilityDistributionTableProps {
  probability: DecisionProbabilityResult;
  comparables: HistoricalComparableCondition[];
  asOfDate: string;
}

export const ProbabilityDistributionTable: React.FC<ProbabilityDistributionTableProps> = ({
  probability,
  comparables,
  asOfDate
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<HoldingHorizon>(5);
  const horizons: HoldingHorizon[] = [1, 3, 5, 10, 20, 30, 60];

  const currentDist = probability.distributions[selectedHorizon];

  const getSampleTierBadge = (tier: string) => {
    switch (tier) {
      case 'ROBUST':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">ROBUST (N≥100)</span>;
      case 'ADEQUATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-500/40">ADEQUATE (N≥40)</span>;
      case 'SMALL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-500/40">MODERATE (N≥15)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-500/40">INSUFFICIENT (N&lt;15)</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Multi-Horizon Probability Table */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-[#0d1424]">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Historical Conditional Probability Distribution
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Strict Historical Cutoff: t ≤ {asOfDate}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e1628] text-slate-400 border-b border-slate-800 uppercase font-mono tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Horizon</th>
                <th className="py-2.5 px-3">Observations</th>
                <th className="py-2.5 px-3">P(Positive)</th>
                <th className="py-2.5 px-3">Wilson 95% CI</th>
                <th className="py-2.5 px-3">Bayesian Smoothed</th>
                <th className="py-2.5 px-3">Mean / Median</th>
                <th className="py-2.5 px-3">Downside (10th/25th)</th>
                <th className="py-2.5 px-3">Upside (75th/90th)</th>
                <th className="py-2.5 px-3">Expectancy</th>
                <th className="py-2.5 px-3">Statistical Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {horizons.map(h => {
                const dist = probability.distributions[h];
                if (!dist) return null;
                const isSelected = selectedHorizon === h;

                return (
                  <tr
                    key={h}
                    onClick={() => setSelectedHorizon(h)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/40 border-l-2 border-l-cyan-400'
                        : 'hover:bg-slate-850/40'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-200">
                      {h} Session{h > 1 ? 's' : ''}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      N = {dist.observations}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold ${
                          dist.pPositive >= 60
                            ? 'text-emerald-400'
                            : dist.pPositive <= 40
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {dist.pPositive.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      [{dist.wilsonInterval.lower.toFixed(1)}% – {dist.wilsonInterval.upper.toFixed(1)}%]
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300">
                      {dist.bayesianSmoothed.smoothedRate.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">
                      <span className={dist.meanReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {dist.meanReturn > 0 ? '+' : ''}{dist.meanReturn.toFixed(2)}%
                      </span>
                      <span className="text-slate-500 text-[11px] ml-1.5">
                        med: {dist.medianReturn > 0 ? '+' : ''}{dist.medianReturn.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-rose-400 text-[11px]">
                      {dist.downsidePercentile10.toFixed(1)}% / {dist.downsidePercentile25.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 text-[11px]">
                      {dist.upsidePercentile75.toFixed(1)}% / {dist.upsidePercentile90.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-semibold ${
                          dist.expectancy > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {dist.expectancy > 0 ? '+' : ''}{dist.expectancy.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {getSampleTierBadge(dist.sampleTier)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Horizon Deep Dive Bar */}
        {currentDist && (
          <div className="p-3 bg-[#0d1424] border-t border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-cyan-300">
                {selectedHorizon}-Session Statistical Summary:
              </span>
              <span>
                Mean Maximum Favorable Excursion (MFE): +{currentDist.mfeMean.toFixed(2)}% • Mean Adverse Excursion (MAE): -{Math.abs(currentDist.maeMean).toFixed(2)}%
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              Profit Factor: <span className="text-slate-200 font-bold">{currentDist.profitFactor.toFixed(2)}x</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Historical Comparable Setups */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Historical Comparable Setups (t ≤ {asOfDate})
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            {comparables.length} nearest historical observations
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e1628] text-slate-400 border-b border-slate-800 uppercase font-mono tracking-wider">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Symbol</th>
                <th className="py-2 px-3">Similarity</th>
                <th className="py-2 px-3">Matched Condition Features</th>
                <th className="py-2 px-3 text-right">Entry Price</th>
                <th className="py-2 px-3 text-right">1D Ret</th>
                <th className="py-2 px-3 text-right">5D Ret</th>
                <th className="py-2 px-3 text-right">10D Ret</th>
                <th className="py-2 px-3 text-right">20D Ret</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {comparables.slice(0, 10).map(c => (
                <tr key={c.id} className="hover:bg-slate-850/40">
                  <td className="py-2 px-3 text-slate-300">{c.date}</td>
                  <td className="py-2 px-3 font-bold text-cyan-300">{c.symbol}</td>
                  <td className="py-2 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 font-bold">
                      {Math.round(c.similarityScore * 100)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300 text-[11px] font-sans">
                    {c.matchedFeatures.join(', ')}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-300">
                    NPR {c.entryPrice.toFixed(1)}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      c.forwardReturns[1] >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {c.forwardReturns[1] > 0 ? '+' : ''}{c.forwardReturns[1]}%
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      c.forwardReturns[5] >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {c.forwardReturns[5] > 0 ? '+' : ''}{c.forwardReturns[5]}%
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      c.forwardReturns[10] >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {c.forwardReturns[10] > 0 ? '+' : ''}{c.forwardReturns[10]}%
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      c.forwardReturns[20] >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {c.forwardReturns[20] > 0 ? '+' : ''}{c.forwardReturns[20]}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Statistical Caveat Notice */}
      <div className="p-3 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2 font-mono">
        <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-300">Empirical Research Notice: </span>
          All metrics represent historical conditional occurrences under comparable regimes.
          Wilson confidence intervals and Bayesian Beta-Binomial smoothing reflect sample size uncertainty.
          These statistics do not constitute guaranteed future price returns.
        </div>
      </div>
    </div>
  );
};
