import { X, BookOpen, AlertTriangle, Layers } from 'lucide-react';
import { IndicatorDefinition } from '../../types/technicalIndicators';
import { TECHNICAL_INDICATOR_DOCS } from '../../docs/technicalDocumentation';

interface Props {
  indicator: IndicatorDefinition | null;
  onClose: () => void;
}

export function IndicatorInspectorModal({ indicator, onClose }: Props) {
  if (!indicator) return null;

  const doc = TECHNICAL_INDICATOR_DOCS[indicator.id];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e141f] border border-cyan-800/60 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 text-slate-200 font-sans text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/60 border border-cyan-700/50 rounded-lg text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">{indicator.name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 border border-cyan-800 text-cyan-300">
                  {indicator.id} • {indicator.calculationVersion}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">{indicator.category} Indicator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Overview */}
          <div>
            <h3 className="text-xs uppercase font-mono font-bold text-cyan-400 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Description & Method
            </h3>
            <p className="text-slate-300 leading-relaxed">{indicator.description}</p>
          </div>

          {/* Mathematical Formula */}
          {doc && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 font-mono">
              <div className="text-[11px] text-slate-400 uppercase mb-2">Mathematical Formulation</div>
              <div className="bg-black/50 p-2.5 rounded border border-slate-800 text-cyan-300 text-sm overflow-x-auto">
                <code>{doc.formulaLatex}</code>
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-[11px] text-slate-400 uppercase mb-1">Execution Steps:</div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                  {doc.calculationSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Parameters & Data Requirements */}
          <div>
            <h3 className="text-xs uppercase font-mono font-bold text-cyan-400 mb-2">
              Parameters & Warmup Specifications
            </h3>
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[10px] text-slate-400 uppercase font-mono">
                    <th className="py-2 px-3">Parameter</th>
                    <th className="py-2 px-3">Default</th>
                    <th className="py-2 px-3">Range / Type</th>
                    <th className="py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-[11px]">
                  {Object.entries(indicator.parameters).map(([key, p]) => (
                    <tr key={key} className="hover:bg-slate-800/20">
                      <td className="py-2 px-3 font-mono font-bold text-white">{p.name} ({key})</td>
                      <td className="py-2 px-3 font-mono text-cyan-400">{String(p.default)}</td>
                      <td className="py-2 px-3 text-slate-400">{p.min !== undefined ? `${p.min} - ${p.max}` : p.type}</td>
                      <td className="py-2 px-3 text-slate-300">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span className="text-amber-400 font-bold">Warmup Window:</span>
              <span>{typeof indicator.warmupPeriod === 'number' ? `${indicator.warmupPeriod} bars` : 'Dynamic based on lookback'}</span>
              <span className="text-slate-500">• Returns null during warmup to prevent look-ahead & truncation distortion</span>
            </div>
          </div>

          {/* NEPSE Market Microstructure Caveats */}
          {doc && doc.nepseMarketCaveats.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-3.5">
              <h3 className="text-xs uppercase font-mono font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> NEPSE Market Microstructure Considerations
              </h3>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {doc.nepseMarketCaveats.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Zero Look-Ahead Bias & Research Guarantee */}
          <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-[11px] text-emerald-300 flex items-start gap-2">
            <span className="font-bold font-mono">AUDITED:</span>
            <span>
              This calculation conforms strictly to the Zero Look-Ahead Bias contract. No future prices or revisions are accessible by the engine at historical index <code>i</code>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
