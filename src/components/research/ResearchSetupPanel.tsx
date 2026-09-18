import React, { useState, useEffect } from 'react';
import {
  Settings2,
  Calendar,
  Layers,
  Percent,
  AlertTriangle,
  Sliders,
  DollarSign
} from 'lucide-react';
import {
  ResearchRunConfig,
  EntryModel,
  HoldingHorizon,
  TargetStopParams,
  TransactionCostModel
} from '../../types/historicalResearch';
import { CompanyMaster } from '../../types/dataInfrastructure';
import { normalizedCompanies, normalizedSectors } from '../../data/normalizedMasterData';
import { getCachedCompanies } from '../../data/liveBarsCache';
import { dataService } from '../../services/dataService';

interface ResearchSetupPanelProps {
  config: ResearchRunConfig;
  onChange: (updated: Partial<ResearchRunConfig>) => void;
  onRunResearch: () => void;
  isLoading: boolean;
}

export const ResearchSetupPanel: React.FC<ResearchSetupPanelProps> = ({
  config,
  onChange,
  onRunResearch,
  isLoading
}) => {
  // Mirror the same cache-first, mock-fallback logic historicalResearchService.ts already uses,
  // so the dropdown options always match what a backtest run will actually search.
  const [companies, setCompanies] = useState<CompanyMaster[]>(() => {
    const live = getCachedCompanies();
    return live.length > 0 ? live : normalizedCompanies;
  });
  const [isLiveUniverse, setIsLiveUniverse] = useState<boolean>(() => getCachedCompanies().length > 0);

  useEffect(() => {
    const refresh = () => {
      const live = getCachedCompanies();
      if (live.length > 0) {
        setCompanies(live);
        setIsLiveUniverse(true);
      } else {
        setCompanies(normalizedCompanies);
        setIsLiveUniverse(false);
      }
    };
    refresh();
    const unsubscribe = dataService.subscribe(refresh);
    return () => unsubscribe();
  }, []);

  // Live companies carry sector as a plain name string in sector_id (see SupabaseDataProvider.fetchCompanies);
  // mock companies use normalizedSectors' own id/name pairs. Derive whichever set matches the active source.
  const sectorOptions: { id: string; name: string }[] = isLiveUniverse
    ? Array.from(new Set(companies.map(c => c.sector_id || c.sector || 'Others')))
        .sort()
        .map(name => ({ id: name, name }))
    : normalizedSectors.map(s => ({ id: s.id, name: s.name }));

  return (
    <div className="bg-[#111622] border border-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Settings2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Research Environment Setup
          </h3>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
          {config.runId}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
        {/* Universe Scope */}
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Universe Scope</label>
          <select
            value={config.universe}
            onChange={e =>
              onChange({ universe: e.target.value as 'SINGLE' | 'SECTOR' | 'ALL_NEPSE' })
            }
            className="w-full bg-[#0d111a] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 outline-none"
          >
            <option value="ALL_NEPSE">
              Entire NEPSE Universe ({companies.length} Listed Scrips{isLiveUniverse ? '' : ', MOCK'})
            </option>
            <option value="SECTOR">Sector Basket</option>
            <option value="SINGLE">Single Scrip Benchmark</option>
          </select>
        </div>

        {/* Dynamic Selector based on Universe */}
        {config.universe === 'SINGLE' && (
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Select Scrip {!isLiveUniverse && <span className="text-amber-400">(Mock Data)</span>}
            </label>
            <select
              value={config.selectedSymbol || companies[0]?.symbol || 'CHCL'}
              onChange={e => onChange({ selectedSymbol: e.target.value })}
              className="w-full bg-[#0d111a] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 outline-none"
            >
              {companies.map(c => (
                <option key={c.id} value={c.symbol}>
                  {c.symbol} — {c.company_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {config.universe === 'SECTOR' && (
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Select Sector {!isLiveUniverse && <span className="text-amber-400">(Mock Data)</span>}
            </label>
            <select
              value={config.selectedSector || sectorOptions[0]?.id}
              onChange={e => onChange({ selectedSector: e.target.value })}
              className="w-full bg-[#0d111a] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 outline-none"
            >
              {sectorOptions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Entry Model (Section 5) */}
        <div>
          <label className="block text-slate-400 mb-1 font-medium">
            Entry Model (Section 5)
          </label>
          <select
            value={config.entryModel}
            onChange={e => onChange({ entryModel: e.target.value as EntryModel })}
            className="w-full bg-[#0d111a] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 outline-none"
          >
            <option value="SIGNAL_CLOSE">Signal Bar Close (T Close)</option>
            <option value="NEXT_OPEN">Next Session Open (T+1 Open)</option>
            <option value="NEXT_CLOSE">Next Session Close (T+1 Close)</option>
          </select>
        </div>

        {/* Timeframe */}
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Observation Timeframe</label>
          <select
            value={config.timeframe}
            onChange={e => onChange({ timeframe: e.target.value as any })}
            className="w-full bg-[#0d111a] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 outline-none"
          >
            <option value="DAILY">Daily Trading Sessions (1D)</option>
            <option value="WEEKLY">Weekly Aggregated Sessions (1W)</option>
            <option value="MONTHLY">Monthly Aggregated Sessions (1M)</option>
          </select>
        </div>

        {/* Out-of-Sample Partitioning (Section 26) */}
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Dataset Partition</label>
          <select
            value={config.periodSplit}
            onChange={e =>
              onChange({ periodSplit: e.target.value as 'FULL' | 'TRAIN_VAL_TEST' | 'BY_YEAR' })
            }
            className="w-full bg-[#0d111a] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-cyan-500 outline-none"
          >
            <option value="FULL">Full Historical Dataset</option>
            <option value="TRAIN_VAL_TEST">In-Sample Training Partition (Pre-2026)</option>
          </select>
        </div>
      </div>

      {/* Target, Stop & Transaction Cost Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
        {/* Target / Stop Simulation Parameters */}
        <div className="bg-[#0d111a] border border-slate-800 rounded p-2.5 space-y-2">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span className="flex items-center space-x-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target & Stop Simulation</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div>
              <label className="text-slate-400 block">Target %</label>
              <input
                type="number"
                step="0.5"
                value={config.targetStop?.targetPercent ?? 8}
                onChange={e =>
                  onChange({
                    targetStop: {
                      ...config.targetStop!,
                      targetPercent: parseFloat(e.target.value) || 0
                    }
                  })
                }
                className="w-full bg-[#151b28] border border-slate-700 rounded px-1.5 py-1 text-slate-200"
              />
            </div>
            <div>
              <label className="text-slate-400 block">Stop-Loss %</label>
              <input
                type="number"
                step="0.5"
                value={config.targetStop?.stopLossPercent ?? 4}
                onChange={e =>
                  onChange({
                    targetStop: {
                      ...config.targetStop!,
                      stopLossPercent: parseFloat(e.target.value) || 0
                    }
                  })
                }
                className="w-full bg-[#151b28] border border-slate-700 rounded px-1.5 py-1 text-slate-200"
              />
            </div>
            <div>
              <label className="text-slate-400 block">Max Sessions</label>
              <input
                type="number"
                value={config.targetStop?.maxHoldingBars ?? 15}
                onChange={e =>
                  onChange({
                    targetStop: {
                      ...config.targetStop!,
                      maxHoldingBars: parseInt(e.target.value) || 10
                    }
                  })
                }
                className="w-full bg-[#151b28] border border-slate-700 rounded px-1.5 py-1 text-slate-200"
              />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>Intra-bar Ambiguity:</span>
            <span className="text-amber-400 font-mono">Conservative (Stop Priority)</span>
          </div>
        </div>

        {/* Nepal Transaction Cost Model */}
        <div className="bg-[#0d111a] border border-slate-800 rounded p-2.5 space-y-2">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span className="flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>NEPSE Transaction Costs</span>
            </span>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={config.costs.includeCosts}
                onChange={e =>
                  onChange({
                    costs: { ...config.costs, includeCosts: e.target.checked }
                  })
                }
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="text-[10px] text-slate-400">Apply Costs</span>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div>
              <label className="text-slate-400 block">Brokerage %</label>
              <span className="text-slate-300 font-mono">0.35%</span>
            </div>
            <div>
              <label className="text-slate-400 block">SEBON Fee</label>
              <span className="text-slate-300 font-mono">0.015%</span>
            </div>
            <div>
              <label className="text-slate-400 block">CGT on Gain</label>
              <span className="text-slate-300 font-mono">5.0%</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 italic">
            {config.costs.includeCosts
              ? 'Net returns deduct roundtrip brokerage, regulatory fees, and capital gains tax.'
              : 'Gross returns shown (costs excluded).'}
          </div>
        </div>

        {/* Action Button */}
        <div className="bg-[#0d111a] border border-slate-800 rounded p-2.5 flex flex-col justify-between">
          <div className="text-[11px] text-slate-400">
            Strict Temporal Causality enforced. Data version:{' '}
            <span className="font-mono text-slate-300">{config.datasetVersion}</span>
          </div>
          <button
            onClick={onRunResearch}
            disabled={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-slate-900 font-semibold py-2 px-4 rounded text-xs tracking-wider uppercase transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-cyan-950/50"
          >
            {isLoading ? (
              <span>Running Backtest Engine...</span>
            ) : (
              <>
                <Sliders className="w-3.5 h-3.5" />
                <span>Execute Historical Research</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
