import {
  DataImportResult,
  ImportDataType,
  CompanyMaster,
  HistoricalPriceRecord,
  BrokerMaster,
  RawFinancialStatement,
} from '../types/dataInfrastructure';
import { dataValidationService } from './dataValidationService';

export class DataImportService {
  /**
   * Simple RFC-4180 compliant CSV parser that handles quoted cells and commas
   */
  public parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
    const lines = csvText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[\s_-]/g, ''));
    const rows = lines.slice(1).map(parseLine);
    return { headers, rows };
  }

  /**
   * Import Historical Prices CSV
   * Expected headers: symbol, date, open, high, low, close, volume, turnover, transactions, prevclose
   */
  public importPricesCSV(csvContent: string): DataImportResult {
    const { headers, rows } = this.parseCSV(csvContent);
    const result: DataImportResult = {
      importType: 'PRICES',
      recordsProcessed: rows.length,
      importedCount: 0,
      warningCount: 0,
      rejectedCount: 0,
      errors: [],
      summaryMessage: '',
      completedAt: new Date().toISOString(),
    };

    const requiredHeaders = ['symbol', 'date', 'open', 'high', 'low', 'close'];
    const missing = requiredHeaders.filter(req => !headers.includes(req));

    if (missing.length > 0) {
      result.rejectedCount = rows.length;
      result.summaryMessage = `Header validation failed: Missing required columns (${missing.join(', ')})`;
      return result;
    }

    const colIdx = {
      symbol: headers.indexOf('symbol'),
      date: headers.indexOf('date'),
      open: headers.indexOf('open'),
      high: headers.indexOf('high'),
      low: headers.indexOf('low'),
      close: headers.indexOf('close'),
      volume: headers.indexOf('volume'),
      turnover: headers.indexOf('turnover'),
      transactions: headers.indexOf('transactions'),
      prevclose: headers.indexOf('prevclose') !== -1 ? headers.indexOf('prevclose') : headers.indexOf('previousclose'),
    };

    const importedKeys = new Set<string>();

    rows.forEach((row, i) => {
      const rowNum = i + 2; // Accounting for 1-based index and header
      const rawText = row.join(', ');

      const symbol = row[colIdx.symbol]?.toUpperCase() || '';
      const date = row[colIdx.date] || '';
      const open = parseFloat(row[colIdx.open]);
      const high = parseFloat(row[colIdx.high]);
      const low = parseFloat(row[colIdx.low]);
      const close = parseFloat(row[colIdx.close]);
      const volume = colIdx.volume !== -1 ? parseInt(row[colIdx.volume], 10) : 0;
      const turnover = colIdx.turnover !== -1 ? parseFloat(row[colIdx.turnover]) : open * volume;
      const transactions = colIdx.transactions !== -1 ? parseInt(row[colIdx.transactions], 10) : 1;
      const prevClose = colIdx.prevclose !== -1 ? parseFloat(row[colIdx.prevclose]) : open;

      // Type checks
      if (!symbol || !date || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
        result.rejectedCount++;
        result.errors.push({
          rowNumber: rowNum,
          rawRecord: rawText,
          errorMessage: 'Invalid data types: open, high, low, and close must be valid numbers.',
          severity: 'CRITICAL',
        });
        return;
      }

      // Duplicate in same file check
      const recordKey = `${symbol}-${date}`;
      if (importedKeys.has(recordKey)) {
        result.rejectedCount++;
        result.errors.push({
          rowNumber: rowNum,
          rawRecord: rawText,
          errorMessage: `Duplicate price entry found within file for ${recordKey}.`,
          severity: 'CRITICAL',
        });
        return;
      }
      importedKeys.add(recordKey);

      // Validate through validation service
      const change = close - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
      const validationIssues = dataValidationService.validatePriceRecord({
        symbol,
        date,
        open,
        high,
        low,
        close,
        previous_close: prevClose,
        change,
        change_percent: changePercent,
        volume,
        turnover,
        transactions,
      });

      const hasCriticalOrError = validationIssues.some(
        v => v.severity === 'CRITICAL' || v.severity === 'ERROR'
      );
      const warnings = validationIssues.filter(v => v.severity === 'WARNING');

      if (hasCriticalOrError) {
        result.rejectedCount++;
        result.errors.push({
          rowNumber: rowNum,
          rawRecord: rawText,
          errorMessage: validationIssues.map(v => v.message).join('; '),
          severity: 'ERROR',
        });
      } else {
        result.importedCount++;
        if (warnings.length > 0) {
          result.warningCount++;
          result.errors.push({
            rowNumber: rowNum,
            rawRecord: rawText,
            errorMessage: warnings.map(v => v.message).join('; '),
            severity: 'WARNING',
          });
        }
      }
    });

    result.summaryMessage = `Processed ${result.recordsProcessed} records: ${result.importedCount} valid, ${result.warningCount} with warnings, ${result.rejectedCount} rejected.`;
    return result;
  }

  /**
   * Import Companies CSV
   * Expected headers: symbol, companyname, sectorid, securitytype, listeddate, shares, paidupcapital
   */
  public importCompaniesCSV(csvContent: string): DataImportResult {
    const { headers, rows } = this.parseCSV(csvContent);
    const result: DataImportResult = {
      importType: 'COMPANIES',
      recordsProcessed: rows.length,
      importedCount: 0,
      warningCount: 0,
      rejectedCount: 0,
      errors: [],
      summaryMessage: '',
      completedAt: new Date().toISOString(),
    };

    const required = ['symbol', 'companyname'];
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length > 0) {
      result.rejectedCount = rows.length;
      result.summaryMessage = `Header validation failed: Missing required columns (${missing.join(', ')})`;
      return result;
    }

    const colIdx = {
      symbol: headers.indexOf('symbol'),
      name: headers.indexOf('companyname'),
      sector: headers.indexOf('sectorid') !== -1 ? headers.indexOf('sectorid') : headers.indexOf('sector'),
      capital: headers.indexOf('paidupcapital') !== -1 ? headers.indexOf('paidupcapital') : headers.indexOf('capital'),
      shares: headers.indexOf('shares') !== -1 ? headers.indexOf('shares') : headers.indexOf('listedshares'),
    };

    const seenSymbols = new Set<string>();

    rows.forEach((row, i) => {
      const rowNum = i + 2;
      const rawText = row.join(', ');
      const symbol = row[colIdx.symbol]?.toUpperCase();
      const name = row[colIdx.name];

      if (!symbol || !name) {
        result.rejectedCount++;
        result.errors.push({
          rowNumber: rowNum,
          rawRecord: rawText,
          errorMessage: 'Both symbol and company name are required.',
          severity: 'CRITICAL',
        });
        return;
      }

      if (seenSymbols.has(symbol)) {
        result.rejectedCount++;
        result.errors.push({
          rowNumber: rowNum,
          rawRecord: rawText,
          errorMessage: `Duplicate company symbol in CSV: ${symbol}`,
          severity: 'CRITICAL',
        });
        return;
      }
      seenSymbols.add(symbol);

      result.importedCount++;
    });

    result.summaryMessage = `Processed ${result.recordsProcessed} company records: ${result.importedCount} valid, ${result.rejectedCount} rejected.`;
    return result;
  }

  /**
   * Sample CSV Generators for quick user testing
   */
  public getSamplePriceCSV(): string {
    return `symbol,date,open,high,low,close,volume,turnover,transactions,prevclose
CHCL,2026-09-12,542.0,555.0,540.0,551.0,285000,156750000,1650,542.0
NABIL,2026-09-12,598.0,605.0,595.0,602.0,210000,126420000,1210,598.0
SHIVM,2026-09-12,587.0,610.0,585.0,605.0,420000,252000000,2450,587.0
TEST_INVALID,2026-09-12,500.0,480.0,520.0,490.0,1000,490000,10,500.0`;
  }

  public getSampleCompanyCSV(): string {
    return `symbol,companyname,sectorid,securitytype,listeddate,shares,paidupcapital
NMB,NMB Bank Limited,sec-cb,EQ,2008-06-05,183667000,18366700000
PCBL,Prime Commercial Bank Limited,sec-cb,EQ,2009-09-12,194025000,19402500000
AKPL,Arun Kabeli Power Limited,sec-hyd,EQ,2017-11-20,19770000,1977000000`;
  }
}

export const dataImportService = new DataImportService();
