import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Activity,
  BarChart2,
  PieChart,
  Layers,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { ResearchResult, HoldingHorizon } from '../../types/historicalResearch';

interface ResearchVisualizationsProps {
  result: ResearchResult;
}

export const ResearchVisualizations: React.FC<ResearchVisualizationsProps> = ({ result }) => {
  const [activeChart, setActiveChart] = useState<
    'EQUITY' | 'HORIZONS' | 'EXCURSIONS' | 'REGIMES' | 'SECTORS'
  >('EQUITY');

  // 1. Data for Horizons comparison
  const horizonsData = (result.runConfig.horizons || [1, 3, 5, 10, 20, 30, 60]).map(h => {
    const dist = result.distributionByHorizon[h];
    const mfe = result.mfeStats[h];
    const mae = result.maeStats[h];

    return {
      horizon: `${h} Sessions`,
      meanReturn: dist ? dist.mean : 0,
      medianReturn: dist ? dist.median : 0,
      mfe: mfe ? mfe.meanPercent : 0,
      mae: mae ? -mae.meanPercent : 0,
      p25: dist ? dist.p25 : 0,
      p75: dist ? dist.p75 : 0
    };
  });

  // 2. Data for Equity Curve
  const equityCurveData = result.drawdown.equityCurve.map((pt, i) => ({
    trade: i + 1,
    date: pt.date,
    equity: pt.equity,
    peak: pt.peakEquity,
    drawdown: -pt.drawdownPercent,
    returnPercent: pt.tradeReturnPercent
  }));

  return (
    <div className="bg-[#111622] border border-slate-800 rounded-lg p-4 space-y-4">
      {/* Chart Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Empirical Visualizations (Section 33)
          </h3>
        </div>

        <div className="flex space-x-1 bg-[#0d111a] p-1 rounded border border-slate-800 text-xs">
          <button
            onClick={() => setActiveChart('EQUITY')}
            className={`px-3 py-1 rounded transition-colors ${
              activeChart === 'EQUITY'
                ? 'bg-cyan-600 text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Compounded Equity
          </button>
          <button
            onClick={() => setActiveChart('HORIZONS')}
            className={`px-3 py-1 rounded transition-colors ${
              activeChart === 'HORIZONS'
                ? 'bg-cyan-600 text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Forward Horizons
          </button>
          <button
            onClick={() => setActiveChart('EXCURSIONS')}
            className={`px-3 py-1 rounded transition-colors ${
              activeChart === 'EXCURSIONS'
                ? 'bg-cyan-600 text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MFE vs MAE
          </button>
          <button
            onClick={() => setActiveChart('REGIMES')}
            className={`px-3 py-1 rounded transition-colors ${
              activeChart === 'REGIMES'
                ? 'bg-cyan-600 text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Market Regimes
          </button>
          <button
            onClick={() => setActiveChart('SECTORS')}
            className={`px-3 py-1 rounded transition-colors ${
              activeChart === 'SECTORS'
                ? 'bg-cyan-600 text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sectors Breakdown
          </button>
        </div>
      </div>

      {/* 1. Equity Curve View */}
      {activeChart === 'EQUITY' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Compounded Equity Progression (NPR 100,000 Base) across {equityCurveData.length} chronological events
            </span>
            <span className="font-mono text-rose-400">
              Peak Drawdown: -{result.drawdown.maxDrawdownPercent}%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityCurveData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                  formatter={(val: any, name: string) => [
                    name === 'equity' ? `NPR ${val.toLocaleString()}` : `${val}%`,
                    name === 'equity' ? 'Equity' : 'Drawdown'
                  ]}
                />
                <ReferenceLine y={100000} stroke="#64748b" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#06b6d4' }}
                  name="equity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 2. Forward Horizons View (Section 4 & 21) */}
      {activeChart === 'HORIZONS' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Forward Return Distribution across 1D, 3D, 5D, 10D, 20D, 30D, 60D Holding Sessions</span>
            <span className="font-mono text-cyan-400">Values in %</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={horizonsData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <XAxis dataKey="horizon" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                  formatter={(val: any, name: string) => [`${val.toFixed(2)}%`, name]}
                />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="meanReturn" name="Mean Return" fill="#06b6d4">
                  {horizonsData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={entry.meanReturn >= 0 ? '#10b981' : '#f43f5e'}
                    />
                  ))}
                </Bar>
                <Bar dataKey="medianReturn" name="Median Return" fill="#a855f7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 3. MFE vs MAE View (Sections 6 & 7) */}
      {activeChart === 'EXCURSIONS' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Maximum Favorable Excursion (MFE Peak Gain) vs Maximum Adverse Excursion (MAE Drawdown)
            </span>
            <span className="font-mono text-cyan-400">
              Risk/Reward Ratio: {result.riskRewardRatio} : 1
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={horizonsData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <XAxis dataKey="horizon" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                  formatter={(val: any, name: string) => [`${Math.abs(val).toFixed(2)}%`, name]}
                />
                <ReferenceLine y={0} stroke="#475569" />
                <Bar dataKey="mfe" name="Avg Peak Upside (MFE %)" fill="#10b981" />
                <Bar dataKey="mae" name="Avg Max Drawdown (MAE %)" fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Market Regimes View (Section 22) */}
      {activeChart === 'REGIMES' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Subgroup Analysis by Market Environment (Bull, Bear, Sideways, Volatility)</span>
            <span className="font-mono text-slate-300">
              Primary Horizon: {result.primaryHorizon} Sessions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {result.regimeResults.map(reg => (
              <div
                key={reg.category}
                className="bg-[#0d111a] border border-slate-800 p-3 rounded space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    {reg.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {reg.observations} Obs
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {reg.winRate}% <span className="text-xs font-normal text-slate-400">Win</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                  <span>Mean: {reg.meanReturn > 0 ? `+${reg.meanReturn}%` : `${reg.meanReturn}%`}</span>
                  <span>Med: {reg.medianReturn > 0 ? `+${reg.medianReturn}%` : `${reg.medianReturn}%`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Sector Breakdown View (Section 23) */}
      {activeChart === 'SECTORS' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Historical Behavior Across Sector Classes</span>
            <span className="font-mono text-slate-300">
              Primary Horizon: {result.primaryHorizon} Sessions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {result.sectorResults.map(sec => (
              <div
                key={sec.category}
                className="bg-[#0d111a] border border-slate-800 p-3 rounded space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{sec.category}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {sec.observations} Obs
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold">{sec.winRate}% Win Rate</span>
                  <span
                    className={sec.meanReturn >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}
                  >
                    Mean: {sec.meanReturn > 0 ? `+${sec.meanReturn}%` : `${sec.meanReturn}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
