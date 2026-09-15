/**
 * Chart Pattern Recognition Framework
 *
 * RIGOROUS IMPLEMENTATION PHILOSOPHY:
 * Only patterns that can be identified with deterministic mathematical geometric criteria
 * from OHLCV swing pivots are implemented (Double Top, Double Bottom, Head & Shoulders,
 * Inverse H&S, Ascending Triangle, Descending Triangle, Rectangle).
 *
 * Subjective or lower-confidence patterns (Cup & Handle, Symmetrical Triangle, Wedges, Flags,
 * Pennants) are explicitly declared with their architectural interfaces and marked as
 * NOT IMPLEMENTED until rigorous criteria are proven.
 * Calculation Version: v1.0
 */

import { ChartPatternDetection, OHLCVBar } from '../../types/technicalIndicators';
import { detectSwingPoints } from './priceStructure';

export const CHART_PATTERNS_VERSION = 'v1.0';

export function scanChartPatterns(bars: OHLCVBar[]): ChartPatternDetection[] {
  const detections: ChartPatternDetection[] = [];
  const len = bars.length;
  if (len < 20) return detections;

  const { swingHighs, swingLows } = detectSwingPoints(bars, 4, 4);

  // 1. DOUBLE TOP (Two swing highs within 1.5% tolerance with intermediate valley)
  if (swingHighs.length >= 2) {
    const sh2 = swingHighs[swingHighs.length - 1]; // Recent
    const sh1 = swingHighs[swingHighs.length - 2]; // Earlier
    const diffPct = Math.abs(sh2.price - sh1.price) / sh1.price * 100;

    // Find intervening valley
    const interveningLows = swingLows.filter(sl => sl.index > sh1.index && sl.index < sh2.index);
    if (diffPct <= 1.8 && interveningLows.length > 0) {
      const neckline = Math.min(...interveningLows.map(l => l.price));
      const target = neckline - (sh1.price - neckline);
      detections.push({
        patternId: 'DOUBLE_TOP',
        patternName: 'Double Top',
        status: 'IMPLEMENTED',
        detected: true,
        direction: 'BEARISH',
        confidence: Math.round(Math.max(60, 95 - diffPct * 15)),
        startDate: sh1.date,
        endDate: sh2.date,
        keyLevels: {
          neckline,
          target,
          invalidation: Math.max(sh1.price, sh2.price) * 1.01
        },
        notes: `Two peaks at ${sh1.price} and ${sh2.price} (${diffPct.toFixed(2)}% spread) with intervening valley at ${neckline}.`
      });
    }
  }

  // 2. DOUBLE BOTTOM (Two swing lows within 1.5% tolerance with intermediate peak)
  if (swingLows.length >= 2) {
    const sl2 = swingLows[swingLows.length - 1];
    const sl1 = swingLows[swingLows.length - 2];
    const diffPct = Math.abs(sl2.price - sl1.price) / sl1.price * 100;

    const interveningHighs = swingHighs.filter(sh => sh.index > sl1.index && sh.index < sl2.index);
    if (diffPct <= 1.8 && interveningHighs.length > 0) {
      const neckline = Math.max(...interveningHighs.map(h => h.price));
      const target = neckline + (neckline - sl1.price);
      detections.push({
        patternId: 'DOUBLE_BOTTOM',
        patternName: 'Double Bottom',
        status: 'IMPLEMENTED',
        detected: true,
        direction: 'BULLISH',
        confidence: Math.round(Math.max(60, 95 - diffPct * 15)),
        startDate: sl1.date,
        endDate: sl2.date,
        keyLevels: {
          neckline,
          target,
          invalidation: Math.min(sl1.price, sl2.price) * 0.99
        },
        notes: `Two troughs at ${sl1.price} and ${sl2.price} (${diffPct.toFixed(2)}% spread) with intervening peak at ${neckline}.`
      });
    }
  }

  // 3. HEAD AND SHOULDERS (Left shoulder, higher head, lower right shoulder)
  if (swingHighs.length >= 3) {
    const sRight = swingHighs[swingHighs.length - 1];
    const sHead = swingHighs[swingHighs.length - 2];
    const sLeft = swingHighs[swingHighs.length - 3];

    if (sHead.price > sLeft.price && sHead.price > sRight.price) {
      const shoulderDiff = Math.abs(sLeft.price - sRight.price) / sLeft.price * 100;
      if (shoulderDiff <= 4.0) {
        // Intervening valleys
        const trough1 = swingLows.find(l => l.index > sLeft.index && l.index < sHead.index);
        const trough2 = swingLows.find(l => l.index > sHead.index && l.index < sRight.index);
        if (trough1 && trough2) {
          const neckline = (trough1.price + trough2.price) / 2;
          const target = neckline - (sHead.price - neckline);
          detections.push({
            patternId: 'HEAD_AND_SHOULDERS',
            patternName: 'Head and Shoulders',
            status: 'IMPLEMENTED',
            detected: true,
            direction: 'BEARISH',
            confidence: 85,
            startDate: sLeft.date,
            endDate: sRight.date,
            keyLevels: {
              neckline,
              target,
              invalidation: sHead.price * 1.01
            },
            notes: `Left shoulder (${sLeft.price}), Head (${sHead.price}), Right shoulder (${sRight.price}) with neckline at ${neckline.toFixed(1)}.`
          });
        }
      }
    }
  }

  // 4. INVERSE HEAD AND SHOULDERS
  if (swingLows.length >= 3) {
    const sRight = swingLows[swingLows.length - 1];
    const sHead = swingLows[swingLows.length - 2];
    const sLeft = swingLows[swingLows.length - 3];

    if (sHead.price < sLeft.price && sHead.price < sRight.price) {
      const shoulderDiff = Math.abs(sLeft.price - sRight.price) / sLeft.price * 100;
      if (shoulderDiff <= 4.0) {
        const peak1 = swingHighs.find(h => h.index > sLeft.index && h.index < sHead.index);
        const peak2 = swingHighs.find(h => h.index > sHead.index && h.index < sRight.index);
        if (peak1 && peak2) {
          const neckline = (peak1.price + peak2.price) / 2;
          const target = neckline + (neckline - sHead.price);
          detections.push({
            patternId: 'INVERSE_HEAD_AND_SHOULDERS',
            patternName: 'Inverse Head and Shoulders',
            status: 'IMPLEMENTED',
            detected: true,
            direction: 'BULLISH',
            confidence: 85,
            startDate: sLeft.date,
            endDate: sRight.date,
            keyLevels: {
              neckline,
              target,
              invalidation: sHead.price * 0.99
            },
            notes: `Inverse formation: Left trough (${sLeft.price}), Head (${sHead.price}), Right trough (${sRight.price}).`
          });
        }
      }
    }
  }

  // 5. ASCENDING TRIANGLE (Horizontal resistance + Higher swing lows)
  if (swingHighs.length >= 2 && swingLows.length >= 2) {
    const h1 = swingHighs[swingHighs.length - 2];
    const h2 = swingHighs[swingHighs.length - 1];
    const l1 = swingLows[swingLows.length - 2];
    const l2 = swingLows[swingLows.length - 1];

    const highDiff = Math.abs(h2.price - h1.price) / h1.price * 100;
    if (highDiff <= 1.5 && l2.price > l1.price) {
      detections.push({
        patternId: 'ASCENDING_TRIANGLE',
        patternName: 'Ascending Triangle',
        status: 'IMPLEMENTED',
        detected: true,
        direction: 'BULLISH',
        confidence: 80,
        startDate: h1.date,
        endDate: h2.date,
        keyLevels: {
          upperBoundary: Math.max(h1.price, h2.price),
          lowerBoundary: l2.price,
          target: h2.price + (h2.price - l1.price)
        },
        notes: `Horizontal ceiling at ~${h1.price.toFixed(1)} with ascending swing lows (${l1.price} -> ${l2.price}).`
      });
    }
  }

  // 6. DESCENDING TRIANGLE (Horizontal support + Lower swing highs)
  if (swingHighs.length >= 2 && swingLows.length >= 2) {
    const h1 = swingHighs[swingHighs.length - 2];
    const h2 = swingHighs[swingHighs.length - 1];
    const l1 = swingLows[swingLows.length - 2];
    const l2 = swingLows[swingLows.length - 1];

    const lowDiff = Math.abs(l2.price - l1.price) / l1.price * 100;
    if (lowDiff <= 1.5 && h2.price < h1.price) {
      detections.push({
        patternId: 'DESCENDING_TRIANGLE',
        patternName: 'Descending Triangle',
        status: 'IMPLEMENTED',
        detected: true,
        direction: 'BEARISH',
        confidence: 80,
        startDate: l1.date,
        endDate: l2.date,
        keyLevels: {
          upperBoundary: h2.price,
          lowerBoundary: Math.min(l1.price, l2.price),
          target: l2.price - (h1.price - l1.price)
        },
        notes: `Horizontal floor at ~${l1.price.toFixed(1)} with descending swing highs (${h1.price} -> ${h2.price}).`
      });
    }
  }

  // 7. RECTANGLE / RANGE CONSOLIDATION
  if (swingHighs.length >= 2 && swingLows.length >= 2) {
    const h1 = swingHighs[swingHighs.length - 2];
    const h2 = swingHighs[swingHighs.length - 1];
    const l1 = swingLows[swingLows.length - 2];
    const l2 = swingLows[swingLows.length - 1];

    const highSpread = Math.abs(h2.price - h1.price) / h1.price * 100;
    const lowSpread = Math.abs(l2.price - l1.price) / l1.price * 100;

    if (highSpread <= 2.0 && lowSpread <= 2.0) {
      detections.push({
        patternId: 'RECTANGLE',
        patternName: 'Rectangle Consolidation',
        status: 'IMPLEMENTED',
        detected: true,
        direction: 'NEUTRAL',
        confidence: 85,
        startDate: h1.date,
        endDate: h2.date,
        keyLevels: {
          upperBoundary: Math.max(h1.price, h2.price),
          lowerBoundary: Math.min(l1.price, l2.price)
        },
        notes: `Horizontal consolidation bounded between ${Math.min(l1.price, l2.price).toFixed(1)} and ${Math.max(h1.price, h2.price).toFixed(1)}.`
      });
    }
  }

  // Architectural Declarations for Patterns requiring dynamic curvature / sub-bar regression
  const unImplementedPatterns: Array<{ id: string; name: string; notes: string }> = [
    { id: 'SYMMETRICAL_TRIANGLE', name: 'Symmetrical Triangle', notes: 'Requires convergent slope regression verification.' },
    { id: 'RISING_WEDGE', name: 'Rising Wedge', notes: 'Requires converging ascending channel boundary verification.' },
    { id: 'FALLING_WEDGE', name: 'Falling Wedge', notes: 'Requires converging descending channel boundary verification.' },
    { id: 'FLAG', name: 'Bull/Bear Flag', notes: 'Requires preceding sharp pole momentum verification followed by parallel channel.' },
    { id: 'PENNANT', name: 'Pennant', notes: 'Requires sharp pole followed by micro-triangle consolidation.' },
    { id: 'CUP_AND_HANDLE', name: 'Cup and Handle', notes: 'Requires parabolic curvature fitting and handle retracement bounds.' }
  ];

  unImplementedPatterns.forEach(p => {
    detections.push({
      patternId: p.id,
      patternName: p.name,
      status: 'NOT_IMPLEMENTED',
      detected: false,
      direction: 'NEUTRAL',
      confidence: 0,
      notes: `${p.name} mathematical detection interface defined. Flagged as NOT_IMPLEMENTED to prevent heuristic fabrication.`
    });
  });

  return detections;
}
