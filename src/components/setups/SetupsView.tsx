import { useState, useEffect } from 'react';
import { SetupDetection, SetupType } from '../../types';
import { setupService } from '../../services/setupService';
import { Crosshair, AlertTriangle, ArrowRight, Filter, Sliders } from 'lucide-react';
import { formatNPR } from '../../utils/formatters';
import { DataSourceIndicator } from '../layout/DataSourceIndicator';

export function SetupsView({ onSelectStock }: { onSelectStock: (symbol: string) => void }) {
  const [setups, setSetups] = useState<SetupDetection[]>([]);
  const [setupTypes, setSetupTypes] = useState<Array<{ type: SetupType; label: string; description: string }>>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');

  useEffect(() => {
    setupService.getDetectedSetups().then(setSetups);
    setupService.getSetupTypes().then(setSetupTypes);
  }, []);

  const filteredSetups = selectedType === 'ALL'
    ? setups
    : setups.filter(s => s.setupType === selectedType);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto font-mono text-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>PREDEFINED TRADING SETUP DETECTION ENGINE</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Transparent, deterministic rule-based candidate detection. No black-box AI guessing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DataSourceIndicator variant="pill" />
        </div>
      </div>

      <DataSourceIndicator variant="banner" />

      {/* Filter Tabs */}
      <div className="bg-[#111722] border border-slate-800 rounded-lg p-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-slate-400 text-[11px] uppercase mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-cyan-400" /> Pattern:
        </span>
        <button
          onClick={() => setSelectedType('ALL')}
          className={`px-2.5 py-1 rounded text-xs font-semibold ${
            selectedType === 'ALL' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          All Detected ({setups.length})
        </button>
        {setupTypes.map(st => (
          <button
            key={st.type}
            onClick={() => setSelectedType(st.type)}
            className={`px-2.5 py-1 rounded text-xs whitespace-nowrap ${
              selectedType === st.type ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Setup Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSetups.map(setup => (
          <div
            key={setup.id}
            className="bg-[#111722] border border-slate-800 rounded-lg p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectStock(setup.symbol)}
                      className="text-lg font-bold text-cyan-400 hover:underline"
                    >
                      {setup.symbol}
                    </button>
                    <span className="text-slate-400 text-xs">{setup.companyName}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Sector: {setup.sectorName} | Detected: {setup.detectionDate}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-emerald-400">
                    Score: {setup.scores.overall}/100
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-cyan-950 border border-cyan-800 text-cyan-300">
                    {setup.setupName}
                  </span>
                </div>
              </div>

              {/* Price Zones */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#0b0f17] p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Entry Zone</div>
                  <div className="font-bold text-slate-100 mt-0.5">
                    Rs. {setup.entryZoneLow} - {setup.entryZoneHigh}
                  </div>
                </div>
                <div className="bg-[#0b0f17] p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Stop Loss</div>
                  <div className="font-bold text-rose-400 mt-0.5">
                    Rs. {setup.stopLoss}
                  </div>
                </div>
                <div className="bg-[#0b0f17] p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Target 1 &amp; 2</div>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    Rs. {setup.target1} / {setup.target2}
                  </div>
                </div>
                <div className="bg-[#0b0f17] p-2 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400">Risk/Reward</div>
                  <div className="font-bold text-cyan-300 mt-0.5">
                    {setup.riskRewardRatio} : 1
                  </div>
                </div>
              </div>

              {/* Conditions / Reasons */}
              <div className="p-3 bg-[#0b0f17] rounded border border-slate-800 space-y-1">
                <div className="text-[11px] font-bold text-slate-300">CONFIRMATION CRITERIA:</div>
                {setup.reasons.map((r, i) => (
                  <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              {/* Invalidation Rule */}
              <div className="p-2.5 bg-rose-950/20 border border-rose-900/30 rounded text-[11px] text-rose-300 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Deterministic Invalidation:</strong> {setup.invalidationCriteria}
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Confidence: {setup.confidencePercent}%</span>
              <button
                onClick={() => onSelectStock(setup.symbol)}
                className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                Research Stock <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
