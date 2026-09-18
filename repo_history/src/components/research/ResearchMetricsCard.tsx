import React from 'react';
import {
  TrendingUp,
  Percent,
  ShieldAlert,
  BarChart3,
  Flame,
  Award,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { ResearchResult, SampleSizeTier } from '../../types/historicalResearch';

interface ResearchMetricsCardProps {
  result: ResearchResult;
}

export const ResearchMetricsCard: React.FC<ResearchMetricsCardProps> = ({ result }) => {
  const getSampleTierColor = (tier: SampleSizeTier) => {
    switch (tier) {
      case 'VERY_LOW':
        return 'bg-rose-950/80 border-rose-700 text-rose-300';
      case 'LOW':
        return 'bg-amber-950/80 border-amber-700 text-amber-300';
      case 'LIMITED':
        return 'bg-yellow-950/80 border-yellow-700 text-yellow-300';
      case 'MODERATE':
        return 'bg-cyan-950/80 border-cyan-700 text-cyan-300';
      case 'LARGER':
        return 'bg-emerald-950/80 border-emerald-700 text-emerald-300';
    }
  };

  const isNetPositive = result.meanReturn >= 0;

  return (
    <div className="space-y-3">
      {/* Sample Size Warning Banner (Section 18 & 19) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#111622] border border-slate-800 p-3 rounded-lg">
        <div className="flex items-center space-x-3">
          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${getSampleTierColor(
              result.sampleTier
            )}`}
          >
            {result.sampleTier.replace('_', ' ')} SAMPLE ({result.observationsCount} Observations)
          </span>
          <span className="text-xs text-slate-400">
            Across {result.totalUniverseBars} total evaluated bar sessions in{' '}
            <span className="text-slate-200 font-semibold">{result.runConfig.universe}</span> universe
          </span>
        </div>

        {result.smallSampleWarning && (
          <div className="flex items-center space-x-1.5 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2.5 py-1 rounded">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Sample size &lt; 50: Historical frequency may reflect localized noise.</span>
          </div>
        )}
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        {/* Win Rate + Wilson 95% CI */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Positive Rate ({result.primaryHorizon}D)</span>
            <Percent className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {result.winRate}%
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            95% Wilson CI:{' '}
            <span className="text-slate-300">
              {result.confidenceInterval.lower.toFixed(1)}% – {result.confidenceInterval.upper.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Mathematical Expectancy (Section 10) */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Expectancy / Trade</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              result.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {result.expectancy > 0 ? `+${result.expectancy}%` : `${result.expectancy}%`}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            (P_win × W) - (P_loss × L)
          </div>
        </div>

        {/* Profit Factor (Section 11) */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Profit Factor</span>
            <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-200">
            {result.profitFactor !== null ? result.profitFactor : 'N/A (Zero Losses)'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Gross: +{result.grossProfits}% / -{result.grossLosses}%
          </div>
        </div>

        {/* Mean & Median Return */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Mean (Median)</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {result.meanReturn > 0 ? `+${result.meanReturn}%` : `${result.meanReturn}%`}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Median:{' '}
            <span className="text-slate-300">
              {result.medianReturn > 0 ? `+${result.medianReturn}%` : `${result.medianReturn}%`}
            </span>
          </div>
        </div>

        {/* Max Drawdown (Section 13) */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Max Drawdown</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400">
            -{result.drawdown.maxDrawdownPercent}%
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Avg DD: -{result.drawdown.avgDrawdownPercent}%
          </div>
        </div>

        {/* Risk / Reward & Streaks (Section 12 & 13) */}
        <div className="bg-[#111622] border border-slate-800 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Excursion Ratio</span>
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">
            {result.riskRewardRatio} : 1
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Win/Loss Streak: {result.drawdown.longestWinningStreak}W / {result.drawdown.longestLosingStreak}L
          </div>
        </div>
      </div>
    </div>
  );
};
