/**
 * Decision Intelligence Workstation (Phase 4B)
 * Comprehensive point-in-time decision support system:
 * - Aggregates independent evidence dimensions (Market, Sector, Technical, Volume, Liquidity, Fundamental, Broker)
 * - De-correlates redundant/collinear indicators
 * - Explicitly detects and highlights multi-dimensional contradictions
 * - Retrieves comparable historical setups obeying strict cutoff t <= asOfDate
 * - Computes multi-horizon conditional probability distributions with Wilson CIs & Bayesian smoothing
 * - Enforces hard blockers (no silent fallbacks, no high technical score overrides)
 * - Integrates real-world execution costs (slippage, brokerage, liquidity absorption)
 * - Provides fully transparent natural-language explainability
 */

import React, { useState, useEffect } from 'react';
import { DecisionIntelligenceOrchestrator } from '../../services/decisionIntelligence/decisionIntelligenceOrchestrator';
import { DecisionAssessment } from '../../types/decisionIntelligence';
import { normalizedCompanies } from '../../data/normalizedMasterData';
import { DataSourceIndicator } from '../layout/DataSourceIndicator';
import { EvidenceMatrixTable } from './EvidenceMatrixTable';
import { EvidenceConflictPanel } from './EvidenceConflictPanel';
import { ProbabilityDistributionTable } from './ProbabilityDistributionTable';
import { MarketWideRankingTable } from './MarketWideRankingTable';
import { Phase4BCausalityTests, Phase4BTestResult } from '../../engine/validation/phase4BCausalityTests';
import {
  BrainCircuit,
  Calendar,
  Layers,
  Split,
  BarChart2,
  Trophy,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Target,
  Clock,
  Play,
  FileCheck,
  Lock,
  ChevronRight
} from 'lucide-react';

interface DecisionIntelligenceViewProps {
  initialSymbol?: string;
  onSelectStock?: (symbol: string) => void;
}

type TabType = 'MATRIX' | 'ALIGNMENT' | 'HISTORICAL' | 'RANKINGS' | 'VERIFICATION';

export const DecisionIntelligenceView: React.FC<DecisionIntelligenceViewProps> = ({
  initialSymbol = 'CHCL',
  onSelectStock
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialSymbol);
  const [asOfDate, setAsOfDate] = useState<string>('2026-08-30');
  const [activeTab, setActiveTab] = useState<TabType>('MATRIX');
  const [assessment, setAssessment] = useState<DecisionAssessment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Causality Test Suite State
  const [testResults, setTestResults] = useState<Phase4BTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  const loadAssessment = async (symbol: string, date: string) => {
    setIsLoading(true);
    try {
      const result = await DecisionIntelligenceOrchestrator.getAssessment(symbol, date);
      setAssessment(result);
    } catch (err) {
      console.error('Failed to load decision assessment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssessment(selectedSymbol, asOfDate);
  }, [selectedSymbol, asOfDate]);

  const runVerificationSuite = async () => {
    setIsRunningTests(true);
    try {
      const results = await Phase4BCausalityTests.runAllTests();
      setTestResults(results);
    } catch (e) {
      console.error('Error running test suite:', e);
    } finally {
      setIsRunningTests(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ELIGIBLE':
        return (
          <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/50 flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> ELIGIBLE SETUP
          </span>
        );
      case 'ELIGIBLE_WITH_WARNING':
        return (
          <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/50 flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" /> ELIGIBLE (WITH WARNING)
          </span>
        );
      case 'WATCH':
        return (
          <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-yellow-950 text-yellow-300 border border-yellow-500/50 flex items-center gap-1.5 shadow-sm">
            <Clock className="w-3.5 h-3.5" /> ACTIVE WATCHLIST
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/50 flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" /> BLOCKED BY SAFETY GATE
          </span>
        );
      case 'INSUFFICIENT_EVIDENCE':
        return (
          <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" /> INSUFFICIENT EVIDENCE
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/50 flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" /> STATE UNAVAILABLE
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* 1. Top Control Bar */}
      <div className="bg-[#0b101b] border border-slate-800 rounded-lg p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left Title & System Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                Decision Intelligence Workstation
              </h1>
              <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 text-[10px] font-mono border border-cyan-800/40">
                PHASE 4B
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic evidence synthesis, conflict detection, empirical conditional probabilities, and hard blocker enforcement.
            </p>
          </div>
        </div>

        {/* Center & Right: Target Selectors & Provenance */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Symbol Select */}
          <div className="flex items-center gap-2 bg-[#090d16] px-3 py-1.5 rounded border border-slate-700">
            <span className="text-xs font-mono text-slate-400">Symbol:</span>
            <select
              value={selectedSymbol}
              onChange={e => {
                setSelectedSymbol(e.target.value);
                if (onSelectStock) onSelectStock(e.target.value);
              }}
              className="bg-transparent text-sm font-mono font-bold text-slate-100 focus:outline-none cursor-pointer"
            >
              {normalizedCompanies.map(c => (
                <option key={c.symbol} value={c.symbol} className="bg-[#090d16] text-slate-200">
                  {c.symbol} ({c.companyName})
                </option>
              ))}
            </select>
          </div>

          {/* Point-in-time Date Picker */}
          <div className="flex items-center gap-2 bg-[#090d16] px-3 py-1.5 rounded border border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono text-slate-400">As-Of:</span>
            <input
              type="date"
              value={asOfDate}
              onChange={e => setAsOfDate(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Refresh Action */}
          <button
            onClick={() => loadAssessment(selectedSymbol, asOfDate)}
            disabled={isLoading}
            className="p-2 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
            title="Recalculate Assessment"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Data Provenance Indicator */}
          <DataSourceIndicator />
        </div>
      </div>

      {/* 2. Executive Decision Support Summary Card */}
      {assessment && (
        <div className="bg-[#0b101b] border border-slate-800 rounded-lg p-5 space-y-4">
          {/* Header Row: Symbol, Eligibility, Alignment, Grade */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <div className="text-xl font-black text-slate-100 font-mono tracking-tight flex items-center gap-2">
                  {assessment.symbol}
                  <span className="text-sm font-normal text-slate-400 font-sans">
                    {assessment.companyName} • {assessment.sectorName}
                  </span>
                </div>
                <div className="text-xs text-cyan-400 font-mono mt-0.5 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Point-in-Time Replay: {assessment.asOfDate} • Engine v{assessment.engineVersion}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge(assessment.eligibility.status)}

              <span className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                Alignment: {assessment.alignment.overallAlignment.replace(/_/g, ' ')}
              </span>

              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                Grade: {assessment.researchEvidenceGrade}
              </span>
            </div>
          </div>

          {/* Decision Headline & Narrative */}
          <div>
            <h2 className="text-base font-bold text-slate-100">
              {assessment.explanation.headline}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {assessment.explanation.verdictRationale}
            </p>
          </div>

          {/* Two-Column Transparent Explainability: WHY INTERESTING vs WHY CAUTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Column A: WHY THIS SETUP IS INTERESTING */}
            <div className="p-4 rounded-lg bg-emerald-950/10 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">
                <CheckCircle2 className="w-4 h-4" /> WHY THIS SETUP IS INTERESTING
              </div>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {assessment.explanation.whyInteresting.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold font-mono shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column B: WHY CAUTION IS REQUIRED */}
            <div className="p-4 rounded-lg bg-amber-950/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
                <AlertTriangle className="w-4 h-4" /> WHY CAUTION IS REQUIRED
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {assessment.explanation.whyCautionRequired.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold font-mono shrink-0">⚠</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risk-Reward & Execution Friction Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-3 border-t border-slate-800/80 font-mono text-xs">
            <div className="p-2.5 rounded bg-[#090d16] border border-slate-800">
              <div className="text-[10px] text-slate-400">Current / Entry Zone</div>
              <div className="font-bold text-slate-100 text-sm mt-0.5">
                NPR {assessment.riskReward.currentPrice.toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-500">
                {assessment.riskReward.recommendedEntryZone.low} - {assessment.riskReward.recommendedEntryZone.high}
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#090d16] border border-slate-800">
              <div className="text-[10px] text-rose-400">Suggested Stop Loss</div>
              <div className="font-bold text-rose-400 text-sm mt-0.5">
                NPR {assessment.riskReward.suggestedStopLoss.toFixed(1)}
              </div>
              <div className="text-[10px] text-rose-500">
                -{assessment.riskReward.stopDistancePercent.toFixed(1)}% (1.5x ATR)
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#090d16] border border-slate-800">
              <div className="text-[10px] text-emerald-400">Target 1 (Primary)</div>
              <div className="font-bold text-emerald-400 text-sm mt-0.5">
                NPR {assessment.riskReward.target1.toFixed(1)}
              </div>
              <div className="text-[10px] text-emerald-500">
                +{assessment.riskReward.target1Percent.toFixed(1)}%
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#090d16] border border-slate-800">
              <div className="text-[10px] text-cyan-400">Target 2 (Runner)</div>
              <div className="font-bold text-cyan-400 text-sm mt-0.5">
                NPR {assessment.riskReward.target2.toFixed(1)}
              </div>
              <div className="text-[10px] text-cyan-500">
                +{assessment.riskReward.target2Percent.toFixed(1)}%
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#090d16] border border-slate-800">
              <div className="text-[10px] text-slate-400">Risk : Reward Ratio</div>
              <div className="font-bold text-cyan-300 text-sm mt-0.5">
                1 : {assessment.riskReward.riskRewardRatio.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500">
                Net Exp: {assessment.riskReward.estimatedNetExpectancyPercent > 0 ? '+' : ''}{assessment.riskReward.estimatedNetExpectancyPercent}%
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#090d16] border border-slate-800">
              <div className="text-[10px] text-slate-400">Execution Friction</div>
              <div className="font-bold text-slate-300 text-sm mt-0.5">
                {(assessment.riskReward.estimatedSlippagePercent + assessment.riskReward.estimatedBrokerageRoundTripPercent).toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-500">
                Capacity: {assessment.riskReward.liquidityAbsorptionScore}/100
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Multi-Tab Navigation */}
      <div className="border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('MATRIX')}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'MATRIX'
                ? 'bg-[#0b101b] text-cyan-400 border-t-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> EVIDENCE MATRIX
          </button>

          <button
            onClick={() => setActiveTab('ALIGNMENT')}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'ALIGNMENT'
                ? 'bg-[#0b101b] text-cyan-400 border-t-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Split className="w-3.5 h-3.5" /> ALIGNMENT & CONFLICTS
            {assessment && assessment.conflicts.conflictCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950 text-amber-300 border border-amber-800">
                {assessment.conflicts.conflictCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('HISTORICAL')}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'HISTORICAL'
                ? 'bg-[#0b101b] text-cyan-400 border-t-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> HISTORICAL PROBABILITIES
          </button>

          <button
            onClick={() => setActiveTab('RANKINGS')}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'RANKINGS'
                ? 'bg-[#0b101b] text-cyan-400 border-t-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> MARKET-WIDE RANKING
          </button>

          <button
            onClick={() => setActiveTab('VERIFICATION')}
            className={`px-4 py-2 text-xs font-mono font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'VERIFICATION'
                ? 'bg-[#0b101b] text-cyan-400 border-t-2 border-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> CAUSALITY TEST SUITE
          </button>
        </div>
      </div>

      {/* 4. Tab Content Body */}
      <div>
        {activeTab === 'MATRIX' && assessment && (
          <EvidenceMatrixTable evidenceItems={assessment.evidenceItems} />
        )}

        {activeTab === 'ALIGNMENT' && assessment && (
          <EvidenceConflictPanel
            alignment={assessment.alignment}
            conflicts={assessment.conflicts}
          />
        )}

        {activeTab === 'HISTORICAL' && assessment && (
          <ProbabilityDistributionTable
            probability={assessment.probability}
            comparables={assessment.comparables}
            asOfDate={assessment.asOfDate}
          />
        )}

        {activeTab === 'RANKINGS' && (
          <MarketWideRankingTable
            asOfDate={asOfDate}
            onSelectStock={symbol => {
              setSelectedSymbol(symbol);
              setActiveTab('MATRIX');
            }}
          />
        )}

        {activeTab === 'VERIFICATION' && (
          <div className="bg-[#0b101b] border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-cyan-400" />
                  Phase 4B Causality & Verification Suite (17 Comprehensive Tests)
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Validates zero look-ahead bias, future mutation invariance, historical cutoffs, Bayesian smoothing, and hard blocker enforcement.
                </div>
              </div>

              <button
                onClick={runVerificationSuite}
                disabled={isRunningTests}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold flex items-center gap-2 shadow transition-colors disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
                {isRunningTests ? 'Running 17 Tests...' : 'Run Verification Suite'}
              </button>
            </div>

            {testResults.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-400">
                Click "Run Verification Suite" above to execute all 17 automated tests against the current environment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0e1628] text-slate-400 border-b border-slate-800 uppercase font-mono tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Test ID</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Verification Message</th>
                      <th className="py-2.5 px-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {testResults.map(t => (
                      <tr key={t.id} className="hover:bg-slate-850/40">
                        <td className="py-2.5 px-3 font-bold text-slate-300">{t.id}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-100">{t.name}</td>
                        <td className="py-2.5 px-3 text-cyan-400 text-[11px]">{t.category}</td>
                        <td className="py-2.5 px-3">
                          {t.passed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> PASS
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-400 border border-rose-500/40 font-bold flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" /> FAIL
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans text-xs">{t.message}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                          {t.executionTimeMs}ms
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
    </div>
  );
};
