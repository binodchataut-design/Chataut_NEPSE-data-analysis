import { ValidationSummary, ValidationIssue } from '../types/dataInfrastructure';
import { normalizedCompanies, getNormalizedStockBars } from '../data/normalizedMasterData';

export const dataValidationService = {
  async validateEntireDatabase(): Promise<ValidationSummary> {
    const issues: ValidationIssue[] = [];
    let totalRecordsChecked = normalizedCompanies.length;
    let validRecordsCount = normalizedCompanies.length;
    let criticalCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    // Validate historical price series for all listed normalized companies
    normalizedCompanies.forEach(comp => {
      const bars = getNormalizedStockBars(comp.symbol);
      totalRecordsChecked += bars.length;
      bars.forEach((bar, idx) => {
        let barValid = true;
        // Check High >= Low
        if (bar.high < bar.low) {
          issues.push({
            severity: 'CRITICAL',
            entity: 'Price History',
            recordIdentifier: `${comp.symbol}:${bar.date}`,
            code: 'HIGH_LESS_THAN_LOW',
            message: `High price (${bar.high}) is lower than low price (${bar.low}).`,
          });
          criticalCount++;
          barValid = false;
        }

        // Check Open/Close within High/Low
        if (bar.open > bar.high || bar.open < bar.low || bar.close > bar.high || bar.close < bar.low) {
          issues.push({
            severity: 'ERROR',
            entity: 'Price History',
            recordIdentifier: `${comp.symbol}:${bar.date}`,
            code: 'OHLC_BOUNDS_VIOLATION',
            message: `Open (${bar.open}) or Close (${bar.close}) falls outside [Low, High] bounds.`,
          });
          errorCount++;
          barValid = false;
        }

        // Check Circuit breaker (±10% move from previous day)
        if (idx > 0) {
          const prevClose = bars[idx - 1].close;
          const pctChange = Math.abs((bar.close - prevClose) / prevClose) * 100;
          if (pctChange > 10.05) {
            issues.push({
              severity: 'WARNING',
              entity: 'Price History',
              recordIdentifier: `${comp.symbol}:${bar.date}`,
              code: 'CIRCUIT_LIMIT_EXCEEDED',
              message: `Single-day price change ${pctChange.toFixed(2)}% exceeds normal 10% daily circuit band.`,
            });
            warningCount++;
          }
        }

        if (barValid) {
          validRecordsCount++;
        }
      });
    });

    const status: 'VALID' | 'WARNINGS' | 'INVALID' = criticalCount > 0 ? 'INVALID' : warningCount > 0 ? 'WARNINGS' : 'VALID';

    return {
      status,
      totalChecks: totalRecordsChecked,
      totalRecordsChecked,
      validRecordsCount,
      criticalCount,
      errorCount,
      warningCount,
      issues,
    };
  }
};

