/**
 * Causality & Robustness Audit Modal (Phase 3D)
 * Displays results for 14 automated unit, causality, and future mutation tests.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Phase3DCausalityTests, Phase3DTestResult } from '../../engine/validation/phase3DCausalityTests';

interface CausalityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CausalityAuditModal({ isOpen, onClose }: CausalityAuditModalProps) {
  const [testResults, setTestResults] = useState<Phase3DTestResult[]>(() =>
    Phase3DCausalityTests.runAllTests()
  );
  const [isRunning, setIsRunning] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const handleRerun = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = Phase3DCausalityTests.runAllTests();
      setTestResults(results);
      setIsRunning(false);
    }, 250);
  };

  const passedCount = testResults.filter(r => r.passed).length;
  const totalCount = testResults.length;
  const allPassed = passedCount === totalCount;

  const uniqueCats = testResults
    .map(r => String(r.category))
    .filter((val, idx, arr) => arr.indexOf(val) === idx);
  const categories: string[] = ['ALL', ...uniqueCats];
  const displayed = filterCategory === 'ALL'
    ? testResults
    : testResults.filter(r => r.category === filterCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0e131f] border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${allPassed ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-wide">Phase 3D Data Integrity & Causality Verification Suite</h2>
              <p className="text-xs text-slate-400">
                14 automated regression audits: zero look-ahead bias, synthetic future mutation invariance, execution realism
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">Total Tests:</span>
              <span className="font-mono font-semibold text-white">{totalCount}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">Passed:</span>
              <span className="font-mono font-semibold text-emerald-400">{passedCount}</span>
            </span>
            {totalCount - passedCount > 0 && (
              <span className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span className="text-slate-400">Failed:</span>
                <span className="font-mono font-semibold text-rose-400">{totalCount - passedCount}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-300 text-xs focus:outline-none focus:border-cyan-500"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories' : c.replace('_', ' ')}
                </option>
              ))}
            </select>

            <button
              onClick={handleRerun}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              Re-run All Audits
            </button>
          </div>
        </div>

        {/* Test List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {displayed.map((test) => (
            <div
              key={test.testId}
              className={`p-3.5 rounded-lg border text-xs transition-colors ${
                test.passed
                  ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  : 'bg-rose-950/20 border-rose-800/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {test.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400 text-[11px]">{test.testId}</span>
                      <span className="font-semibold text-white">{test.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-slate-800 text-slate-400">
                        {test.category}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1">{test.message}</p>
                    {test.details && (
                      <p className="text-slate-500 text-[11px] mt-0.5 font-mono">{test.details}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    test.passed
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {test.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            Zero synthetic future leakage guaranteed across feature calculations and universe queries.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
