import React, { useState } from 'react';
import {
  Sparkles,
  GitBranch,
  SlidersHorizontal,
  Plus,
  Trash2,
  HelpCircle,
  AlertTriangle,
  Play
} from 'lucide-react';
import {
  ConditionGroup,
  SingleCondition,
  ParameterSweepResult
} from '../../types/historicalResearch';
import { SignalConditionEngine } from '../../engine/research/signalConditionEngine';
import { historicalResearchService } from '../../services/historicalResearchService';

interface ConditionBuilderPanelProps {
  currentTree: ConditionGroup;
  currentLabel: string;
  onApplyCondition: (tree: ConditionGroup, label: string) => void;
  onRunSweep?: (sweepResult: ParameterSweepResult) => void;
}

export const ConditionBuilderPanel: React.FC<ConditionBuilderPanelProps> = ({
  currentTree,
  currentLabel,
  onApplyCondition,
  onRunSweep
}) => {
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'CUSTOM' | 'SWEEP'>('PRESETS');
  const presets = SignalConditionEngine.getStandardConditionPresets();

  // Custom condition state
  const [operator, setOperator] = useState<'AND' | 'OR'>('AND');
  const [conditionsList, setConditionsList] = useState<SingleCondition[]>([
    {
      id: 'c1',
      indicator: 'RSI',
      field: 'rsi',
      comparator: '<',
      thresholdType: 'VALUE',
      thresholdValue: 30,
      description: 'RSI(14) < 30'
    }
  ]);

  // Sweep state
  const [sweepIndicator, setSweepIndicator] = useState<string>('RSI');
  const [sweepValues, setSweepValues] = useState<string>('20, 25, 30, 35, 40');
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState<ParameterSweepResult | null>(null);

  const handleAddCondition = () => {
    const newId = `c${Date.now()}`;
    setConditionsList(prev => [
      ...prev,
      {
        id: newId,
        indicator: 'CLOSE',
        field: 'close',
        comparator: '>',
        thresholdType: 'INDICATOR_FIELD',
        targetIndicator: 'SMA50',
        targetField: 'sma',
        multiplier: 1.0,
        description: 'Close > SMA(50)'
      }
    ]);
  };

  const handleRemoveCondition = (id: string) => {
    if (conditionsList.length <= 1) return;
    setConditionsList(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateCondition = (id: string, partial: Partial<SingleCondition>) => {
    setConditionsList(prev =>
      prev.map(c => (c.id === id ? { ...c, ...partial } : c))
    );
  };

  const handleApplyCustom = () => {
    const tree: ConditionGroup = {
      operator,
      conditions: conditionsList
    };
    const label = conditionsList
      .map(c => {
        if (c.thresholdType === 'VALUE') {
          return `${c.indicator} ${c.comparator} ${c.thresholdValue}`;
        }
        return `${c.indicator} ${c.comparator} ${c.targetIndicator}`;
      })
      .join(` ${operator} `);

    onApplyCondition(tree, label);
  };

  const handleExecuteSweep = async () => {
    setIsSweeping(true);
    try {
      const thresholds = sweepValues
        .split(',')
        .map(v => parseFloat(v.trim()))
        .filter(v => !isNaN(v));

      const result = await historicalResearchService.executeParameterSweep(
        sweepIndicator,
        `${sweepIndicator} Threshold`,
        thresholds,
        {}
      );
      setSweepResult(result);
      if (onRunSweep) onRunSweep(result);
    } finally {
      setIsSweeping(false);
    }
  };

  return (
    <div className="bg-[#111622] border border-slate-800 rounded-lg p-4 space-y-4">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Signal Condition Framework (Section 14 & 17)
          </h3>
        </div>

        <div className="flex space-x-1 bg-[#0d111a] p-1 rounded border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('PRESETS')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'PRESETS'
                ? 'bg-cyan-600 text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Library Presets
          </button>
          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'CUSTOM'
                ? 'bg-cyan-600 text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom Tree Builder
          </button>
          <button
            onClick={() => setActiveTab('SWEEP')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'SWEEP'
                ? 'bg-cyan-600 text-slate-900 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Parameter Sweep (Section 16)
          </button>
        </div>
      </div>

      {/* Active Condition Badge */}
      <div className="flex items-center justify-between text-xs bg-[#0d111a] border border-slate-800 px-3 py-2 rounded">
        <span className="text-slate-400 font-mono">Active Condition:</span>
        <span className="text-cyan-300 font-mono font-semibold bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded">
          {currentLabel}
        </span>
      </div>

      {/* Tab 1: Library Presets */}
      {activeTab === 'PRESETS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {presets.map(p => {
            const isSelected = currentLabel === p.label;
            return (
              <div
                key={p.id}
                onClick={() => onApplyCondition(p.tree, p.label)}
                className={`cursor-pointer p-2.5 rounded border transition-all ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-sm shadow-cyan-900/30'
                    : 'bg-[#0d111a] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-200">{p.label}</span>
                  {isSelected && (
                    <span className="text-[10px] text-cyan-400 font-mono">SELECTED</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Custom Tree Builder */}
      {activeTab === 'CUSTOM' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Combine logic with:</span>
              <select
                value={operator}
                onChange={e => setOperator(e.target.value as 'AND' | 'OR')}
                className="bg-[#0d111a] border border-slate-700 rounded px-2 py-1 text-cyan-400 font-mono font-semibold"
              >
                <option value="AND">AND (All conditions must be satisfied)</option>
                <option value="OR">OR (Any condition satisfied)</option>
              </select>
            </div>
            <button
              onClick={handleAddCondition}
              className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Sub-Condition</span>
            </button>
          </div>

          <div className="space-y-2">
            {conditionsList.map((cond, idx) => (
              <div
                key={cond.id}
                className="flex items-center space-x-2 bg-[#0d111a] border border-slate-800 p-2 rounded text-xs"
              >
                <span className="text-slate-500 font-mono w-6">#{idx + 1}</span>

                {/* Primary Indicator */}
                <select
                  value={cond.indicator}
                  onChange={e =>
                    handleUpdateCondition(cond.id, {
                      indicator: e.target.value,
                      field: e.target.value.toLowerCase()
                    })
                  }
                  className="bg-[#151b28] border border-slate-700 rounded px-2 py-1 text-slate-200"
                >
                  <option value="RSI">RSI(14)</option>
                  <option value="CLOSE">Close Price</option>
                  <option value="VOLUME">Trading Volume</option>
                  <option value="SMA20">SMA (20)</option>
                  <option value="SMA50">SMA (50)</option>
                  <option value="EMA20">EMA (20)</option>
                  <option value="MACD">MACD Line</option>
                  <option value="ADX">ADX (14)</option>
                  <option value="BOLLINGER">Bollinger Bands</option>
                  <option value="CMF">Chaikin Money Flow</option>
                </select>

                {/* Operator */}
                <select
                  value={cond.comparator}
                  onChange={e =>
                    handleUpdateCondition(cond.id, {
                      comparator: e.target.value as any
                    })
                  }
                  className="bg-[#151b28] border border-slate-700 rounded px-2 py-1 text-cyan-400 font-mono font-semibold"
                >
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                  <option value="CROSSES_ABOVE">Crosses Above</option>
                  <option value="CROSSES_BELOW">Crosses Below</option>
                  <option value="INCREASING">Increasing</option>
                </select>

                {/* Threshold Type */}
                <select
                  value={cond.thresholdType}
                  onChange={e =>
                    handleUpdateCondition(cond.id, {
                      thresholdType: e.target.value as any
                    })
                  }
                  className="bg-[#151b28] border border-slate-700 rounded px-2 py-1 text-slate-200"
                >
                  <option value="VALUE">Fixed Constant Value</option>
                  <option value="INDICATOR_FIELD">Another Indicator / MA</option>
                </select>

                {cond.thresholdType === 'VALUE' ? (
                  <input
                    type="number"
                    step="0.1"
                    value={cond.thresholdValue ?? 30}
                    onChange={e =>
                      handleUpdateCondition(cond.id, {
                        thresholdValue: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-24 bg-[#151b28] border border-slate-700 rounded px-2 py-1 text-slate-200"
                  />
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <select
                      value={cond.targetIndicator || 'SMA50'}
                      onChange={e =>
                        handleUpdateCondition(cond.id, { targetIndicator: e.target.value })
                      }
                      className="bg-[#151b28] border border-slate-700 rounded px-2 py-1 text-slate-200"
                    >
                      <option value="SMA20">SMA(20)</option>
                      <option value="SMA50">SMA(50)</option>
                      <option value="SMA200">SMA(200)</option>
                      <option value="VOLUMESMA20">Volume SMA(20)</option>
                      <option value="BOLLINGER">Bollinger Upper</option>
                    </select>
                    <span className="text-slate-400">×</span>
                    <input
                      type="number"
                      step="0.1"
                      value={cond.multiplier ?? 1.0}
                      onChange={e =>
                        handleUpdateCondition(cond.id, {
                          multiplier: parseFloat(e.target.value) || 1.0
                        })
                      }
                      className="w-16 bg-[#151b28] border border-slate-700 rounded px-1.5 py-1 text-slate-200"
                    />
                  </div>
                )}

                {conditionsList.length > 1 && (
                  <button
                    onClick={() => handleRemoveCondition(cond.id)}
                    className="text-rose-400 hover:text-rose-300 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleApplyCustom}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-semibold py-1.5 rounded text-xs tracking-wider uppercase transition-colors"
          >
            Apply Custom Condition Tree
          </button>
        </div>
      )}

      {/* Tab 3: Parameter Sweep (Section 16 & 28) */}
      {activeTab === 'SWEEP' && (
        <div className="space-y-4">
          <div className="bg-amber-950/20 border border-amber-800/40 rounded p-2.5 text-xs text-amber-300/90 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Section 28 Multiple-Testing Protection: </span>
              Sweeping multiple thresholds increases the probability of false historical discovery.
              The peak-performing threshold must NOT be treated as an optimized or guaranteed strategy.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Indicator to Sweep</label>
              <select
                value={sweepIndicator}
                onChange={e => setSweepIndicator(e.target.value)}
                className="w-full bg-[#0d111a] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
              >
                <option value="RSI">RSI Thresholds (e.g. 20, 25, 30, 35, 40)</option>
                <option value="ADX">ADX Trend Level (e.g. 15, 20, 25, 30)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1">Threshold Values (Comma Separated)</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={sweepValues}
                  onChange={e => setSweepValues(e.target.value)}
                  className="flex-1 bg-[#0d111a] border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  placeholder="20, 25, 30, 35, 40"
                />
                <button
                  onClick={handleExecuteSweep}
                  disabled={isSweeping}
                  className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-slate-900 font-semibold px-4 py-1.5 rounded text-xs flex items-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isSweeping ? 'Sweeping...' : 'Run Sweep'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sweep Results Table */}
          {sweepResult && (
            <div className="border border-slate-800 rounded overflow-hidden">
              <div className="bg-[#0d111a] px-3 py-2 border-b border-slate-800 text-xs font-semibold text-slate-200 flex justify-between">
                <span>Sweep Landscape: {sweepResult.indicator} across {sweepResult.testedValues.length} levels (10D Horizon)</span>
                <span className="text-cyan-400 font-mono">Completed</span>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0b0e14] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2">Condition</th>
                    <th className="p-2 text-right">Observations</th>
                    <th className="p-2 text-right">Win Rate</th>
                    <th className="p-2 text-right">95% Wilson CI</th>
                    <th className="p-2 text-right">Mean Return</th>
                    <th className="p-2 text-right">Expectancy</th>
                    <th className="p-2 text-right">Profit Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                  {sweepResult.items.map(item => (
                    <tr key={item.paramValue} className="hover:bg-slate-800/30">
                      <td className="p-2 font-medium text-slate-200">{item.paramLabel}</td>
                      <td className="p-2 text-right">{item.observations}</td>
                      <td className="p-2 text-right text-emerald-400 font-semibold">
                        {item.winRate}%
                      </td>
                      <td className="p-2 text-right text-slate-400 text-[11px]">
                        [{item.ciLower}% – {item.ciUpper}%]
                      </td>
                      <td
                        className={`p-2 text-right font-semibold ${
                          item.meanReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.meanReturn > 0 ? `+${item.meanReturn}%` : `${item.meanReturn}%`}
                      </td>
                      <td className="p-2 text-right">{item.expectancy}%</td>
                      <td className="p-2 text-right">
                        {item.profitFactor !== null ? item.profitFactor : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
