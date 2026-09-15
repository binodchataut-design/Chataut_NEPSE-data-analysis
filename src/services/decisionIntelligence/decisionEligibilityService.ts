/**
 * Decision Eligibility Service (Phase 4B)
 * Evaluates whether a setup qualifies for consideration based on hard blockers,
 * empirical evidence sufficiency, execution realism, and conflict severity.
 * A high technical score can NEVER override a hard blocker.
 */

import { CurrentMarketAndStockSnapshot } from '../../types/currentStateEngine';
import {
  DecisionEligibilityResult,
  DecisionEligibilityStatus,
  HardBlocker,
  EvidenceConflictResult,
  EvidenceAlignmentResult,
  NormalizedEvidenceItem
} from '../../types/decisionIntelligence';
import { EvidenceGrade } from '../../types/researchValidation';

export class DecisionEligibilityService {
  /**
   * Evaluates setup eligibility and enforces all hard blockers
   */
  public static evaluateEligibility(
    snapshot: CurrentMarketAndStockSnapshot,
    conflicts: EvidenceConflictResult,
    alignment: EvidenceAlignmentResult,
    historicalObservationCount: number,
    researchGrade: EvidenceGrade = 'B'
  ): DecisionEligibilityResult {
    const blockers: HardBlocker[] = [];
    const warnings: string[] = [];
    const passedCriteria: string[] = [];
    const detailedReasons: string[] = [];

    // ==========================================
    // 1. HARD BLOCKER: Live Data Unavailable
    // ==========================================
    const isLiveUnavailable = snapshot.stateAvailability && !snapshot.stateAvailability.isAvailable;
    blockers.push({
      id: 'BLK_LIVE_DATA_UNAVAILABLE',
      code: 'LIVE_DATA_UNAVAILABLE',
      name: 'Live Market Data Stream Availability',
      triggered: !!isLiveUnavailable,
      severity: 'BLOCKER',
      details: isLiveUnavailable
        ? `Live data provider disconnected or unauthenticated: ${snapshot.stateAvailability?.reason || 'Awaiting gateway connection'}.`
        : 'Data source is connected and verified.'
    });

    if (isLiveUnavailable) {
      return {
        status: 'UNAVAILABLE',
        blockers,
        hasHardBlocker: true,
        warnings: ['Upstream real-time market data stream is disconnected.'],
        passedCriteria: [],
        primaryReason: 'STATE UNAVAILABLE: Real-time market data stream is disconnected. System refuses to fabricate unverified data.',
        detailedReasons: ['Live data provider unavailable. Switch to MOCK_DATA for offline simulation or authenticate live gateway.']
      };
    }

    // ==========================================
    // 2. HARD BLOCKER: Security Suspended / Delisted
    // ==========================================
    const isSuspended = snapshot.stockState.lifecycle.suspensionStatus === 'SUSPENDED';
    blockers.push({
      id: 'BLK_SECURITY_SUSPENDED',
      code: 'SECURITY_SUSPENDED',
      name: 'Listing & Trading Status Active',
      triggered: isSuspended,
      severity: 'BLOCKER',
      details: isSuspended
        ? `Security ${snapshot.symbol} is currently SUSPENDED from trading on NEPSE.`
        : 'Trading status is active.'
    });

    // ==========================================
    // 3. HARD BLOCKER: Data Quality Corruption
    // ==========================================
    const isDataInvalid = snapshot.stockState.dataQuality.overall === 'INVALID';
    blockers.push({
      id: 'BLK_DATA_QUALITY_INVALID',
      code: 'INVALID_HISTORICAL_DATA',
      name: 'OHLC Price & Corporate Action Integrity',
      triggered: isDataInvalid,
      severity: 'BLOCKER',
      details: isDataInvalid
        ? 'Price series contains fatal OHLC anomalies, zero prices, or unadjusted dilution.'
        : 'Data quality verification passed.'
    });

    // ==========================================
    // 4. HARD BLOCKER: Insufficient Liquidity (ADT20 < 10 Lakh)
    // ==========================================
    const adt20 = snapshot.stockState.liquidity.adt20;
    const isIlliquid = adt20 < 1000000; // < NPR 10 Lakh/day
    blockers.push({
      id: 'BLK_INSUFFICIENT_LIQUIDITY',
      code: 'INSUFFICIENT_LIQUIDITY',
      name: 'Minimum Institutional Liquidity (ADT20 >= 10 Lakh NPR)',
      triggered: isIlliquid,
      severity: 'BLOCKER',
      details: isIlliquid
        ? `20-day Average Daily Turnover is ${(adt20 / 100000).toFixed(1)} Lakh NPR, below minimum execution threshold of 10 Lakh.`
        : `ADT20 is ${(adt20 / 100000).toFixed(1)} Lakh NPR (Participation Capacity: ${snapshot.stockState.liquidity.participationCapacity}).`
    });

    // ==========================================
    // 5. HARD BLOCKER: Research Validity Gate Invalid (Grade F)
    // ==========================================
    const isGateInvalid = researchGrade === 'F';
    blockers.push({
      id: 'BLK_RESEARCH_GATE_INVALID',
      code: 'RESEARCH_VALIDITY_GATE_INVALID',
      name: 'Phase 3D Research Validity Gate Qualification',
      triggered: isGateInvalid,
      severity: 'BLOCKER',
      details: isGateInvalid
        ? 'Research validity gate rejected this setup (Grade F: high snooping or survivorship failure).'
        : `Research validity grade verified at Grade ${researchGrade}.`
    });

    // ==========================================
    // 6. HARD BLOCKER: No Valid Historical Sample (N < 15)
    // ==========================================
    const hasSmallSample = historicalObservationCount < 15;
    blockers.push({
      id: 'BLK_NO_HISTORICAL_SAMPLE',
      code: 'NO_VALID_HISTORICAL_SAMPLE',
      name: 'Minimum Statistical Sample Depth (N >= 15)',
      triggered: hasSmallSample,
      severity: 'BLOCKER',
      details: hasSmallSample
        ? `Only ${historicalObservationCount} historical observations found. Absolute minimum is 15.`
        : `${historicalObservationCount} matching historical comparable observations found.`
    });

    // Check if any hard blocker triggered
    const activeHardBlockers = blockers.filter(b => b.triggered && b.severity === 'BLOCKER');
    const hasHardBlocker = activeHardBlockers.length > 0;

    // Record passed criteria
    blockers.forEach(b => {
      if (!b.triggered) {
        passedCriteria.push(b.name);
      }
    });

    // ==========================================
    // Soft Warnings & Friction Checks
    // ==========================================
    if (conflicts.conflicts.length > 0) {
      conflicts.conflicts.forEach(c => {
        warnings.push(`${c.title}: ${c.explanation}`);
      });
    }

    if (snapshot.marketState.regime === 'BEAR') {
      warnings.push('Broader NEPSE market is in a confirmed BEAR regime; historical breakout win rates are depressed.');
    }

    if (historicalObservationCount < 40 && historicalObservationCount >= 15) {
      warnings.push(`Historical sample size is moderate (${historicalObservationCount} observations). Wider confidence interval applies.`);
    }

    // Determine Final Eligibility Status
    let status: DecisionEligibilityStatus = 'ELIGIBLE';
    let primaryReason = '';

    if (hasHardBlocker) {
      if (hasSmallSample && activeHardBlockers.length === 1) {
        status = 'INSUFFICIENT_EVIDENCE';
        primaryReason = `Insufficient statistical evidence (${historicalObservationCount} historical observations).`;
      } else {
        status = 'BLOCKED';
        primaryReason = `Hard Blocker Enforced: ${activeHardBlockers.map(b => b.name).join(', ')}.`;
      }
      detailedReasons.push(...activeHardBlockers.map(b => b.details));
    } else if (conflicts.hasCriticalConflict || alignment.overallAlignment === 'CONFLICTED') {
      status = 'WATCH';
      primaryReason = 'Critical evidence conflict detected; setup placed on active WATCH until divergence resolves.';
      detailedReasons.push(...warnings);
    } else if (warnings.length > 0) {
      status = 'ELIGIBLE_WITH_WARNING';
      primaryReason = `Eligible setup with ${warnings.length} advisory warning(s).`;
      detailedReasons.push(...warnings);
    } else {
      status = 'ELIGIBLE';
      primaryReason = 'Setup meets all evidence alignment, liquidity, and statistical robustness criteria.';
      detailedReasons.push('All technical, sector, and risk-reward criteria passed with strong multi-factor agreement.');
    }

    return {
      status,
      blockers,
      hasHardBlocker,
      warnings,
      passedCriteria,
      primaryReason,
      detailedReasons
    };
  }
}
