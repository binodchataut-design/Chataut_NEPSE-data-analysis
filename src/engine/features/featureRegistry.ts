/**
 * Feature Registry for Phase 3C
 * Controlled catalog of standardized research features across all 12 categories.
 * Separates raw technical indicators from derived, normalized, and discretized research features.
 */

import { FeatureDefinition, FeatureBin } from '../../types/featureEngine';

export class FeatureRegistry {
  private static features: FeatureDefinition[] = [
    // -------------------------------------------------------------
    // 1. TREND
    // -------------------------------------------------------------
    {
      featureId: 'FEAT_PRICE_VS_SMA50_ATR',
      name: 'Price Distance to SMA50 (ATR-normalized)',
      category: 'TREND',
      sourceIndicator: 'SMA / ATR',
      description: 'Measures how many ATRs price is extended above or below its 50-day simple moving average.',
      formulaDescription: '(Close - SMA50) / ATR14',
      normalizationMethod: 'ATR_NORMALIZED_DISTANCE',
      parameters: { maPeriod: 50, atrPeriod: 14 },
      defaultBins: [
        { id: 'BIN_P_SMA50_V_LOW', label: '< -2.0 ATR', min: -999, max: -2.0, inclusiveMin: true, inclusiveMax: false, description: 'Severely oversold below trend' },
        { id: 'BIN_P_SMA50_LOW', label: '-2.0 to -0.5 ATR', min: -2.0, max: -0.5, inclusiveMin: true, inclusiveMax: false, description: 'Discounted below trend' },
        { id: 'BIN_P_SMA50_NEUTRAL', label: '-0.5 to +0.5 ATR', min: -0.5, max: 0.5, inclusiveMin: true, inclusiveMax: false, description: 'Mean-reverted at SMA50' },
        { id: 'BIN_P_SMA50_HIGH', label: '+0.5 to +2.0 ATR', min: 0.5, max: 2.0, inclusiveMin: true, inclusiveMax: false, description: 'Moderate bullish trend' },
        { id: 'BIN_P_SMA50_EXTREME', label: '> +2.0 ATR', min: 2.0, max: 999, inclusiveMin: true, inclusiveMax: true, description: 'Overextended above trend' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },
    {
      featureId: 'FEAT_SMA20_SMA50_RATIO',
      name: 'SMA20 / SMA50 Trend Ratio',
      category: 'TREND',
      sourceIndicator: 'SMA',
      description: 'Moving average slope alignment measuring intermediate vs medium-term momentum alignment.',
      formulaDescription: '((SMA20 - SMA50) / SMA50) * 100',
      normalizationMethod: 'PERCENTILE_RANK',
      parameters: { fastPeriod: 20, slowPeriod: 50 },
      defaultBins: [
        { id: 'BIN_SMA_RATIO_BEAR', label: '< -3.0%', min: -999, max: -3.0, inclusiveMin: true, inclusiveMax: false, description: 'Strong bear alignment' },
        { id: 'BIN_SMA_RATIO_WEAK_BEAR', label: '-3.0% to 0.0%', min: -3.0, max: 0, inclusiveMin: true, inclusiveMax: false, description: 'Mild bear cross' },
        { id: 'BIN_SMA_RATIO_WEAK_BULL', label: '0.0% to +3.0%', min: 0, max: 3.0, inclusiveMin: true, inclusiveMax: false, description: 'Mild golden cross' },
        { id: 'BIN_SMA_RATIO_STRONG_BULL', label: '> +3.0%', min: 3.0, max: 999, inclusiveMin: true, inclusiveMax: true, description: 'Strong bull alignment' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },
    {
      featureId: 'FEAT_ADX_TREND_STRENGTH',
      name: 'ADX Trend Strength',
      category: 'TREND',
      sourceIndicator: 'ADX',
      description: 'Directional movement system reading reflecting directional inertia regardless of polarity.',
      formulaDescription: 'ADX(14)',
      normalizationMethod: 'RAW',
      parameters: { period: 14 },
      defaultBins: [
        { id: 'BIN_ADX_ABSENT', label: '< 15 (No Trend)', min: 0, max: 15, inclusiveMin: true, inclusiveMax: false, description: 'Choppy sideways range' },
        { id: 'BIN_ADX_DEVELOPING', label: '15 - 20 (Developing)', min: 15, max: 20, inclusiveMin: true, inclusiveMax: false, description: 'Emerging directional bias' },
        { id: 'BIN_ADX_CONFIRMED', label: '20 - 25 (Confirmed)', min: 20, max: 25, inclusiveMin: true, inclusiveMax: false, description: 'Standard trending regime' },
        { id: 'BIN_ADX_STRONG', label: '25 - 35 (Strong)', min: 25, max: 35, inclusiveMin: true, inclusiveMax: false, description: 'High momentum trend' },
        { id: 'BIN_ADX_EXTREME', label: '> 35 (Extreme)', min: 35, max: 100, inclusiveMin: true, inclusiveMax: true, description: 'Parabolic trend climax' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },

    // -------------------------------------------------------------
    // 2. MOMENTUM
    // -------------------------------------------------------------
    {
      featureId: 'FEAT_RSI_14_ZONE',
      name: 'RSI(14) Discrete Regime Zone',
      category: 'MOMENTUM',
      sourceIndicator: 'RSI',
      description: 'Standard 14-period Relative Strength Index partitioned into 6 empirical momentum zones.',
      formulaDescription: 'RSI(14, Close)',
      normalizationMethod: 'RAW',
      parameters: { period: 14 },
      defaultBins: [
        { id: 'BIN_RSI_OVERSOLD', label: '< 30 (Oversold)', min: 0, max: 30, inclusiveMin: true, inclusiveMax: false, description: 'Deep oversold regime' },
        { id: 'BIN_RSI_BEAR_SUPPORT', label: '30 - 40 (Bear Support)', min: 30, max: 40, inclusiveMin: true, inclusiveMax: false, description: 'Weak rebound zone' },
        { id: 'BIN_RSI_NEUTRAL_BEAR', label: '40 - 50 (Neutral Bear)', min: 40, max: 50, inclusiveMin: true, inclusiveMax: false, description: 'Sub-50 consolidation' },
        { id: 'BIN_RSI_BULL_ACCUM', label: '50 - 60 (Bull Accumulation)', min: 50, max: 60, inclusiveMin: true, inclusiveMax: false, description: 'Constructive bull expansion' },
        { id: 'BIN_RSI_BULL_POWER', label: '60 - 70 (Bull Power)', min: 60, max: 70, inclusiveMin: true, inclusiveMax: false, description: 'High momentum trending zone' },
        { id: 'BIN_RSI_OVERBOUGHT', label: '> 70 (Overbought)', min: 70, max: 100, inclusiveMin: true, inclusiveMax: true, description: 'Extreme overbought territory' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },
    {
      featureId: 'FEAT_RSI_ROLLING_PERCENTILE',
      name: 'RSI 100-bar Rolling Percentile',
      category: 'MOMENTUM',
      sourceIndicator: 'RSI',
      description: 'Percentile rank of current RSI relative to the past 100 trading sessions of the same stock.',
      formulaDescription: 'PercentileRank(RSI14, window=100)',
      normalizationMethod: 'PERCENTILE_RANK',
      parameters: { rsiPeriod: 14, window: 100 },
      defaultBins: [
        { id: 'BIN_RSI_PCT_0_20', label: '0% - 20% (Lowest Quintile)', min: 0, max: 20, inclusiveMin: true, inclusiveMax: false, description: 'Historically depressed' },
        { id: 'BIN_RSI_PCT_20_40', label: '20% - 40%', min: 20, max: 40, inclusiveMin: true, inclusiveMax: false, description: 'Below average' },
        { id: 'BIN_RSI_PCT_40_60', label: '40% - 60% (Median)', min: 40, max: 60, inclusiveMin: true, inclusiveMax: false, description: 'Historical median' },
        { id: 'BIN_RSI_PCT_60_80', label: '60% - 80%', min: 60, max: 80, inclusiveMin: true, inclusiveMax: false, description: 'Above average' },
        { id: 'BIN_RSI_PCT_80_100', label: '80% - 100% (Highest Quintile)', min: 80, max: 100, inclusiveMin: true, inclusiveMax: true, description: 'Historically elevated' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },
    {
      featureId: 'FEAT_MACD_HIST_NORM',
      name: 'MACD Histogram (ATR-Normalized)',
      category: 'MOMENTUM',
      sourceIndicator: 'MACD / ATR',
      description: 'Normalized MACD Histogram amplitude relative to prevailing ATR volatility.',
      formulaDescription: 'MACD_Hist(12,26,9) / ATR14',
      normalizationMethod: 'Z_SCORE',
      parameters: { fast: 12, slow: 26, signal: 9, atrPeriod: 14 },
      defaultBins: [
        { id: 'BIN_MACD_NEG_EXTREME', label: '< -0.50', min: -999, max: -0.5, inclusiveMin: true, inclusiveMax: false, description: 'Strong bear impulse' },
        { id: 'BIN_MACD_NEG_MILD', label: '-0.50 to 0.0', min: -0.5, max: 0, inclusiveMin: true, inclusiveMax: false, description: 'Weak bear divergence' },
        { id: 'BIN_MACD_POS_MILD', label: '0.0 to +0.50', min: 0, max: 0.5, inclusiveMin: true, inclusiveMax: false, description: 'Emerging bull impulse' },
        { id: 'BIN_MACD_POS_STRONG', label: '> +0.50', min: 0.5, max: 999, inclusiveMin: true, inclusiveMax: true, description: 'Strong bull impulse' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },
    {
      featureId: 'FEAT_STOCH_K_14',
      name: 'Stochastic %K Oscillator',
      category: 'MOMENTUM',
      sourceIndicator: 'STOCHASTIC',
      description: 'Location of close within the 14-bar High-Low range.',
      formulaDescription: '((Close - LowestLow14) / (HighestHigh14 - LowestLow14)) * 100',
      normalizationMethod: 'RAW',
      parameters: { period: 14, smoothK: 3 },
      defaultBins: [
        { id: 'BIN_STOCH_OVERSOLD', label: '< 20 (Oversold)', min: 0, max: 20, inclusiveMin: true, inclusiveMax: false, description: 'At 14-day lows' },
        { id: 'BIN_STOCH_MID', label: '20 - 80 (Neutral)', min: 20, max: 80, inclusiveMin: true, inclusiveMax: false, description: 'Mid-range oscillations' },
        { id: 'BIN_STOCH_OVERBOUGHT', label: '> 80 (Overbought)', min: 80, max: 100, inclusiveMin: true, inclusiveMax: true, description: 'At 14-day highs' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },

    // -------------------------------------------------------------
    // 3. VOLUME
    // -------------------------------------------------------------
    {
      featureId: 'FEAT_VOLUME_MA20_RATIO',
      name: 'Volume / 20-day Volume SMA Ratio',
      category: 'VOLUME',
      sourceIndicator: 'VOLUME / SMA',
      description: 'Surge factor comparing today’s volume to its 20-day moving average.',
      formulaDescription: 'Volume / SMA(Volume, 20)',
      normalizationMethod: 'RAW',
      parameters: { period: 20 },
      defaultBins: [
        { id: 'BIN_VOL_VERY_LOW', label: '< 0.5x (Depressed)', min: 0, max: 0.5, inclusiveMin: true, inclusiveMax: false, description: 'Drying up liquidity' },
        { id: 'BIN_VOL_LOW', label: '0.5x - 1.0x (Sub-average)', min: 0.5, max: 1.0, inclusiveMin: true, inclusiveMax: false, description: 'Below baseline' },
        { id: 'BIN_VOL_NORMAL', label: '1.0x - 1.5x (Moderate)', min: 1.0, max: 1.5, inclusiveMin: true, inclusiveMax: false, description: 'Mild volume interest' },
        { id: 'BIN_VOL_ELEVATED', label: '1.5x - 2.0x (Elevated)', min: 1.5, max: 2.0, inclusiveMin: true, inclusiveMax: false, description: 'Institutional activity' },
        { id: 'BIN_VOL_EXPANSION', label: '> 2.0x (Surge)', min: 2.0, max: 999, inclusiveMin: true, inclusiveMax: true, description: 'Major volume breakout' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },
    {
      featureId: 'FEAT_CMF_20',
      name: 'Chaikin Money Flow (20)',
      category: 'VOLUME',
      sourceIndicator: 'CMF',
      description: 'Volume-weighted accumulation-distribution pressure over 20 trading sessions.',
      formulaDescription: 'Sum(MoneyFlowVolume, 20) / Sum(Volume, 20)',
      normalizationMethod: 'RAW',
      parameters: { period: 20 },
      defaultBins: [
        { id: 'BIN_CMF_HEAVY_DIST', label: '< -0.15 (Heavy Outflow)', min: -1, max: -0.15, inclusiveMin: true, inclusiveMax: false, description: 'Active institutional distribution' },
        { id: 'BIN_CMF_MILD_DIST', label: '-0.15 to 0.0 (Mild Outflow)', min: -0.15, max: 0, inclusiveMin: true, inclusiveMax: false, description: 'Slight selling bias' },
        { id: 'BIN_CMF_MILD_ACCUM', label: '0.0 to +0.15 (Mild Accumulation)', min: 0, max: 0.15, inclusiveMin: true, inclusiveMax: false, description: 'Positive inflow' },
        { id: 'BIN_CMF_STRONG_ACCUM', label: '> +0.15 (Strong Accumulation)', min: 0.15, max: 1, inclusiveMin: true, inclusiveMax: true, description: 'Heavy accumulation buying' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },

    // -------------------------------------------------------------
    // 4. VOLATILITY
    // -------------------------------------------------------------
    {
      featureId: 'FEAT_ATR_PERCENTILE_100',
      name: 'ATR 100-bar Percentile Rank',
      category: 'VOLATILITY',
      sourceIndicator: 'ATR',
      description: 'Evaluates current volatility relative to its trailing 100-session distribution.',
      formulaDescription: 'PercentileRank(ATR14, window=100)',
      normalizationMethod: 'PERCENTILE_RANK',
      parameters: { atrPeriod: 14, window: 100 },
      defaultBins: [
        { id: 'BIN_ATR_PCT_COMPRESSED', label: '< 20% (Compression)', min: 0, max: 20, inclusiveMin: true, inclusiveMax: false, description: 'Volatility squeeze setup' },
        { id: 'BIN_ATR_PCT_NORMAL', label: '20% - 70% (Standard)', min: 20, max: 70, inclusiveMin: true, inclusiveMax: false, description: 'Typical session volatility' },
        { id: 'BIN_ATR_PCT_EXPANDED', label: '> 70% (Expansion)', min: 70, max: 100, inclusiveMin: true, inclusiveMax: true, description: 'High volatility expansion' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },
    {
      featureId: 'FEAT_BB_BANDWIDTH',
      name: 'Bollinger Bandwidth %',
      category: 'VOLATILITY',
      sourceIndicator: 'BOLLINGER',
      description: 'Normalized spread between Upper and Lower Bollinger bands.',
      formulaDescription: '((Upper - Lower) / Middle) * 100',
      normalizationMethod: 'RAW',
      parameters: { period: 20, stdDev: 2 },
      defaultBins: [
        { id: 'BIN_BBW_SQUEEZE', label: '< 6.0% (Squeeze)', min: 0, max: 6.0, inclusiveMin: true, inclusiveMax: false, description: 'Pre-breakout volatility pinch' },
        { id: 'BIN_BBW_NORMAL', label: '6.0% - 15.0% (Normal)', min: 6.0, max: 15.0, inclusiveMin: true, inclusiveMax: false, description: 'Standard volatility band' },
        { id: 'BIN_BBW_EXPANDED', label: '> 15.0% (Expanded)', min: 15.0, max: 100, inclusiveMin: true, inclusiveMax: true, description: 'Volatile trend swing' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },

    // -------------------------------------------------------------
    // 5. PRICE STRUCTURE
    // -------------------------------------------------------------
    {
      featureId: 'FEAT_DIST_FROM_20D_HIGH',
      name: 'Distance from 20-day High %',
      category: 'PRICE_STRUCTURE',
      sourceIndicator: 'PRICE',
      description: 'Percentage drawdown from the rolling 20-session high.',
      formulaDescription: '((Close - Highest(High, 20)) / Highest(High, 20)) * 100',
      normalizationMethod: 'RAW',
      parameters: { period: 20 },
      defaultBins: [
        { id: 'BIN_HIGH20_AT_HIGH', label: '-1.0% to 0.0% (At Highs)', min: -1.0, max: 0.0, inclusiveMin: true, inclusiveMax: true, description: 'Breaking out / at peak' },
        { id: 'BIN_HIGH20_PULLBACK', label: '-5.0% to -1.0% (Pullback)', min: -5.0, max: -1.0, inclusiveMin: true, inclusiveMax: false, description: 'Shallow consolidation' },
        { id: 'BIN_HIGH20_CORRECTION', label: '-10.0% to -5.0% (Correction)', min: -10.0, max: -5.0, inclusiveMin: true, inclusiveMax: false, description: 'Intermediate pullback' },
        { id: 'BIN_HIGH20_DEEP', label: '< -10.0% (Deep Drop)', min: -999, max: -10.0, inclusiveMin: true, inclusiveMax: false, description: 'Deep breakdown' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },

    // -------------------------------------------------------------
    // 6. RELATIVE STRENGTH
    // -------------------------------------------------------------
    {
      featureId: 'FEAT_RS_NEPSE_20D',
      name: '20-day Relative Strength vs NEPSE Benchmark',
      category: 'RELATIVE_STRENGTH',
      sourceIndicator: 'BENCHMARK_RATIO',
      description: 'Outperformance of stock compared to NEPSE Index over a 20-day window.',
      formulaDescription: 'StockReturn20D - NepseReturn20D',
      normalizationMethod: 'PERCENTILE_RANK',
      parameters: { period: 20 },
      defaultBins: [
        { id: 'BIN_RS_LAGGING', label: '< -5.0% (Severe Lag)', min: -999, max: -5.0, inclusiveMin: true, inclusiveMax: false, description: 'Underperforming market' },
        { id: 'BIN_RS_NEUTRAL', label: '-5.0% to +5.0% (In-line)', min: -5.0, max: 5.0, inclusiveMin: true, inclusiveMax: false, description: 'Tracking market beta' },
        { id: 'BIN_RS_LEADING', label: '> +5.0% (Market Leader)', min: 5.0, max: 999, inclusiveMin: true, inclusiveMax: true, description: 'Strong institutional leadership' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },

    // -------------------------------------------------------------
    // 7. MARKET REGIME
    // -------------------------------------------------------------
    {
      featureId: 'FEAT_MARKET_REGIME_STATE',
      name: 'NEPSE Index Regime State',
      category: 'MARKET_REGIME',
      sourceIndicator: 'REGIME_CLASSIFIER',
      description: 'Macro regime state of the broad NEPSE index (1=Bull, 0=Sideways, -1=Bear).',
      formulaDescription: 'RegimeClassifier(NEPSE, t)',
      normalizationMethod: 'RAW',
      parameters: { smaFast: 20, smaSlow: 50 },
      defaultBins: [
        { id: 'BIN_REGIME_BEAR', label: 'Bear Market (-1)', min: -1.5, max: -0.5, inclusiveMin: true, inclusiveMax: false, description: 'Broad market downtrend' },
        { id: 'BIN_REGIME_SIDEWAYS', label: 'Sideways / Neutral (0)', min: -0.5, max: 0.5, inclusiveMin: true, inclusiveMax: false, description: 'Broad market consolidation' },
        { id: 'BIN_REGIME_BULL', label: 'Bull Market (+1)', min: 0.5, max: 1.5, inclusiveMin: true, inclusiveMax: true, description: 'Broad market uptrend' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },

    // -------------------------------------------------------------
    // 8. SECTOR REGIME
    // -------------------------------------------------------------
    {
      featureId: 'FEAT_SECTOR_TREND_STATE',
      name: 'Sector Trend Direction',
      category: 'SECTOR_REGIME',
      sourceIndicator: 'SECTOR_INDEX',
      description: 'Sector average trend relative to SMA20 (1=Positive, 0=Neutral, -1=Negative).',
      formulaDescription: 'SectorTrend(Sector, t)',
      normalizationMethod: 'RAW',
      parameters: { period: 20 },
      defaultBins: [
        { id: 'BIN_SECTOR_DOWN', label: 'Sector Bear (-1)', min: -1.5, max: -0.5, inclusiveMin: true, inclusiveMax: false, description: 'Sector in downtrend' },
        { id: 'BIN_SECTOR_NEUTRAL', label: 'Sector Neutral (0)', min: -0.5, max: 0.5, inclusiveMin: true, inclusiveMax: false, description: 'Sector consolidating' },
        { id: 'BIN_SECTOR_UP', label: 'Sector Bull (+1)', min: 0.5, max: 1.5, inclusiveMin: true, inclusiveMax: true, description: 'Sector in uptrend' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },

    // -------------------------------------------------------------
    // 9. LIQUIDITY
    // -------------------------------------------------------------
    {
      featureId: 'FEAT_TURNOVER_20D_AVG',
      name: '20-day Average Turnover (NPR Lakhs)',
      category: 'LIQUIDITY',
      sourceIndicator: 'TURNOVER',
      description: 'Average daily traded value in Lakhs NPR over past 20 sessions.',
      formulaDescription: 'SMA(Close * Volume, 20) / 100000',
      normalizationMethod: 'RAW',
      parameters: { period: 20 },
      defaultBins: [
        { id: 'BIN_LIQ_ILLIQUID', label: '< 10 Lakhs (Illiquid)', min: 0, max: 10, inclusiveMin: true, inclusiveMax: false, description: 'High slippage risk' },
        { id: 'BIN_LIQ_MODERATE', label: '10 - 50 Lakhs (Moderate)', min: 10, max: 50, inclusiveMin: true, inclusiveMax: false, description: 'Retail tradable' },
        { id: 'BIN_LIQ_HIGH', label: '50 - 200 Lakhs (Liquid)', min: 50, max: 200, inclusiveMin: true, inclusiveMax: false, description: 'Liquid institutional tier' },
        { id: 'BIN_LIQ_VERY_HIGH', label: '> 200 Lakhs (Mega Liquid)', min: 200, max: 999999, inclusiveMin: true, inclusiveMax: true, description: 'Top turnover tier' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },

    // -------------------------------------------------------------
    // 10. STATISTICAL
    // -------------------------------------------------------------
    {
      featureId: 'FEAT_ROLLING_Z_SCORE_50',
      name: 'Rolling 50-bar Price Z-Score',
      category: 'STATISTICAL',
      sourceIndicator: 'STAT_ANALYSIS',
      description: 'Standard deviations of price away from rolling 50-session mean.',
      formulaDescription: '(Close - Mean(Close, 50)) / StdDev(Close, 50)',
      normalizationMethod: 'ROLLING_Z_SCORE',
      parameters: { period: 50 },
      defaultBins: [
        { id: 'BIN_Z_EXTREME_LOW', label: '< -2.0 sigma', min: -999, max: -2.0, inclusiveMin: true, inclusiveMax: false, description: 'Statistically 2 sigma low' },
        { id: 'BIN_Z_LOW', label: '-2.0 to -1.0 sigma', min: -2.0, max: -1.0, inclusiveMin: true, inclusiveMax: false, description: '1 sigma discount' },
        { id: 'BIN_Z_NORMAL', label: '-1.0 to +1.0 sigma', min: -1.0, max: 1.0, inclusiveMin: true, inclusiveMax: false, description: 'Inside normal distribution band' },
        { id: 'BIN_Z_HIGH', label: '+1.0 to +2.0 sigma', min: 1.0, max: 2.0, inclusiveMin: true, inclusiveMax: false, description: '1 sigma elevation' },
        { id: 'BIN_Z_EXTREME_HIGH', label: '> +2.0 sigma', min: 2.0, max: 999, inclusiveMin: true, inclusiveMax: true, description: 'Statistically 2 sigma high' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    },

    // -------------------------------------------------------------
    // 11. CROSS_SECTIONAL
    // -------------------------------------------------------------
    {
      featureId: 'FEAT_CROSS_SECTIONAL_MOMENTUM_PCT',
      name: 'Cross-Sectional Momentum Percentile Rank',
      category: 'CROSS_SECTIONAL',
      sourceIndicator: 'CROSS_SECTIONAL_ENGINE',
      description: 'Rank of stock 20-day return compared to all other NEPSE stocks on the same date.',
      formulaDescription: 'Rank(StockReturn20D_t, Universe_t) / Count(Universe_t) * 100',
      normalizationMethod: 'CROSS_SECTIONAL_PERCENTILE',
      parameters: { returnPeriod: 20 },
      defaultBins: [
        { id: 'BIN_CS_MOM_Q1', label: '0% - 20% (Bottom Quintile)', min: 0, max: 20, inclusiveMin: true, inclusiveMax: false, description: 'Worst relative performers' },
        { id: 'BIN_CS_MOM_Q2', label: '20% - 40%', min: 20, max: 40, inclusiveMin: true, inclusiveMax: false, description: 'Below-average market performance' },
        { id: 'BIN_CS_MOM_Q3', label: '40% - 60% (Median)', min: 40, max: 60, inclusiveMin: true, inclusiveMax: false, description: 'Market-average return' },
        { id: 'BIN_CS_MOM_Q4', label: '60% - 80%', min: 60, max: 80, inclusiveMin: true, inclusiveMax: false, description: 'Above-average leadership' },
        { id: 'BIN_CS_MOM_Q5', label: '80% - 100% (Top Quintile)', min: 80, max: 100, inclusiveMin: true, inclusiveMax: true, description: 'Market leaders on date' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: true
    },

    // -------------------------------------------------------------
    // 12. COMPOSITE
    // -------------------------------------------------------------
    {
      featureId: 'FEAT_BULLISH_ALIGNMENT_SCORE',
      name: 'Bullish Multi-Factor Alignment Score',
      category: 'COMPOSITE',
      sourceIndicator: 'MULTI_FACTOR',
      description: 'Count of concurrent bullish criteria (Price > SMA50, SMA20 > SMA50, RSI > 50, Volume > SMA20, MACD Hist > 0).',
      formulaDescription: 'Sum(BullishConditionFlags, max=5)',
      normalizationMethod: 'RAW',
      parameters: { maxFactors: 5 },
      defaultBins: [
        { id: 'BIN_ALIGN_0_1', label: '0 - 1 Factors (Full Bear)', min: 0, max: 1, inclusiveMin: true, inclusiveMax: true, description: 'No bullish technical support' },
        { id: 'BIN_ALIGN_2_3', label: '2 - 3 Factors (Mixed)', min: 2, max: 3, inclusiveMin: true, inclusiveMax: true, description: 'Conflicted market conditions' },
        { id: 'BIN_ALIGN_4_5', label: '4 - 5 Factors (Confluent Bull)', min: 4, max: 5, inclusiveMin: true, inclusiveMax: true, description: 'Strong technical confluence' },
      ],
      calculationVersion: 'FEAT_V1',
      isCrossSectional: false
    }
  ];

  public static getAllFeatures(): FeatureDefinition[] {
    return [...this.features];
  }

  public static getFeatureById(featureId: string): FeatureDefinition | undefined {
    return this.features.find(f => f.featureId === featureId);
  }

  public static getFeaturesByCategory(category: string): FeatureDefinition[] {
    return this.features.filter(f => f.category === category);
  }
}
