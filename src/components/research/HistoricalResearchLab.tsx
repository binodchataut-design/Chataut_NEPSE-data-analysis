import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ResearchRunConfig,
  ResearchResult,
  ConditionGroup
} from '../../types/historicalResearch';
import { historicalResearchService } from '../../services/historicalResearchService';
import { SignalConditionEngine } from '../../engine/research/signalConditionEngine';
import { ResearchSetupPanel } from './ResearchSetupPanel';
import { ConditionBuilderPanel } from './ConditionBuilderPanel';
import { ResearchMetricsCard } from './ResearchMetricsCard';
import { ResearchVisualizations } from './ResearchVisualizations';
import { ResearchAuditTable } from './ResearchAuditTable';
import { ResearchIntegrityModal } from './ResearchIntegrityModal';
import { DataSourceIndicator } from '../layout/DataSourceIndicator';
import { dataService } from '../../services/dataService';

export const HistoricalResearchLab: React.FC = () => {
  const [config, setConfig] = useState<ResearchRunConfig>(() => {
    const defaultPresets = SignalConditionEngine.getStandardConditionPresets();
    return {
      runId: 'RUN-2026-000001',
      createdAt: new Date().toISOString(),
      datasetVersion: 'NEPSE-NORM-2026.1',
      indicatorVersions: {
        RSI: 'RSI_v1',
        SMA: 'SMA_v1',
        EMA: 'EMA_v1',
        MACD: 'MACD_v1',
        BOLLINGER: 'BOLL_v1',
        ADX: 'ADX_v1'
      },
      universe: 'ALL_NEPSE',
      selectedSymbol: 'CHCL',
      timeframe: 'DAILY',
      dateRange: {},
      periodSplit: 'FULL',
      entryModel: 'SIGNAL_CLOSE',
      horizons: [1, 3, 5, 10, 20, 30, 60],
      targetStop: {
        targetPercent: 8,
        stopLossPercent: 4,
        maxHoldingBars: 15,
        ambiguousBarRule: 'CONSERVATIVE_STOP'
      },
      costs: {
        includeCosts: false,
        brokeragePercent: 0.35,
        sebonFeePercent: 0.015,
        dpFeeNpr: 25,
        capitalGainsTaxPercent: 5.0,
        slippagePercent: 0.1
      },
      conditionTree: defaultPresets[0].tree,
      conditionLabel: defaultPresets[0].label
    };
  });

  const [result, setResult] = useState<ResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIntegrityOpen, setIsIntegrityOpen] = useState(false);

  // Run research when component mounts or user requests
  const handleExecuteResearch = async (overrideConfig?: Partial<ResearchRunConfig>) => {
    setIsLoading(true);
    try {
      const activeConfig = overrideConfig ? { ...config, ...overrideConfig } : config;
      const res = await historicalResearchService.executeResearch(activeConfig);
      setResult(res);
      setConfig(res.runConfig);
    } catch (err) {
      console.error('Historical research run error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleExecuteResearch();
  }, []);

  const handleConfigChange = (updated: Partial<ResearchRunConfig>) => {
    setConfig(prev => ({ ...prev, ...updated }));
  };

  const handleApplyCondition = (tree: ConditionGroup, label: string) => {
    const updated = { ...config, conditionTree: tree, conditionLabel: label };
    setConfig(updated);
    handleExecuteResearch(updated);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111622] border border-slate-800 p-4 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-wide">
                Historical Research & Backtesting Laboratory
              </h1>
              <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 px-2 py-0.5 rounded">
                PHASE 3B
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Empirical historical relationship engine strictly adhering to temporal causality and zero look-ahead bias
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <DataSourceIndicator variant="pill" />

          {/* Integrity Audit Modal Trigger */}
          <button
            onClick={() => setIsIntegrityOpen(true)}
            className="flex items-center space-x-1.5 bg-[#0d111a] hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Causality Audit (15 Tests)</span>
          </button>
        </div>
      </div>

      <DataSourceIndicator variant="banner" />

      {/* Multiple Testing & Scientific Disclaimer Banner (Section 28 & 36) */}
      <div className="bg-amber-950/20 border border-amber-800/50 rounded-lg p-3 text-xs text-amber-300/90 flex items-start space-x-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div>
            <span className="font-bold">Data Provenance & Scientific Discipline: </span>
            {dataService.getMode() === 'MOCK_DATA' ? (
              <span className="text-amber-200 font-semibold">
                [SIMULATED DATASET NOTICE] Research findings currently derive from calibrated sample/mock historical data. Do not cite these test runs as empirical live NEPSE evidence.
              </span>
            ) : (
              <span className="text-cyan-200 font-semibold">
                [LIVE / HISTORICAL FEED] Operating against authenticated upstream exchange records.
              </span>
            )}
          </div>
          <div className="text-slate-400 text-[11px]">
            This engine measures historical frequency and empirical forward outcome distributions. Historical relationships do not guarantee future returns. No predictive extrapolation is applied.
          </div>
        </div>
      </div>

      {/* 1. Research Setup Panel (Universe, Timeframe, Entry Model, Target/Stop, Costs) */}
      <ResearchSetupPanel
        config={config}
        onChange={handleConfigChange}
        onRunResearch={() => handleExecuteResearch()}
        isLoading={isLoading}
      />

      {/* 2. Signal Condition Framework & Parameter Sweep (Section 14, 16, 17) */}
      <ConditionBuilderPanel
        currentTree={config.conditionTree}
        currentLabel={config.conditionLabel}
        onApplyCondition={handleApplyCondition}
      />

      {/* 3. Performance Metrics & Sample Size Warnings (Section 9, 10, 11, 12, 18, 19, 20) */}
      {result && <ResearchMetricsCard result={result} />}

      {/* 4. Empirical Visualizations (Section 33) */}
      {result && <ResearchVisualizations result={result} />}

      {/* 5. Event Audit Table & CSV Export (Section 34 & 35) */}
      {result && <ResearchAuditTable result={result} />}

      {/* Section 41 Integrity & Causality Verification Modal */}
      <ResearchIntegrityModal
        isOpen={isIntegrityOpen}
        onClose={() => setIsIntegrityOpen(false)}
      />
    </div>
  );
};
