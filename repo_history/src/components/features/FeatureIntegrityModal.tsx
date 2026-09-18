/**
 * Feature Integrity & Causality Audit Modal for Phase 3C
 * Real-time runner for synthetic future mutation tests, zero look-ahead assertions,
 * and mathematical accuracy verifications.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Layers,
  Sparkles,
  Lock,
  X
} from 'lucide-react';
import {
  FeatureCausalityTests,
  FeatureTestReport
} from '../../engine/features/featureCausalityTests';

interface FeatureIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeatureIntegrityModal: React.FC<FeatureIntegrityModalProps> = ({
  isOpen,
  onClose
}) => {
  const [reports, setReports] = useState<FeatureTestReport[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    // Simulate brief asynchronous execution
    await new Promise(r => setTimeout(r, 400));
    const results = await FeatureCausalityTests.runAllTests();
    setReports(results);
    setIsRunning(false);
    setHasRun(true);
  };

  useEffect(() => {
    if (isOpen && !hasRun) {
      runTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = reports.filter(r => r.passed).length;
  const failedCount = reports.length - passedCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Feature Causality & Mathematical Audit
              </h2>
              <p className="text-xs text-slate-500">
                Automated synthetic future mutations, rolling z-score isolation, and FDR validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Audit Status:</span>
              {isRunning ? (
                <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Running Verification Suite...
                </span>
              ) : hasRun ? (
                failedCount === 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All {reports.length} Tests Passed (Zero Leakage)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                    <AlertTriangle className="w-3.5 h-3.5" /> {failedCount} Tests Failed
                  </span>
                )
              ) : (
                <span className="text-xs text-slate-400">Awaiting execution</span>
              )}
            </div>
            {hasRun && (
              <div className="text-xs text-slate-400 border-l border-slate-200 pl-4">
                Passed: <strong className="text-emerald-600">{passedCount}</strong> / {reports.length}
              </div>
            )}
          </div>

          <button
            onClick={runTests}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
          >
            <Play className="w-3.5 h-3.5" /> Re-run Suite
          </button>
        </div>

        {/* Test List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {reports.map(report => (
            <div
              key={report.id}
              className={`p-4 rounded-lg border transition ${
                report.passed
                  ? 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                  : 'bg-rose-50/60 border-rose-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {report.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {report.id}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-800">{report.name}</h3>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          report.category === 'LEAKAGE'
                            ? 'bg-purple-100 text-purple-700'
                            : report.category === 'NORMALIZATION'
                            ? 'bg-blue-100 text-blue-700'
                            : report.category === 'STATISTICS'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {report.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{report.message}</p>
                    {report.details && (
                      <p className="text-[11px] font-mono text-slate-400 mt-1 bg-white px-2 py-1 rounded border border-slate-100 inline-block">
                        {report.details}
                      </p>
                    )}
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    report.passed
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                      : 'text-rose-700 bg-rose-50 border border-rose-200'
                  }`}
                >
                  {report.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Strict zero-lookahead bias enforced across all feature vectors & partitions.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
