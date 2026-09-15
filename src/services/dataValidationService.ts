import {
  CompanyMaster,
  HistoricalPriceRecord,
  BrokerMaster,
  RawFinancialStatement,
  ValidationIssue,
  ValidationSummary,
} from '../types/dataInfrastructure';
import {
  normalizedCompanies,
  normalizedPrices,
  normalizedBrokers,
  normalizedRawFinancials,
} from '../data/normalizedMasterData';

export class DataValidationService {
  /**
   * Validate a single Historical Price record against mathematical and exchange constraints
   */
  public validatePriceRecord(record: Partial<HistoricalPriceRecord>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const timestamp = new Date().toISOString();
    const idStr = `${record.symbol || 'UNKNOWN'} [${record.date || 'NO-DATE'}]`;

    // 1. Missing Date
    if (!record.date || record.date.trim() === '') {
      issues.push({
        code: 'MISSING_DATE',
        severity: 'CRITICAL',
        entity: 'PRICE',
        recordIdentifier: idStr,
        field: 'date',
        message: 'Trading date is missing or empty.',
        timestamp,
      });
    }

    // 2. Missing Symbol
    if (!record.symbol || record.symbol.trim() === '') {
      issues.push({
        code: 'MISSING_SYMBOL',
        severity: 'CRITICAL',
        entity: 'PRICE',
        recordIdentifier: idStr,
        field: 'symbol',
        message: 'Company ticker symbol is missing.',
        timestamp,
      });
    }

    const { open, high, low, close, volume, turnover, previous_close, change_percent } = record;

    // 3. Missing OHLC values
    if (open === undefined || high === undefined || low === undefined || close === undefined) {
      issues.push({
        code: 'MISSING_OHLC',
        severity: 'CRITICAL',
        entity: 'PRICE',
        recordIdentifier: idStr,
        message: 'One or more OHLC values are missing or undefined.',
        timestamp,
      });
      return issues;
    }

    // 4. Negative or Zero Prices
    if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
      issues.push({
        code: 'NON_POSITIVE_PRICE',
        severity: 'CRITICAL',
        entity: 'PRICE',
        recordIdentifier: idStr,
        message: `Prices must be strictly positive. Found O:${open}, H:${high}, L:${low}, C:${close}`,
        timestamp,
      });
    }

    // 5. Invalid OHLC Relationships
    if (high < low) {
      issues.push({
        code: 'OHLC_HIGH_LESS_THAN_LOW',
        severity: 'CRITICAL',
        entity: 'PRICE',
        recordIdentifier: idStr,
        message: `High price (${high}) cannot be lower than Low price (${low}).`,
        expectedCondition: 'high >= low',
        timestamp,
      });
    }

    if (high < open) {
      issues.push({
        code: 'OHLC_HIGH_LESS_THAN_OPEN',
        severity: 'ERROR',
        entity: 'PRICE',
        recordIdentifier: idStr,
        message: `High price (${high}) cannot be lower than Open price (${open}).`,
        expectedCondition: 'high >= open',
        timestamp,
      });
    }

    if (high < close) {
      issues.push({
        code: 'OHLC_HIGH_LESS_THAN_CLOSE',
        severity: 'ERROR',
        entity: 'PRICE',
        recordIdentifier: idStr,
        message: `High price (${high}) cannot be lower than Close price (${close}).`,
        expectedCondition: 'high >= close',
        timestamp,
      });
    }

    if (low > open) {
      issues.push({
        code: 'OHLC_LOW_GREATER_THAN_OPEN',
        severity: 'ERROR',
        entity: 'PRICE',
        recordIdentifier: idStr,
        message: `Low price (${low}) cannot be greater than Open price (${open}).`,
        expectedCondition: 'low <= open',
        timestamp,
      });
    }

    if (low > close) {
      issues.push({
        code: 'OHLC_LOW_GREATER_THAN_CLOSE',
        severity: 'ERROR',
        entity: 'PRICE',
        recordIdentifier: idStr,
        message: `Low price (${low}) cannot be greater than Close price (${close}).`,
        expectedCondition: 'low <= close',
        timestamp,
      });
    }

    // 6. Volume checks
    if (volume === undefined || volume < 0) {
      issues.push({
        code: 'INVALID_VOLUME',
        severity: 'WARNING',
        entity: 'PRICE',
        recordIdentifier: idStr,
        field: 'volume',
        message: `Volume is negative or missing: ${volume}`,
        timestamp,
      });
    }

    // 7. Abnormally large price changes (> 10% daily NEPSE circuit breaker)
    if (change_percent !== undefined && Math.abs(change_percent) > 10.05) {
      issues.push({
        code: 'CIRCUIT_BREAKER_EXCEEDED',
        severity: Math.abs(change_percent) > 20 ? 'CRITICAL' : 'WARNING',
        entity: 'PRICE',
        recordIdentifier: idStr,
        field: 'change_percent',
        message: `Price change of ${change_percent.toFixed(2)}% exceeds normal NEPSE 10% daily circuit limit. Check for unadjusted corporate actions.`,
        actualValue: change_percent,
        expectedCondition: 'abs(change_percent) <= 10.0%',
        timestamp,
      });
    }

    return issues;
  }

  /**
   * Validate entire system repository data
   */
  public async validateEntireDatabase(): Promise<ValidationSummary> {
    const allIssues: ValidationIssue[] = [];
    const timestamp = new Date().toISOString();

    let totalChecked = 0;

    // 1. Validate Company Master
    const symbolsSeen = new Set<string>();
    totalChecked += normalizedCompanies.length;
    for (const c of normalizedCompanies) {
      const idStr = `Company ${c.symbol}`;
      if (!c.symbol || c.symbol.trim() === '') {
        allIssues.push({
          code: 'EMPTY_COMPANY_SYMBOL',
          severity: 'CRITICAL',
          entity: 'COMPANY',
          recordIdentifier: c.id,
          message: 'Company missing ticker symbol.',
          timestamp,
        });
      }
      if (symbolsSeen.has(c.symbol.toUpperCase())) {
        allIssues.push({
          code: 'DUPLICATE_COMPANY_SYMBOL',
          severity: 'CRITICAL',
          entity: 'COMPANY',
          recordIdentifier: idStr,
          message: `Duplicate company symbol detected: ${c.symbol}`,
          timestamp,
        });
      }
      symbolsSeen.add(c.symbol.toUpperCase());

      if (c.paid_up_capital <= 0) {
        allIssues.push({
          code: 'INVALID_CAPITAL',
          severity: 'ERROR',
          entity: 'COMPANY',
          recordIdentifier: idStr,
          message: `Paid up capital must be greater than zero. Found ${c.paid_up_capital}`,
          timestamp,
        });
      }
    }

    // 2. Validate Price History & Duplicate (symbol + date)
    const priceDateKeys = new Set<string>();
    totalChecked += normalizedPrices.length;
    for (const p of normalizedPrices) {
      const key = `${p.symbol.toUpperCase()}-${p.date}`;
      if (priceDateKeys.has(key)) {
        allIssues.push({
          code: 'DUPLICATE_PRICE_DATE',
          severity: 'CRITICAL',
          entity: 'PRICE',
          recordIdentifier: `${p.symbol} on ${p.date}`,
          message: `Duplicate price entry for same company and date: ${key}`,
          timestamp,
        });
      }
      priceDateKeys.add(key);

      const recordIssues = this.validatePriceRecord(p);
      allIssues.push(...recordIssues);
    }

    // 3. Validate Brokers
    const brokerNumsSeen = new Set<number>();
    totalChecked += normalizedBrokers.length;
    for (const b of normalizedBrokers) {
      const idStr = `Broker #${b.broker_number}`;
      if (b.broker_number <= 0 || b.broker_number > 100) {
        allIssues.push({
          code: 'INVALID_BROKER_NUMBER',
          severity: 'ERROR',
          entity: 'BROKER',
          recordIdentifier: idStr,
          message: `Broker number must be between 1 and 99. Found ${b.broker_number}`,
          timestamp,
        });
      }
      if (brokerNumsSeen.has(b.broker_number)) {
        allIssues.push({
          code: 'DUPLICATE_BROKER_NUMBER',
          severity: 'CRITICAL',
          entity: 'BROKER',
          recordIdentifier: idStr,
          message: `Duplicate broker number detected: #${b.broker_number}`,
          timestamp,
        });
      }
      brokerNumsSeen.add(b.broker_number);
    }

    // 4. Validate Financials
    totalChecked += normalizedRawFinancials.length;
    for (const f of normalizedRawFinancials) {
      const idStr = `${f.symbol} (${f.fiscal_year} ${f.quarter})`;
      if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(f.quarter)) {
        allIssues.push({
          code: 'INVALID_QUARTER',
          severity: 'ERROR',
          entity: 'FINANCIAL',
          recordIdentifier: idStr,
          message: `Invalid quarter: ${f.quarter}`,
          timestamp,
        });
      }
      if (f.total_shares <= 0) {
        allIssues.push({
          code: 'INVALID_SHARES_COUNT',
          severity: 'ERROR',
          entity: 'FINANCIAL',
          recordIdentifier: idStr,
          message: `Total shares count must be positive. Found ${f.total_shares}`,
          timestamp,
        });
      }
    }

    const criticalCount = allIssues.filter(i => i.severity === 'CRITICAL').length;
    const errorCount = allIssues.filter(i => i.severity === 'ERROR').length;
    const warningCount = allIssues.filter(i => i.severity === 'WARNING').length;
    const infoCount = allIssues.filter(i => i.severity === 'INFO').length;

    return {
      status: criticalCount > 0 || errorCount > 0 ? 'INVALID' : 'VALID',
      totalRecordsChecked: totalChecked,
      validRecordsCount: totalChecked - (criticalCount + errorCount),
      totalIssuesCount: allIssues.length,
      criticalCount,
      errorCount,
      warningCount,
      infoCount,
      issues: allIssues,
      executedAt: timestamp,
    };
  }
}

export const dataValidationService = new DataValidationService();
