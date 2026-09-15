import React from 'react';
import { X, CheckCircle2, AlertTriangle, Calculator, FileText } from 'lucide-react';

interface StateExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  classification: string;
  classificationColor?: string;
  evidence: string[];
  metrics?: Record<string, string | number | boolean | null>;
  formulaDescription?: string;
}

export function StateExplanationModal({
  isOpen,
  onClose,
  title,
  classification,
  classificationColor = 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
  evidence,
  metrics,
  formulaDescription
}: StateExplanationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#0c121e] border border-slate-700/80 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">{title} Explanation</h3>
              <p className="text-[11px] text-slate-400">Deterministic Mathematical State Breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Classification Banner */}
          <div className="p-3.5 rounded-lg border flex items-center justify-between bg-slate-900/40 border-slate-800">
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Assigned State</div>
              <div className="text-lg font-bold text-slate-100 mt-0.5">{title}</div>
            </div>
            <div className={`px-3 py-1 rounded-md text-xs font-mono font-semibold border ${classificationColor}`}>
              {classification}
            </div>
          </div>

          {/* Formula / Rule Description */}
          {formulaDescription && (
            <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-800/80">
              <div className="text-[11px] font-mono text-cyan-400 font-semibold mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                DETERMINISTIC RULE
              </div>
              <div className="text-xs text-slate-300 leading-relaxed font-mono">
                {formulaDescription}
              </div>
            </div>
          )}

          {/* Underlying Metrics Table */}
          {metrics && Object.keys(metrics).length > 0 && (
            <div>
              <div className="text-xs font-mono font-semibold text-slate-300 mb-2">
                Underlying Parameters (As-Of Date)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(metrics).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded bg-slate-900/50 border border-slate-800/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">{key}</span>
                    <span className="text-xs font-mono font-semibold text-slate-200">
                      {val === null ? 'N/A' : typeof val === 'boolean' ? (val ? 'TRUE' : 'FALSE') : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calculated Evidence Chain */}
          <div>
            <div className="text-xs font-mono font-semibold text-slate-300 mb-2">
              Empirical Evidence Chain
            </div>
            <div className="space-y-1.5">
              {evidence.map((line, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2 rounded bg-slate-900/40 border border-slate-800/50 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strict Separation Notice */}
          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300/80 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong>Phase 4A Design Principle:</strong> This is purely an objective description of the underlying state at this exact point in time. It is not an automated buy/sell recommendation.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
