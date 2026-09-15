/**
 * Feature & Probability Lab Workstation for Phase 3C
 * Comprehensive research workstation for:
 * 1. Feature Explorer & Catalog (12 Categories)
 * 2. Historical Conditional Performance & Information Coefficient (IC)
 * 3. Feature Redundancy Matrix (Pearson & Spearman)
 * 4. Feature Stability & Rolling Decay Analysis
 * 5. Conditional Probability Query Engine P(outcome | conditions)
 * 6. Current Market Condition Similarity Matcher
 * 7. Out-of-Sample Feature Selection Report (Train / Val / Test)
 * 8. Probability Calibration & Multiple Testing Controls
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Database,
  ArrowUpDown,
  RefreshCw,
  Clock,
  Sparkles,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Percent,
  GitCompare,
  Compass,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import {
  FeatureDefinition,
  FeatureRedundancyPair,
  FeaturePerformanceMetrics,
  FeatureStabilityMetrics,
  ConditionalProbabilityQuery,
  ConditionalProbabilityResult,
  CurrentConditionComparison,
  FeatureSelectionReportItem,
  FeatureSelectionCriterion,
  ProbabilityCalibrationBucket,
  FeatureCategory,
  OutcomeType
} from '../../types/featureEngine';
import { HoldingHorizon } from '../../types/historicalResearch';
import { FeatureRegistry } from '../../engine/features/featureRegistry';
import { featureResearchService } from '../../services/featureResearchService';
import { FeatureIntegrityModal } from './FeatureIntegrityModal';
import { normalizedCompanies } from '../../data/normalizedMasterData';

type LabTab =
  | 'REGISTRY'
  | 'PERFORMANCE_IC'
  | 'REDUNDANCY'
  | 'STABILITY_DECAY'
  | 'CONDITIONAL_QUERY'
  | 'CURRENT_MATCH'
  | 'SELECTION_REPORT'
  | 'CALIBRATION';

export const FeatureProbabilityLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LabTab>('REGISTRY');
  const [loading, setLoading] = useState(false);
  const [integrityModalOpen, setIntegrityModalOpen] = useState(false);

  // 1. Feature Explorer State
  const [allFeatures, setAllFeatures] = useState<FeatureDefinition[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedFeature, setSelectedFeature] = useState<FeatureDefinition | null>(null);

  // 2. Performance & IC State
  const [selectedHorizon, setSelectedHorizon] = useState<HoldingHorizon>(20);
  const [performanceMetrics, setPerformanceMetrics] = useState<FeaturePerformanceMetrics[]>([]);

  // 3. Redundancy Matrix State
  const [redundancyPairs, setRedundancyPairs] = useState<FeatureRedundancyPair[]>([]);
  const [onlyRedundantFilter, setOnlyRedundantFilter] = useState(false);

  // 4. Stability State
  const [stabilityFeatureId, setStabilityFeatureId] = useState('FEAT_RSI_14_ZONE');
  const [stabilityMetrics, setStabilityMetrics] = useState<FeatureStabilityMetrics | null>(null);

  // 5. Conditional Probability Query State
  const [queryOutcome, setQueryOutcome] = useState<OutcomeType>('POSITIVE_RETURN');
  const [queryHorizon, setQueryHorizon] = useState<HoldingHorizon>(20);
  const [queryPartition, setQueryPartition] = useState<'FULL' | 'TRAIN' | 'VALIDATION' | 'TEST'>('FULL');
  const [condRsiActive, setCondRsiActive] = useState(true);
  const [condRsiMin, setCondRsiMin] = useState(50);
  const [condRsiMax, setCondRsiMax] = useState(65);
  const [condTrendActive, setCondTrendActive] = useState(true);
  const [condVolumeActive, setCondVolumeActive] = useState(true);
  const [condAdxActive, setCondAdxActive] = useState(true);
  const [conditionalResult, setConditionalResult] = useState<ConditionalProbabilityResult | null>(null);

  // 6. Current Market Similarity State
  const [selectedSymbol, setSelectedSymbol] = useState('CHCL');
  const [currentComparison, setCurrentComparison] = useState<CurrentConditionComparison | null>(null);

  // 7. Selection Report State
  const [selectionCriteria, setSelectionCriteria] = useState<FeatureSelectionCriterion>({
    minSampleSize: 30,
    minWinRate: 52,
    minMeanReturn: 0.5,
    minStabilityScore: 60,
    maxCorrelationThreshold: 0.70,
    minEffectSize: 0.15,
    requireTrainAndValidationEdge: true
  });
  const [selectionReport, setSelectionReport] = useState<FeatureSelectionReportItem[]>([]);

  // 8. Calibration State
  const [calibrationBuckets, setCalibrationBuckets] = useState<ProbabilityCalibrationBucket[]>([]);

  // Initialize
  useEffect(() => {
    const features = FeatureRegistry.getAllFeatures();
    setAllFeatures(features);
    if (features.length > 0) {
      setSelectedFeature(features[0]);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Warm up historical pool in background
      await featureResearchService.getHistoricalPool();

      // Load initial tabs data
      const metrics = await featureResearchService.computeFeaturePerformanceMetrics(selectedHorizon);
      setPerformanceMetrics(metrics);

      const redPairs = await featureResearchService.computeRedundancyMatrix();
      setRedundancyPairs(redPairs);

      const calib = await featureResearchService.getProbabilityCalibrationBuckets();
      setCalibrationBuckets(calib);

      // Run initial current market match
      const comp = await featureResearchService.matchCurrentMarketCondition(selectedSymbol, 20);
      setCurrentComparison(comp);

      // Run initial conditional query
      await executeCurrentConditionalQuery();

      // Run initial selection report
      const rep = await featureResearchService.generateFeatureSelectionReport(selectionCriteria);
      setSelectionReport(rep);
    } catch (e) {
      console.error('Failed to load Phase 3C data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleHorizonChange = async (horizon: HoldingHorizon) => {
    setSelectedHorizon(horizon);
    setLoading(true);
    const metrics = await featureResearchService.computeFeaturePerformanceMetrics(horizon);
    setPerformanceMetrics(metrics);
    setLoading(false);
  };

  const loadStabilityForFeature = async (featureId: string) => {
    setStabilityFeatureId(featureId);
    setLoading(true);
    const pool = await featureResearchService.getHistoricalPool();
    const def = FeatureRegistry.getFeatureById(featureId);
    if (def) {
      const stab = await import('../../engine/features/conditionalProbabilityEngine').then(m =>
        m.ConditionalProbabilityEngine.calculateFeatureStability(featureId, def.name, pool, selectedHorizon)
      );
      setStabilityMetrics(stab);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'STABILITY_DECAY' && !stabilityMetrics) {
      loadStabilityForFeature(stabilityFeatureId);
    }
  }, [activeTab]);

  const executeCurrentConditionalQuery = async () => {
    setLoading(true);
    const conditions: any[] = [];

    if (condTrendActive) {
      conditions.push({
        featureId: 'FEAT_PRICE_VS_SMA50_ATR',
        comparator: '>=',
        value: 0,
        label: 'Price >= SMA50'
      });
    }

    if (condRsiActive) {
      conditions.push({
        featureId: 'FEAT_RSI_14_ZONE',
        comparator: 'BETWEEN',
        minValue: condRsiMin,
        maxValue: condRsiMax,
        label: `RSI between ${condRsiMin} - ${condRsiMax}`
      });
    }

    if (condVolumeActive) {
      conditions.push({
        featureId: 'FEAT_VOLUME_MA20_RATIO',
        comparator: '>=',
        value: 1.2,
        label: 'Volume >= 1.2x SMA20'
      });
    }

    if (condAdxActive) {
      conditions.push({
        featureId: 'FEAT_ADX_TREND_STRENGTH',
        comparator: '>=',
        value: 20,
        label: 'ADX >= 20 (Trending)'
      });
    }

    const query: ConditionalProbabilityQuery = {
      queryId: `QUERY-${Date.now()}`,
      conditionTree: {
        operator: 'AND',
        conditions
      },
      outcome: {
        type: queryOutcome,
        label:
          queryOutcome === 'POSITIVE_RETURN'
            ? 'Positive Return (>0%)'
            : queryOutcome === 'RETURN_GT_2'
            ? 'Return >= +2.0%'
            : queryOutcome === 'RETURN_GT_5'
            ? 'Return >= +5.0%'
            : queryOutcome === 'RETURN_GT_10'
            ? 'Return >= +10.0%'
            : 'Target Hit Before Stop Loss',
        description: 'Empirical outcome condition'
      },
      horizon: queryHorizon,
      entryModel: 'SIGNAL_CLOSE',
      universe: 'ALL_NEPSE',
      timeframe: 'DAILY',
      partition: queryPartition,
      costs: {
        includeCosts: true,
        brokeragePercent: 0.35,
        sebonFeePercent: 0.015,
        dpFeeNpr: 25,
        capitalGainsTaxPercent: 5.0,
        slippagePercent: 0.1
      }
    };

    const res = await featureResearchService.executeConditionalQuery(query);
    setConditionalResult(res);
    setLoading(false);
  };

  const handleMatchStock = async (symbol: string) => {
    setSelectedSymbol(symbol);
    setLoading(true);
    const comp = await featureResearchService.matchCurrentMarketCondition(symbol, queryHorizon);
    setCurrentComparison(comp);
    setLoading(false);
  };

  const handleRecalculateSelectionReport = async () => {
    setLoading(true);
    const rep = await featureResearchService.generateFeatureSelectionReport(selectionCriteria);
    setSelectionReport(rep);
    setLoading(false);
  };

  const filteredFeatures = allFeatures.filter(f => {
    const matchesCat = categoryFilter === 'ALL' || f.category === categoryFilter;
    const matchesSearch =
      f.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.featureId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      f.sourceIndicator.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categories: FeatureCategory[] = [
    'TREND',
    'MOMENTUM',
    'VOLUME',
    'VOLATILITY',
    'PRICE_STRUCTURE',
    'RELATIVE_STRENGTH',
    'MARKET_REGIME',
    'SECTOR_REGIME',
    'LIQUIDITY',
    'STATISTICAL',
    'CROSS_SECTIONAL',
    'COMPOSITE'
  ];

  return (
    <div className="space-y-6">
      {/* Workstation Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Phase 3C Workstation
              </span>
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                Zero Look-Ahead Dataset: NEPSE-NORM-2026.1
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Feature Selection & Conditional Probability Engine
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              Transforms raw technical indicators into standardized research features, quantifies statistical edge
              via Information Coefficients (IC), audits multi-feature redundancy, and transparently estimates historical
              conditional probabilities <code className="text-indigo-600 font-mono font-bold">P(Outcome | Conditions)</code>.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIntegrityModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Causality & Leakage Audit
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Engine
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 mt-6 overflow-x-auto">
          {[
            { id: 'REGISTRY', label: 'Feature Registry & Catalog', icon: Layers },
            { id: 'PERFORMANCE_IC', label: 'Conditional Performance & IC', icon: TrendingUp },
            { id: 'REDUNDANCY', label: 'Redundancy Matrix', icon: GitCompare },
            { id: 'STABILITY_DECAY', label: 'Stability & Rolling Decay', icon: Activity },
            { id: 'CONDITIONAL_QUERY', label: 'Conditional Probability P(O|C)', icon: Percent },
            { id: 'CURRENT_MATCH', label: 'Current Condition Matching', icon: Compass },
            { id: 'SELECTION_REPORT', label: 'Out-of-Sample Selection', icon: FileSpreadsheet },
            { id: 'CALIBRATION', label: 'Calibration & Controls', icon: Sliders }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LabTab)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------
          TAB 1: FEATURE REGISTRY & CATALOG
         ------------------------------------------------------------- */}
      {activeTab === 'REGISTRY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Filter and Feature List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search feature by name, ID, indicator..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <button
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    categoryFilter === 'ALL'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({allFeatures.length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition ${
                      categoryFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Features List */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filteredFeatures.map(feat => {
                const isSelected = selectedFeature?.featureId === feat.featureId;
                return (
                  <div
                    key={feat.featureId}
                    onClick={() => setSelectedFeature(feat)}
                    className={`p-3.5 cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-50/60 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {feat.category}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{feat.sourceIndicator}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">{feat.name}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {feat.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 mt-2 shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Feature Details & Discretization Bins */}
          <div className="lg:col-span-7 space-y-6">
            {selectedFeature ? (
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      {selectedFeature.featureId}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Version: {selectedFeature.calculationVersion}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedFeature.name}</h2>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {selectedFeature.description}
                  </p>
                </div>

                {/* Mathematical Formula & Normalization */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Formula Transformation
                    </span>
                    <code className="text-xs font-mono font-bold text-slate-800 block mt-1">
                      {selectedFeature.formulaDescription}
                    </code>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Normalization Method
                    </span>
                    <span className="text-xs font-bold text-indigo-700 block mt-1">
                      {selectedFeature.normalizationMethod.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Discretization / Regime Bins Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Configured Regime Bins ({selectedFeature.defaultBins.length} Bins)
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Transparent non-optimal partitioning
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Bin ID</th>
                          <th className="py-2 px-3">Label / Range</th>
                          <th className="py-2 px-3">Lower Bound</th>
                          <th className="py-2 px-3">Upper Bound</th>
                          <th className="py-2 px-3">Regime Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedFeature.defaultBins.map(bin => (
                          <tr key={bin.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono font-medium text-slate-500">{bin.id}</td>
                            <td className="py-2 px-3 font-bold text-slate-800">{bin.label}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">
                              {bin.min === -999 ? '-∞' : bin.min}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-600">
                              {bin.max === 999 || bin.max === 999999 ? '+∞' : bin.max}
                            </td>
                            <td className="py-2 px-3 text-slate-600">{bin.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Action */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setStabilityFeatureId(selectedFeature.featureId);
                      setActiveTab('STABILITY_DECAY');
                      loadStabilityForFeature(selectedFeature.featureId);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition"
                  >
                    <Activity className="w-3.5 h-3.5" /> View Stability & Decay
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-12 text-center text-slate-400">
                Select a feature from the catalog to inspect definitions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 2: CONDITIONAL PERFORMANCE & INFORMATION COEFFICIENT (IC)
         ------------------------------------------------------------- */}
      {activeTab === 'PERFORMANCE_IC' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Historical Conditional Performance & Information Coefficient (IC)
              </h3>
              <p className="text-xs text-slate-500">
                Spearman rank correlation between feature at $T$ and forward return at $T+H$. Features adjusted for multiple testing via Benjamini-Hochberg FDR.
              </p>
            </div>

            {/* Horizon Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {[1, 3, 5, 10, 20, 30, 60].map(h => (
                <button
                  key={h}
                  onClick={() => handleHorizonChange(h as HoldingHorizon)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                    selectedHorizon === h
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {h}D
                </button>
              ))}
            </div>
          </div>

          {/* Performance Table */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Feature</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Sample (N)</th>
                    <th className="py-3 px-3 text-right">Win Rate</th>
                    <th className="py-3 px-3 text-center">Wilson 95% CI</th>
                    <th className="py-3 px-3 text-right">Mean Ret</th>
                    <th className="py-3 px-3 text-right">Expectancy</th>
                    <th className="py-3 px-3 text-right">Profit Factor</th>
                    <th className="py-3 px-3 text-right">MFE / MAE</th>
                    <th className="py-3 px-3 text-right">Rank IC</th>
                    <th className="py-3 px-3 text-right">Adj p-value (FDR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {performanceMetrics.map(m => (
                    <tr key={m.featureId} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{m.featureName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{m.featureId}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {m.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{m.observationsCount}</td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        <span className={m.winRate >= 50 ? 'text-emerald-600' : 'text-rose-600'}>
                          {m.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                        [{m.wilsonCI.lower.toFixed(1)}%, {m.wilsonCI.upper.toFixed(1)}%]
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        <span className={m.meanReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {m.meanReturn >= 0 ? `+${m.meanReturn.toFixed(2)}%` : `${m.meanReturn.toFixed(2)}%`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700">
                        {m.expectancy.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        {m.profitFactor ? m.profitFactor.toFixed(2) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                        <span className="text-emerald-600">+{m.mfeMean.toFixed(1)}%</span> /{' '}
                        <span className="text-rose-500">{m.maeMean.toFixed(1)}%</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-mono font-bold px-1.5 py-0.5 rounded text-xs ${
                            m.informationCoefficient > 0.10
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : m.informationCoefficient < -0.10
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'text-slate-600'
                          }`}
                        >
                          {m.informationCoefficient >= 0 ? `+${m.informationCoefficient.toFixed(3)}` : m.informationCoefficient.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {m.benjaminiHochbergSignificant ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> p={m.multipleTestingAdjustedPVal.toFixed(3)}
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400 text-[10px]">
                            p={m.multipleTestingAdjustedPVal.toFixed(3)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 3: REDUNDANCY MATRIX
         ------------------------------------------------------------- */}
      {activeTab === 'REDUNDANCY' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Feature Redundancy & Correlation Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Identifies overlapping features (Spearman rank correlation |ρ| ≥ 0.70). Allows the researcher to detect duplicate signals without automatic deletion.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyRedundantFilter}
                onChange={e => setOnlyRedundantFilter(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              Show Only Redundant Pairs (|ρ| ≥ 0.70)
            </label>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Feature A</th>
                    <th className="py-3 px-3">Feature B</th>
                    <th className="py-3 px-3 text-right">Spearman Rank (ρ)</th>
                    <th className="py-3 px-3 text-right">Pearson (r)</th>
                    <th className="py-3 px-3 text-right">Sample Size</th>
                    <th className="py-3 px-3">Redundancy Status</th>
                    <th className="py-3 px-3">Research Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {redundancyPairs
                    .filter(p => !onlyRedundantFilter || p.redundancyFlag)
                    .map(pair => (
                      <tr
                        key={`${pair.featureA}-${pair.featureB}`}
                        className={`hover:bg-slate-50/60 ${
                          pair.redundancyFlag ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">{pair.featureAName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{pair.featureA}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">{pair.featureBName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{pair.featureB}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`font-mono font-bold text-xs ${
                              Math.abs(pair.spearmanCorrelation) >= 0.70
                                ? 'text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded'
                                : 'text-slate-700'
                            }`}
                          >
                            {pair.spearmanCorrelation.toFixed(3)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {pair.pearsonCorrelation.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {pair.sampleSize}
                        </td>
                        <td className="py-2.5 px-3">
                          {pair.redundancyFlag ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" /> Redundant (|ρ| ≥ 0.70)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Independent
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-xs">{pair.interpretation}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 4: STABILITY & ROLLING DECAY
         ------------------------------------------------------------- */}
      {activeTab === 'STABILITY_DECAY' && (
        <div className="space-y-6">
          {/* Top Selector */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Temporal Stability & Rolling Window Decay Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Examines whether a feature's historical edge remains persistent across calendar years, market regimes, and multi-year rolling windows.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Feature:</span>
              <select
                value={stabilityFeatureId}
                onChange={e => loadStabilityForFeature(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:border-indigo-500"
              >
                {allFeatures.map(f => (
                  <option key={f.featureId} value={f.featureId}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {stabilityMetrics ? (
            <div className="space-y-6">
              {/* Stability Score Card */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Feature Persistence Rating
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    {stabilityMetrics.featureName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Calculated from variance in annual win rate and rank correlation stability across cycles.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-600">
                      {stabilityMetrics.stabilityScore} / 100
                    </span>
                    <div className="text-xs font-semibold text-slate-500">
                      {stabilityMetrics.isPersistent ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" /> High Empirical Persistence
                        </span>
                      ) : (
                        <span className="text-amber-600 font-bold flex items-center gap-1 justify-end">
                          <AlertTriangle className="w-3.5 h-3.5" /> Period-Specific / Decaying Edge
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid: Year Breakdown & Rolling Windows */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Year by Year */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Annual Consistency (Year-by-Year)
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Year</th>
                          <th className="py-2 px-3 text-right">Observations</th>
                          <th className="py-2 px-3 text-right">Win Rate</th>
                          <th className="py-2 px-3 text-right">Mean Return</th>
                          <th className="py-2 px-3 text-right">Rank IC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stabilityMetrics.byYear.map(y => (
                          <tr key={y.year}>
                            <td className="py-2 px-3 font-bold text-slate-800">{y.year}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">
                              {y.observations}
                            </td>
                            <td className="py-2 px-3 text-right font-bold">
                              <span className={y.winRate >= 50 ? 'text-emerald-600' : 'text-rose-600'}>
                                {y.winRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              <span className={y.meanReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                {y.meanReturn >= 0 ? `+${y.meanReturn.toFixed(2)}%` : `${y.meanReturn.toFixed(2)}%`}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-medium">
                              {y.ic.toFixed(3)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Rolling Decay Windows */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Rolling Window Edge Decay
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Rolling Window</th>
                          <th className="py-2 px-3 text-right">Sample (N)</th>
                          <th className="py-2 px-3 text-right">Win Rate</th>
                          <th className="py-2 px-3 text-right">Mean Return</th>
                          <th className="py-2 px-3 text-right">IC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stabilityMetrics.decayRollingWindows.map(rw => (
                          <tr key={rw.windowLabel}>
                            <td className="py-2 px-3 font-bold text-slate-800">{rw.windowLabel}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">{rw.sampleSize}</td>
                            <td className="py-2 px-3 text-right font-bold">
                              <span className={rw.winRate >= 50 ? 'text-emerald-600' : 'text-rose-600'}>
                                {rw.winRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              <span className={rw.meanReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                {rw.meanReturn >= 0 ? `+${rw.meanReturn.toFixed(2)}%` : `${rw.meanReturn.toFixed(2)}%`}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-medium">{rw.ic.toFixed(3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Market Regime Breakdown */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Performance Conditioned on NEPSE Market Regime
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {stabilityMetrics.byRegime.map(reg => (
                    <div key={reg.regime} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">{reg.regime}</span>
                        <span className="text-[11px] font-mono text-slate-400">N={reg.observations}</span>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-lg font-black text-slate-900">{reg.winRate.toFixed(1)}%</span>
                        <span className={`text-xs font-bold ${reg.meanReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {reg.meanReturn >= 0 ? `+${reg.meanReturn.toFixed(2)}%` : `${reg.meanReturn.toFixed(2)}%`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              Loading stability metrics...
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 5: CONDITIONAL PROBABILITY QUERY ENGINE P(O | C)
         ------------------------------------------------------------- */}
      {activeTab === 'CONDITIONAL_QUERY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Query Builder */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Condition Combinations
              </h3>

              {/* Target Outcome */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Target Outcome Definition
                </label>
                <select
                  value={queryOutcome}
                  onChange={e => setQueryOutcome(e.target.value as OutcomeType)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="POSITIVE_RETURN">Positive Return (&gt;0%)</option>
                  <option value="RETURN_GT_2">Substantial Return (&gt;= +2.0%)</option>
                  <option value="RETURN_GT_5">High Return (&gt;= +5.0%)</option>
                  <option value="RETURN_GT_10">Exceptional Return (&gt;= +10.0%)</option>
                  <option value="TARGET_BEFORE_STOP">8% Target Hit Before 4% Stop Loss</option>
                  <option value="MFE_GT_5">Favorable Excursion MFE &gt;= 5.0%</option>
                  <option value="MAE_LT_MINUS_3">Controlled Drawdown MAE &gt; -3.0%</option>
                </select>
              </div>

              {/* Horizon */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Horizon</label>
                  <select
                    value={queryHorizon}
                    onChange={e => setQueryHorizon(Number(e.target.value) as HoldingHorizon)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    {[1, 3, 5, 10, 20, 30, 60].map(h => (
                      <option key={h} value={h}>
                        {h} Sessions
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Dataset Partition</label>
                  <select
                    value={queryPartition}
                    onChange={e => setQueryPartition(e.target.value as any)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="FULL">Full Historical Dataset</option>
                    <option value="TRAIN">Train Only (&lt;= 2023)</option>
                    <option value="VALIDATION">Validation (2024 - 2025)</option>
                    <option value="TEST">Test (2025+ Out-of-Sample)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Active Confluent Conditions (AND)
                </span>

                {/* Rule 1: Trend */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={condTrendActive}
                      onChange={e => setCondTrendActive(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-xs font-medium text-slate-700">Price &gt;= SMA50 (ATR &gt;= 0)</span>
                  </div>
                </div>

                {/* Rule 2: RSI Range */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={condRsiActive}
                        onChange={e => setCondRsiActive(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span className="text-xs font-medium text-slate-700">RSI 14 Regime Range</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {condRsiMin} - {condRsiMax}
                    </span>
                  </div>
                  {condRsiActive && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        value={condRsiMin}
                        onChange={e => setCondRsiMin(Number(e.target.value))}
                        className="w-16 p-1 text-xs border rounded text-center bg-white"
                      />
                      <span className="text-xs text-slate-400">to</span>
                      <input
                        type="number"
                        value={condRsiMax}
                        onChange={e => setCondRsiMax(Number(e.target.value))}
                        className="w-16 p-1 text-xs border rounded text-center bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* Rule 3: Volume */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={condVolumeActive}
                      onChange={e => setCondVolumeActive(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-xs font-medium text-slate-700">Volume &gt;= 1.2x SMA20</span>
                  </div>
                </div>

                {/* Rule 4: ADX Trend */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={condAdxActive}
                      onChange={e => setCondAdxActive(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-xs font-medium text-slate-700">ADX &gt;= 20 (Confirmed Trend)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={executeCurrentConditionalQuery}
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Estimate Conditional Probability
              </button>
            </div>
          </div>

          {/* Right Column: Probability Output & Diagnostics */}
          <div className="lg:col-span-8 space-y-6">
            {conditionalResult ? (
              <div className="space-y-6">
                {/* Main Probability Display Card */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {conditionalResult.researchRunId}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                        Historical Conditional Probability Estimate
                      </h2>
                      <p className="text-xs text-slate-500">
                        P({conditionalResult.query.outcome.label} | active technical confluence)
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold uppercase px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                        Horizon: {conditionalResult.horizon} Sessions
                      </span>
                    </div>
                  </div>

                  {/* Probability Metrics Bento */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* Raw Probability */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Raw Historical Rate
                      </span>
                      <span className="text-2xl font-black text-slate-900 block mt-1">
                        {conditionalResult.rawProbability.toFixed(1)}%
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        {conditionalResult.positiveCount} / {conditionalResult.observations} observations
                      </span>
                    </div>

                    {/* Bayesian Smoothed */}
                    <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
                          Bayesian Smoothed
                        </span>
                        <Info className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <span className="text-2xl font-black text-indigo-700 block mt-1">
                        {conditionalResult.smoothedProbability.toFixed(1)}%
                      </span>
                      <span className="text-[11px] text-indigo-500 mt-1 block">
                        Beta(5,5) prior shrinkage
                      </span>
                    </div>

                    {/* Wilson 95% CI */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Wilson 95% CI
                      </span>
                      <span className="text-sm font-mono font-bold text-slate-800 block mt-2">
                        [{conditionalResult.confidenceInterval.lower.toFixed(1)}%, {conditionalResult.confidenceInterval.upper.toFixed(1)}%]
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block">Binomial uncertainty</span>
                    </div>

                    {/* Expectancy */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Expectancy
                      </span>
                      <span
                        className={`text-2xl font-black block mt-1 ${
                          conditionalResult.expectancy >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {conditionalResult.expectancy >= 0 ? `+${conditionalResult.expectancy.toFixed(2)}%` : `${conditionalResult.expectancy.toFixed(2)}%`}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        PF: {conditionalResult.profitFactor ? conditionalResult.profitFactor.toFixed(2) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Warning & Complexity Callout */}
                  {conditionalResult.multipleTestingWarning && (
                    <div
                      className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                        conditionalResult.multipleTestingWarning.riskLevel === 'HIGH'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : conditionalResult.multipleTestingWarning.riskLevel === 'MODERATE'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold block">
                          Multiple Testing & Data Snooping Risk:{' '}
                          {conditionalResult.multipleTestingWarning.riskLevel}
                        </span>
                        <p className="text-xs mt-0.5">
                          {conditionalResult.multipleTestingWarning.message}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subgroup Breakdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Regime Breakdown */}
                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Breakdown by Macro Regime
                    </h4>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold">
                          <tr>
                            <th className="py-2 px-3">Regime</th>
                            <th className="py-2 px-3 text-right">Sample</th>
                            <th className="py-2 px-3 text-right">Probability</th>
                            <th className="py-2 px-3 text-right">Mean Ret</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {conditionalResult.regimeBreakdown.map(r => (
                            <tr key={r.regime}>
                              <td className="py-2 px-3 font-bold text-slate-800">{r.regime}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-500">{r.observations}</td>
                              <td className="py-2 px-3 text-right font-bold text-indigo-700">
                                {r.probability.toFixed(1)}%
                              </td>
                              <td className="py-2 px-3 text-right font-mono">
                                <span className={r.meanReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                  {r.meanReturn >= 0 ? `+${r.meanReturn.toFixed(2)}%` : `${r.meanReturn.toFixed(2)}%`}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Temporal Year Breakdown */}
                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Temporal Stability Across Years
                    </h4>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold">
                          <tr>
                            <th className="py-2 px-3">Period</th>
                            <th className="py-2 px-3 text-right">Sample</th>
                            <th className="py-2 px-3 text-right">Probability</th>
                            <th className="py-2 px-3 text-right">Mean Ret</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {conditionalResult.timeStability.map(t => (
                            <tr key={t.period}>
                              <td className="py-2 px-3 font-bold text-slate-800">{t.period}</td>
                              <td className="py-2 px-3 text-right font-mono text-slate-500">{t.observations}</td>
                              <td className="py-2 px-3 text-right font-bold text-indigo-700">
                                {t.probability.toFixed(1)}%
                              </td>
                              <td className="py-2 px-3 text-right font-mono">
                                <span className={t.meanReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                  {t.meanReturn >= 0 ? `+${t.meanReturn.toFixed(2)}%` : `${t.meanReturn.toFixed(2)}%`}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                Run query to estimate conditional probability.
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 6: CURRENT MARKET CONDITION MATCHING (HISTORICAL SIMILARITY)
         ------------------------------------------------------------- */}
      {activeTab === 'CURRENT_MATCH' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">
                  Historical Similarity Module
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Non-Black-Box Empirical Matching
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                When Current Market Conditions Resemble Historical Setups, What Happened Next?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Extracts the latest technical state for the stock and transparently searches historical comparable sessions across NEPSE.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Select Stock:</span>
              <select
                value={selectedSymbol}
                onChange={e => handleMatchStock(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold focus:outline-none focus:border-indigo-500"
              >
                {normalizedCompanies.map(c => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.symbol} — {c.company_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentComparison ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Historical Comparable Matches
                  </span>
                  <span className="text-2xl font-black text-indigo-700 block mt-1">
                    {currentComparison.matchesCount}
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Similarity ≥ 70% in NEPSE pool
                  </span>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    20-Day Positive Outcome Rate
                  </span>
                  <span className="text-2xl font-black text-emerald-600 block mt-1">
                    {currentComparison.probabilityResult.rawProbability.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Smoothed: {currentComparison.probabilityResult.smoothedProbability.toFixed(1)}%
                  </span>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Median Forward Return
                  </span>
                  <span
                    className={`text-2xl font-black block mt-1 ${
                      currentComparison.probabilityResult.medianReturn >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {currentComparison.probabilityResult.medianReturn >= 0
                      ? `+${currentComparison.probabilityResult.medianReturn.toFixed(2)}%`
                      : `${currentComparison.probabilityResult.medianReturn.toFixed(2)}%`}
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Mean: {currentComparison.probabilityResult.meanReturn.toFixed(2)}%
                  </span>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Excursion Profile (MFE / MAE)
                  </span>
                  <span className="text-sm font-mono font-bold block mt-2 text-slate-800">
                    <span className="text-emerald-600">
                      +{currentComparison.probabilityResult.mfe.mean.toFixed(1)}%
                    </span>{' '}
                    /{' '}
                    <span className="text-rose-500">
                      {currentComparison.probabilityResult.mae.mean.toFixed(1)}%
                    </span>
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Avg Upside vs Downside excursion
                  </span>
                </div>
              </div>

              {/* Top Historical Matches Table */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Comparable Historical Observations (Top {currentComparison.historicalMatches.length})
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400">
                    Showing actual verified occurrences in NEPSE history
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Symbol</th>
                        <th className="py-2.5 px-3">Market Regime</th>
                        <th className="py-2.5 px-3 text-right">Similarity</th>
                        <th className="py-2.5 px-3 text-right">Entry Price</th>
                        <th className="py-2.5 px-3 text-right">20D Return</th>
                        <th className="py-2.5 px-3 text-right">MFE / MAE</th>
                        <th className="py-2.5 px-3">Matched Conditions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentComparison.historicalMatches.slice(0, 15).map(match => (
                        <tr key={match.observationId} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{match.date}</td>
                          <td className="py-2.5 px-3 font-bold text-indigo-700">{match.symbol}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {match.marketRegime}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-700">
                            {match.similarityScore.toFixed(0)}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            NPR {match.entryPrice.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold font-mono">
                            <span className={match.forwardReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                              {match.forwardReturn >= 0 ? `+${match.forwardReturn.toFixed(2)}%` : `${match.forwardReturn.toFixed(2)}%`}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                            <span className="text-emerald-600">+{match.mfe.toFixed(1)}%</span> /{' '}
                            <span className="text-rose-500">{match.mae.toFixed(1)}%</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[11px] text-slate-600">
                              {match.matchedConditions.join(', ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>Strict Research Disclaimer:</strong> Historical conditional evidence is descriptive research and does not constitute a trading recommendation or guarantee of future price performance.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              Loading current condition similarity matches...
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 7: OUT-OF-SAMPLE FEATURE SELECTION REPORT
         ------------------------------------------------------------- */}
      {activeTab === 'SELECTION_REPORT' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                  Partition Disciplined Selection
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Train (&lt;=2023) → Validation (2024-2025) → Test (2025+ Untouched)
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Out-of-Sample Feature Selection Report
              </h3>
              <p className="text-xs text-slate-500">
                Filters features strictly using Training partition metrics and confirms persistence on Validation data. Test dataset is never used for feature selection.
              </p>
            </div>

            {/* Filter Criteria Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Min Train Win Rate (%)
                </label>
                <input
                  type="number"
                  value={selectionCriteria.minWinRate}
                  onChange={e =>
                    setSelectionCriteria({ ...selectionCriteria, minWinRate: Number(e.target.value) })
                  }
                  className="w-full text-xs p-1.5 border rounded bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Min Stability Score (0-100)
                </label>
                <input
                  type="number"
                  value={selectionCriteria.minStabilityScore}
                  onChange={e =>
                    setSelectionCriteria({
                      ...selectionCriteria,
                      minStabilityScore: Number(e.target.value)
                    })
                  }
                  className="w-full text-xs p-1.5 border rounded bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Max Redundancy Corr (ρ)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={selectionCriteria.maxCorrelationThreshold}
                  onChange={e =>
                    setSelectionCriteria({
                      ...selectionCriteria,
                      maxCorrelationThreshold: Number(e.target.value)
                    })
                  }
                  className="w-full text-xs p-1.5 border rounded bg-slate-50"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleRecalculateSelectionReport}
                  disabled={loading}
                  className="w-full py-1.5 px-3 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition"
                >
                  Apply Filter Criteria
                </button>
              </div>
            </div>
          </div>

          {/* Selection Table */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Feature</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Train Win%</th>
                    <th className="py-3 px-3 text-right">Train Mean</th>
                    <th className="py-3 px-3 text-right">Val Win%</th>
                    <th className="py-3 px-3 text-right">Val Mean</th>
                    <th className="py-3 px-3 text-right">Test Win% (Untouched)</th>
                    <th className="py-3 px-3 text-right">Stability Score</th>
                    <th className="py-3 px-3">Selection Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectionReport.map(item => (
                    <tr
                      key={item.featureId}
                      className={`hover:bg-slate-50/50 ${
                        item.selected ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{item.featureName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{item.featureId}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                        {item.trainWinRate.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={item.trainMeanReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {item.trainMeanReturn >= 0 ? `+${item.trainMeanReturn.toFixed(2)}%` : `${item.trainMeanReturn.toFixed(2)}%`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                        {item.validationWinRate.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={item.validationMeanReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {item.validationMeanReturn >= 0 ? `+${item.validationMeanReturn.toFixed(2)}%` : `${item.validationMeanReturn.toFixed(2)}%`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {item.testWinRate !== undefined ? `${item.testWinRate.toFixed(1)}%` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {item.stabilityScore} / 100
                      </td>
                      <td className="py-2.5 px-3">
                        {item.selected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Selected
                          </span>
                        ) : (
                          <div className="text-[11px] text-rose-700 font-medium">
                            Rejected: {item.rejectionReason}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 8: PROBABILITY CALIBRATION & CONTROLS
         ------------------------------------------------------------- */}
      {activeTab === 'CALIBRATION' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
            <h3 className="text-base font-bold text-slate-900">
              Probability Calibration & Multiple-Testing Audit
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Validates whether events estimated at approximately 60% probability empirically occur 60% of the time. Prevents overconfident probability estimates.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calibration Table */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Probability Calibration Buckets
              </h4>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Predicted Bin</th>
                      <th className="py-2.5 px-3 text-right">Predicted Mean</th>
                      <th className="py-2.5 px-3 text-right">Observed Frequency</th>
                      <th className="py-2.5 px-3 text-right">Deviation</th>
                      <th className="py-2.5 px-3 text-right">Sample (N)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calibrationBuckets.map(b => (
                      <tr key={b.predictedBinMin} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-bold text-slate-800">
                          {b.predictedBinMin}% - {b.predictedBinMax}%
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">
                          {b.predictedMean.toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">
                          {b.observedFrequency.toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          <span
                            className={`font-bold ${
                              Math.abs(b.deviation) <= 5
                                ? 'text-emerald-600'
                                : Math.abs(b.deviation) <= 10
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {b.deviation >= 0 ? `+${b.deviation.toFixed(1)}%` : `${b.deviation.toFixed(1)}%`}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500">
                          {b.sampleCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Philosophy & Guardrails */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Phase 3C Research Disciplines
              </h4>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <strong className="text-slate-800 block mb-1">Evidence Over Intuition:</strong>
                  No indicator or feature is assumed to possess edge unless supported by historical conditional data with confidence intervals.
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <strong className="text-slate-800 block mb-1">Sample Size Discipline:</strong>
                  Small samples (N &lt; 30) are flagged and smoothed via Bayesian Beta-Binomial priors, preventing 100% illusions.
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <strong className="text-slate-800 block mb-1">Partition Integrity:</strong>
                  Features are selected solely on Train; validation ensures persistence; test data evaluates untouched real-world degradation.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrity Audit Modal */}
      <FeatureIntegrityModal
        isOpen={integrityModalOpen}
        onClose={() => setIntegrityModalOpen(false)}
      />
    </div>
  );
};
