import React, { useState } from 'react';
import { X, Play, CheckCircle, XCircle, ShieldCheck, AlertCircle, RefreshCw, Cpu } from 'lucide-react';
import { Phase4ACausalityTests, Phase4ATestResult } from '../../engine/validation/phase4ACausalityTests';

interface Phase4ATestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Phase4ATestModal({ isOpen, onClose }: Phase4ATestModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<Phase4ATestResult[] | null>(null);

  if (!isOpen) return null;

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const results = await Phase4ACausalityTests.runAllTests();
      setTestResults(results);
    } catch (err) {
      console.error('Test execution failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const passedCount = testResults ? testResults.filter(r => r.passed).length : 0;
  const totalCount = testResults ? testResults.length : 0;
  const allPassed = testResults && passedCount === totalCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#0b101b] border border-slate-700/80 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Phase 4A Causality & Regression Test Suite</h3>
              <p className="text-[11px] text-slate-400">Zero Look-Ahead Bias, Future Mutation Invariance & Point-In-Time Tests</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action / Summary Bar */}
        <div className="px-5 py-3 border-b border-slate-800/70 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Running Suite...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Execute 9 Unit & Causality Tests
                </>
              )}
            </button>
            {testResults && (
              <span className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded border ${
                allPassed
                  ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                  : 'text-rose-400 bg-rose-950/40 border-rose-500/30'
              }`}>
                {passedCount} / {totalCount} PASSED
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Deterministic Engine v4A.1.0
          </span>
        </div>

        {/* Results List */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
          {!testResults && !isRunning && (
            <div className="text-center py-10 text-slate-400 text-xs">
              <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              Click &quot;Execute 9 Unit &amp; Causality Tests&quot; to verify zero look-ahead bias, structural consistency, and future mutation invariance.
            </div>
          )}

          {testResults && testResults.map(test => (
            <div
              key={test.id}
              className={`p-3 rounded-lg border transition-all ${
                test.passed
                  ? 'bg-slate-900/40 border-slate-800'
                  : 'bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {test.passed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="text-xs font-mono font-semibold text-slate-200">
                    {test.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80">
                    {test.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">
                    {test.executionTimeMs}ms
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    test.passed ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'
                  }`}>
                    {test.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400 pl-6 leading-relaxed">
                {test.message}
              </div>

              {test.details && (
                <div className="mt-2 text-[11px] font-mono text-slate-400 bg-black/40 p-2 rounded ml-6 border border-slate-800/60">
                  {test.details}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/40 flex justify-between items-center">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
            Zero Look-Ahead Bias Guarantee (Section 61 Compliance)
          </div>
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
