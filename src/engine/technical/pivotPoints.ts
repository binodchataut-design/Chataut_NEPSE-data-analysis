/**
 * Pivot Points Calculation Suite
 * Implements: Standard, Fibonacci, Camarilla, Woodie, DeMark
 * Calculation Version: v1.0
 */

import { OHLCVBar, PivotPointsResult, PivotSystemType } from '../../types/technicalIndicators';

export const PIVOT_POINTS_VERSION = 'v1.0';

export function calculatePivotPoints(
  bar: OHLCVBar,
  system: PivotSystemType = 'STANDARD'
): PivotPointsResult {
  const { high: H, low: L, close: C, open: O } = bar;
  const range = H - L;

  switch (system) {
    case 'STANDARD': {
      const p = (H + L + C) / 3;
      return {
        system: 'STANDARD',
        p: Math.round(p * 100) / 100,
        r1: Math.round((2 * p - L) * 100) / 100,
        r2: Math.round((p + range) * 100) / 100,
        r3: Math.round((H + 2 * (p - L)) * 100) / 100,
        s1: Math.round((2 * p - H) * 100) / 100,
        s2: Math.round((p - range) * 100) / 100,
        s3: Math.round((L - 2 * (H - p)) * 100) / 100
      };
    }

    case 'FIBONACCI': {
      const p = (H + L + C) / 3;
      return {
        system: 'FIBONACCI',
        p: Math.round(p * 100) / 100,
        r1: Math.round((p + 0.382 * range) * 100) / 100,
        r2: Math.round((p + 0.618 * range) * 100) / 100,
        r3: Math.round((p + 1.0 * range) * 100) / 100,
        s1: Math.round((p - 0.382 * range) * 100) / 100,
        s2: Math.round((p - 0.618 * range) * 100) / 100,
        s3: Math.round((p - 1.0 * range) * 100) / 100
      };
    }

    case 'CAMARILLA': {
      const p = (H + L + C) / 3;
      const factor = 1.1;
      return {
        system: 'CAMARILLA',
        p: Math.round(p * 100) / 100,
        r1: Math.round((C + (range * factor) / 12) * 100) / 100,
        r2: Math.round((C + (range * factor) / 6) * 100) / 100,
        r3: Math.round((C + (range * factor) / 4) * 100) / 100,
        r4: Math.round((C + (range * factor) / 2) * 100) / 100,
        s1: Math.round((C - (range * factor) / 12) * 100) / 100,
        s2: Math.round((C - (range * factor) / 6) * 100) / 100,
        s3: Math.round((C - (range * factor) / 4) * 100) / 100,
        s4: Math.round((C - (range * factor) / 2) * 100) / 100
      };
    }

    case 'WOODIE': {
      const p = (H + L + 2 * C) / 4;
      return {
        system: 'WOODIE',
        p: Math.round(p * 100) / 100,
        r1: Math.round((2 * p - L) * 100) / 100,
        r2: Math.round((p + range) * 100) / 100,
        r3: Math.round((H + 2 * (p - L)) * 100) / 100,
        s1: Math.round((2 * p - H) * 100) / 100,
        s2: Math.round((p - range) * 100) / 100,
        s3: Math.round((L - 2 * (H - p)) * 100) / 100
      };
    }

    case 'DEMARK': {
      let x = 0;
      if (C < O) {
        x = H + 2 * L + C;
      } else if (C > O) {
        x = 2 * H + L + C;
      } else {
        x = H + L + 2 * C;
      }
      const p = x / 4;
      return {
        system: 'DEMARK',
        p: Math.round(p * 100) / 100,
        r1: Math.round((x / 2 - L) * 100) / 100,
        s1: Math.round((x / 2 - H) * 100) / 100
      };
    }
  }
}
