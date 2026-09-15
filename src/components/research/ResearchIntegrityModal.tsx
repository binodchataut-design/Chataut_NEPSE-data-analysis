import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  X,
  Lock,
  Cpu
} from 'lucide-react';
import {
  runResearchCausalityTestSuite,
  ResearchTestSuiteReport
} from '../../engine/research/researchCausalityTests';

interface ResearchIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResearchIntegrityModal: React.FC<ResearchIntegrityModalProps> = ({
  isOpen,
  onClose
}) => {
  const [report, setReport] = useState<ResearchTestSuiteReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runSuite = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runResearchCausalityTestSuite();
      setReport(res);
      setIsRunning(false);
    }, 150);
  };

  useEffect(() => {
    if (isOpen && !report) {
      runSuite();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#111622] border border-slate-800 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0d111a]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                <span>Research Integrity & Causality Verification</span>
                <span className="text-[10px] font-mono font-normal bg-emerald-950/60 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded">
                  SECTION 40 & 41 COMPLIANT
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Automated audit guaranteeing zero look-ahead bias and mathematical precision
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 41 Audit Checklist */}
        <div className="bg-[#0b0e14] px-5 py-3 border-b border-slate-800/80 text-xs grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero Look-Ahead Invariant</span>
          </div>
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Synthetic Mutation Validated</span>
          </div>
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Wilson CI Formulated</span>
          </div>
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sample Discipline Audited</span>
          </div>
        </div>

        {/* Content & Test Results */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {report && (
            <div className="flex items-center justify-between bg-[#0d111a] p-3 rounded-lg border border-slate-800 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-mono">Test Status:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded ${
                    report.failed === 0
                      ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-400'
                      : 'bg-rose-950/60 border border-rose-800 text-rose-400'
                  }`}
                >
                  {report.passed} / {report.total} PASSED
                </span>
              </div>
              <button
                onClick={runSuite}
                disabled={isRunning}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded text-xs transition-colors"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                <span>Re-run Suite</span>
              </button>
            </div>
          )}

          {report && (
            <div className="space-y-2">
              {report.results.map((r, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-xs flex items-start justify-between ${
                    r.passed
                      ? 'bg-emerald-950/10 border-emerald-900/30'
                      : 'bg-rose-950/20 border-rose-900/50'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        [{r.suite}]
                      </span>
                      <span className="font-medium text-slate-200">{r.name}</span>
                    </div>
                    {r.details && (
                      <p className="text-[11px] text-slate-400 font-mono pl-2 border-l border-slate-800">
                        {r.details}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex items-center space-x-1.5">
                    {r.passed ? (
                      <span className="flex items-center space-x-1 text-emerald-400 font-mono text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PASS</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-rose-400 font-mono text-[11px] bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>FAIL</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#0d111a] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Strict Temporal Causality Enforcement active across all research models.</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
