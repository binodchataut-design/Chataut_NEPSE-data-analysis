import { useState, useEffect } from 'react';
import { Settings, Sliders, Database, RotateCcw, CheckCircle, Info } from 'lucide-react';
import { ScoringWeights, DataSourceMode } from '../../types';
import { scoringService } from '../../services/scoringService';
import { dataService } from '../../services/dataService';

export function SettingsView() {
  const [weights, setWeights] = useState<ScoringWeights>(scoringService.getWeights());
  const [dataMode, setDataMode] = useState<DataSourceMode>(dataService.getMode());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setWeights(scoringService.getWeights());
  }, []);

  const handleSliderChange = (key: keyof ScoringWeights, value: number) => {
    const updated = { ...weights, [key]: value };
    setWeights(updated);
    scoringService.setWeights(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaults: ScoringWeights = {
      technical: 30,
      fundamental: 25,
      market: 15,
      broker: 15,
      risk: 15,
    };
    setWeights(defaults);
    scoringService.setWeights(defaults);
  };

  const handleToggleDataMode = () => {
    const nextMode: DataSourceMode = dataMode === 'MOCK_DATA' ? 'REAL_DATA' : 'MOCK_DATA';
    dataService.setMode(nextMode);
    setDataMode(nextMode);
  };

  const totalWeight =
    weights.technical +
    weights.fundamental +
    weights.market +
    weights.broker +
    weights.risk;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>SCORING ENGINE WEIGHTS &amp; SYSTEM CONFIGURATION</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Deterministic opportunity scoring formulas and operational data mode toggles
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> Weights Updated
            </span>
          )}
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scoring Engine Configurable Weights */}
        <div className="bg-[#111722] border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-slate-200 text-sm">
                Opportunity Scoring Formula Weights (Total: {totalWeight}%)
              </h2>
            </div>
          </div>

          <p className="text-slate-400 text-[11px] font-sans">
            Adjust the mathematical weight assigned to each analytical dimension. Changes immediately re-rank the Opportunity Scanner.
          </p>

          <div className="space-y-4 pt-2">
            {[
              { key: 'technical', label: 'Technical Score Weight', desc: 'Trend, momentum, volume expansion, structure' },
              { key: 'fundamental', label: 'Fundamental Score Weight', desc: 'ROE, EPS growth, debt/equity, valuation' },
              { key: 'market', label: 'Market Condition Weight', desc: 'NEPSE index regime, advance/decline ratio' },
              { key: 'broker', label: 'Broker Floor Activity Weight', desc: 'Institutional accumulation vs distribution' },
              { key: 'risk', label: 'Risk/Reward Asymmetry Weight', desc: 'Distance to stop loss vs target upside ratio' },
            ].map(item => {
              const val = weights[item.key as keyof ScoringWeights];
              return (
                <div key={item.key} className="space-y-1.5 bg-[#0c1018] p-3 rounded border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">{item.label}</span>
                    <span className="text-cyan-300 font-bold">{val}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={val}
                    onChange={e => handleSliderChange(item.key as keyof ScoringWeights, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Mode & System Status */}
        <div className="space-y-6">
          {/* Data Mode Switch */}
          <div className="bg-[#111722] border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Database className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-slate-200 text-sm">Operational Data Mode Switch</h2>
            </div>

            <div className="p-3.5 bg-[#0c1018] rounded border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-100 text-sm">
                  Active Mode: <span className={dataMode === 'MOCK_DATA' ? 'text-amber-400' : 'text-emerald-400'}>{dataMode}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {dataMode === 'MOCK_DATA'
                    ? 'Using high-fidelity labeled NEPSE mock data for architecture testing.'
                    : 'Configured for live external API & floor sheet scrape feeds.'}
                </div>
              </div>

              <button
                onClick={handleToggleDataMode}
                className="px-3 py-1.5 rounded text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                Switch to {dataMode === 'MOCK_DATA' ? 'REAL' : 'MOCK'}
              </button>
            </div>

            <div className="p-3 bg-[#0d121c] rounded border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="text-cyan-400 font-semibold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Deterministic System Architecture Guarantee:</span>
              </div>
              <p>
                Trading signals and scores are 100% computed mathematically from pure indicator logic, financial ratios, and floor sheet volume. AI models are strictly reserved for qualitative explanations and never generate trading signals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
