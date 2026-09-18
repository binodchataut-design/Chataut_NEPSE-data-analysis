import { DataImportResult } from '../types/dataInfrastructure';

export const dataImportService = {
  getSamplePriceCSV(): string {
    return `symbol,trade_date,open,high,low,close,volume,turnover
CHCL,2026-09-11,540.0,554.0,538.0,548.0,385000,209210000
SHIVM,2026-09-11,610.0,624.0,605.0,615.0,240000,147600000
NICA,2026-09-11,468.0,478.0,464.0,472.0,195000,92040000
GBIME,2026-09-11,215.0,222.0,214.0,218.0,320000,69760000`;
  },

  getSampleCompanyCSV(): string {
    return `symbol,company_name,sector,listed_shares,paid_up_capital
CHCL,Chilime Hydropower Company Limited,Hydropower,79800000,7980000000
SHIVM,Shivam Cements Limited,Manufacturing,52800000,5280000000
NICA,NIC Asia Bank Limited,Commercial Banks,149175660,14917566000
GBIME,Global IME Bank Limited,Commercial Banks,361287000,36128700000`;
  },

  importPricesCSV(csvText: string): DataImportResult {
    const lines = csvText.trim().split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 1) {
      return {
        success: false,
        message: 'No data rows found in CSV.',
        completedAt: new Date().toLocaleTimeString(),
        recordsProcessed: 0,
        importedCount: 0,
        warningCount: 0,
        rejectedCount: 0,
      };
    }

    const dataLines = lines.slice(1);
    let importedCount = 0;
    let rejectedCount = 0;
    let warningCount = 0;
    const errors: string[] = [];

    dataLines.forEach((line, idx) => {
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 6) {
        rejectedCount++;
        errors.push(`Row ${idx + 2}: Insufficient columns.`);
        return;
      }
      const [symbol, , open, high, low, close] = parts;
      const o = Number(open);
      const h = Number(high);
      const l = Number(low);
      const c = Number(close);

      if (isNaN(o) || isNaN(h) || isNaN(l) || isNaN(c)) {
        rejectedCount++;
        errors.push(`Row ${idx + 2} (${symbol}): Invalid numeric values.`);
        return;
      }

      if (h < l || o > h || o < l || c > h || c < l) {
        warningCount++;
      }
      importedCount++;
    });

    return {
      success: rejectedCount === 0,
      message: `Ingestion processed ${dataLines.length} records.`,
      completedAt: new Date().toLocaleTimeString(),
      recordsProcessed: dataLines.length,
      importedCount,
      warningCount,
      rejectedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  importCompaniesCSV(csvText: string): DataImportResult {
    const lines = csvText.trim().split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 1) {
      return {
        success: false,
        message: 'No data rows found in CSV.',
        completedAt: new Date().toLocaleTimeString(),
        recordsProcessed: 0,
        importedCount: 0,
        warningCount: 0,
        rejectedCount: 0,
      };
    }

    const dataLines = lines.slice(1);
    let importedCount = 0;
    let rejectedCount = 0;

    dataLines.forEach(line => {
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 3 || !parts[0]) {
        rejectedCount++;
      } else {
        importedCount++;
      }
    });

    return {
      success: rejectedCount === 0,
      message: `Successfully ingested ${importedCount} company master records.`,
      completedAt: new Date().toLocaleTimeString(),
      recordsProcessed: dataLines.length,
      importedCount,
      warningCount: 0,
      rejectedCount,
    };
  }
};

