import { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  FileText,
  Upload,
  RefreshCw,
  Copy,
  Check,
  Terminal,
  Server,
  Layers,
  FileCode2,
  Table,
  Filter,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { providerRegistry } from '../../providers/providerRegistry';
import { dataValidationService } from '../../services/dataValidationService';
import { dataImportService } from '../../services/dataImportService';
import { ValidationSummary, ValidationIssue, DataImportResult } from '../../types/dataInfrastructure';

export function DataArchitectureView() {
  const [activeTab, setActiveTab] = useState<'VALIDATION' | 'IMPORT' | 'SCHEMA' | 'PROVIDERS'>('VALIDATION');
  const [dataMode, setDataMode] = useState(dataService.getMode());

  // Validation State
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO'>('ALL');

  // Import State
  const [importType, setImportType] = useState<'PRICES' | 'COMPANIES'>('PRICES');
  const [csvInput, setCsvInput] = useState('');
  const [importResult, setImportResult] = useState<DataImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Schema state
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    // Run initial validation check
    runValidation();
    // Default sample CSV
    setCsvInput(dataImportService.getSamplePriceCSV());

    const unsubscribe = dataService.subscribe(() => {
      setDataMode(dataService.getMode());
    });
    return () => unsubscribe();
  }, []);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const summary = await dataValidationService.validateEntireDatabase();
      setValidationSummary(summary);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = () => {
    if (!csvInput.trim()) return;
    setIsImporting(true);
    setTimeout(() => {
      let res: DataImportResult;
      if (importType === 'PRICES') {
        res = dataImportService.importPricesCSV(csvInput);
      } else {
        res = dataImportService.importCompaniesCSV(csvInput);
      }
      setImportResult(res);
      setIsImporting(false);
    }, 200);
  };

  const loadSample = (type: 'PRICES' | 'COMPANIES') => {
    setImportType(type);
    setImportResult(null);
    if (type === 'PRICES') {
      setCsvInput(dataImportService.getSamplePriceCSV());
    } else {
      setCsvInput(dataImportService.getSampleCompanyCSV());
    }
  };

  const handleCopySql = () => {
    const sqlText = `-- PostgreSQL / Supabase Schema for NEPSE
CREATE TABLE companies (
    id VARCHAR(64) PRIMARY KEY,
    symbol VARCHAR(16) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    sector_id VARCHAR(32) NOT NULL REFERENCES sectors(id),
    security_type VARCHAR(16) NOT NULL DEFAULT 'EQ',
    listed_shares BIGINT NOT NULL DEFAULT 0,
    paid_up_capital NUMERIC(18, 2) NOT NULL DEFAULT 0,
    face_value NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE price_history (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    symbol VARCHAR(16) NOT NULL,
    trade_date DATE NOT NULL,
    open NUMERIC(12, 2) NOT NULL,
    high NUMERIC(12, 2) NOT NULL,
    low NUMERIC(12, 2) NOT NULL,
    close NUMERIC(12, 2) NOT NULL,
    volume BIGINT NOT NULL,
    turnover NUMERIC(18, 2) NOT NULL,
    CONSTRAINT check_high_low CHECK (high >= low),
    CONSTRAINT uq_company_date UNIQUE (company_id, trade_date)
);

CREATE TABLE brokers (
    id VARCHAR(64) PRIMARY KEY,
    broker_number INTEGER NOT NULL UNIQUE,
    broker_name VARCHAR(255) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE broker_transactions (
    id BIGSERIAL PRIMARY KEY,
    trade_date DATE NOT NULL,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id),
    symbol VARCHAR(16) NOT NULL,
    broker_number INTEGER NOT NULL,
    buy_quantity BIGINT NOT NULL DEFAULT 0,
    buy_value NUMERIC(18, 2) NOT NULL DEFAULT 0,
    sell_quantity BIGINT NOT NULL DEFAULT 0,
    sell_value NUMERIC(18, 2) NOT NULL DEFAULT 0,
    net_quantity BIGINT NOT NULL,
    net_value NUMERIC(18, 2) NOT NULL
);`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const filteredIssues = validationSummary
    ? validationSummary.issues.filter(issue => {
        if (severityFilter === 'ALL') return true;
        return issue.severity === severityFilter;
      })
    : [];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>PHASE 2 — NEPSE DATA INFRASTRUCTURE</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Normalized relational database architecture, validation engine, CSV ingestion pipeline, and decoupled provider abstractions.
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded bg-[#111722] border border-slate-700 text-[11px] flex items-center gap-2">
            <span className="text-slate-400">ACTIVE MODE:</span>
            <span className={dataMode === 'MOCK_DATA' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
              {dataMode === 'MOCK_DATA' ? 'MOCK DATA (DETERMINISTIC)' : 'REAL DATA (ADAPTER)'}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded bg-[#111722] border border-slate-700 text-[11px] flex items-center gap-2 text-cyan-400">
            <Server className="w-3.5 h-3.5" />
            <span>POSTGRES READY</span>
          </div>
        </div>
      </div>

      {/* Architectural Pipeline Flow */}
      <div className="bg-[#111722] border border-slate-800 rounded-lg p-5">
        <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>STRICT SYSTEM ARCHITECTURAL PIPELINE</span>
          <span className="text-[10px] text-cyan-400 lowercase">no direct ui-to-source coupling</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-[10px]">
          {[
            { step: '1. DATA SOURCES', desc: 'Mock / Future Live Gateways' },
            { step: '2. DATA INGESTION', desc: 'CSV Parsers & Feed Ingest' },
            { step: '3. DATA VALIDATION', desc: 'OHLC, Duplicates & Circuits' },
            { step: '4. NORMALIZED DB', desc: 'Relational PostgreSQL Schemas' },
            { step: '5. REPOSITORIES', desc: 'Decoupled Storage Access' },
            { step: '6. ANALYTIC ENGINES', desc: 'Technical, Fund & Broker Math' },
            { step: '7. USER INTERFACE', desc: 'Terminal Presentation Layer' },
          ].map((s, i) => (
            <div key={i} className="p-3 bg-[#0b0f17] border border-slate-800 rounded hover:border-cyan-800 transition-colors">
              <div className="font-bold text-cyan-400">{s.step}</div>
              <div className="text-slate-400 mt-1">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          id="btn-tab-validation"
          onClick={() => setActiveTab('VALIDATION')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'VALIDATION'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>DATA VALIDATION ENGINE</span>
          {validationSummary && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              validationSummary.status === 'VALID' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
            }`}>
              {validationSummary.status}
            </span>
          )}
        </button>

        <button
          id="btn-tab-import"
          onClick={() => setActiveTab('IMPORT')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'IMPORT'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>CSV DATA INGESTION</span>
        </button>

        <button
          id="btn-tab-schema"
          onClick={() => setActiveTab('SCHEMA')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'SCHEMA'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>RELATIONAL DATABASE SCHEMA</span>
        </button>

        <button
          id="btn-tab-providers"
          onClick={() => setActiveTab('PROVIDERS')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'PROVIDERS'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>PROVIDER ABSTRACTION LAYER</span>
        </button>
      </div>

      {/* TAB 1: DATA VALIDATION ENGINE */}
      {activeTab === 'VALIDATION' && (
        <div className="space-y-4">
          {/* Controls & Summary */}
          <div className="bg-[#111722] border border-slate-800 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Database Integrity &amp; Market Constraint Diagnostics</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Validates OHLC bounds, duplicates, circuit band bounds (&plusmn;10%), negative volume, and master integrity.
                </p>
              </div>

              <button
                id="btn-run-validation"
                onClick={runValidation}
                disabled={isValidating}
                className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                <span>{isValidating ? 'ANALYZING...' : 'RUN FULL DATABASE AUDIT'}</span>
              </button>
            </div>

            {/* Metrics cards */}
            {validationSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                <div className="p-3 bg-[#0c1018] rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Records Scanned</div>
                  <div className="text-base font-bold text-slate-200 mt-1">{validationSummary.totalRecordsChecked}</div>
                </div>

                <div className="p-3 bg-[#0c1018] rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Valid Records</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">{validationSummary.validRecordsCount}</div>
                </div>

                <div className="p-3 bg-[#0c1018] rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Critical Errors</div>
                  <div className={`text-base font-bold mt-1 ${validationSummary.criticalCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {validationSummary.criticalCount}
                  </div>
                </div>

                <div className="p-3 bg-[#0c1018] rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Standard Errors</div>
                  <div className={`text-base font-bold mt-1 ${validationSummary.errorCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {validationSummary.errorCount}
                  </div>
                </div>

                <div className="p-3 bg-[#0c1018] rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Warnings Flagged</div>
                  <div className={`text-base font-bold mt-1 ${validationSummary.warningCount > 0 ? 'text-yellow-400' : 'text-slate-400'}`}>
                    {validationSummary.warningCount}
                  </div>
                </div>

                <div className="p-3 bg-[#0c1018] rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Database Status</div>
                  <div className={`text-base font-bold mt-1 ${validationSummary.status === 'VALID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {validationSummary.status}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Issue Logs Table */}
          <div className="bg-[#111722] border border-slate-800 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Diagnostic Issue &amp; Discrepancy Log
                </h3>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['ALL', 'CRITICAL', 'ERROR', 'WARNING', 'INFO'] as const).map(sev => (
                  <button
                    key={sev}
                    id={`btn-filter-${sev.toLowerCase()}`}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                      severityFilter === sev
                        ? 'bg-cyan-600 text-white'
                        : 'bg-[#0c1018] border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="p-8 text-center bg-[#0c1018] rounded border border-slate-800/80 text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-bold text-slate-200">No Validation Issues Found</div>
                <p className="text-[11px] max-w-md mx-auto">
                  All seed records comply strictly with mathematical OHLC inequalities, exchange circuit constraints, and foreign key relations.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded border border-slate-800">
                <table className="w-full text-left">
                  <thead className="bg-[#0b0f17] text-[10px] text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Severity</th>
                      <th className="p-2.5">Entity</th>
                      <th className="p-2.5">Record Target</th>
                      <th className="p-2.5">Violation Rule</th>
                      <th className="p-2.5">Detail &amp; Diagnostic Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {filteredIssues.map((issue, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20">
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            issue.severity === 'CRITICAL'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                              : issue.severity === 'ERROR'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                              : issue.severity === 'WARNING'
                              ? 'bg-yellow-950 text-yellow-400 border border-yellow-800/60'
                              : 'bg-blue-950 text-blue-400 border border-blue-800/60'
                          }`}>
                            {issue.severity}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-300 font-bold">{issue.entity}</td>
                        <td className="p-2.5 text-cyan-400">{issue.recordIdentifier}</td>
                        <td className="p-2.5 font-bold text-slate-200">{issue.code}</td>
                        <td className="p-2.5 text-slate-300">{issue.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CSV DATA INGESTION */}
      {activeTab === 'IMPORT' && (
        <div className="space-y-4">
          <div className="bg-[#111722] border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>CSV Ingestion Engine (Companies &amp; Historical Prices)</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Validates incoming schemas, checks data types, rejects malformed lines, and reports summaries.
                </p>
              </div>

              {/* Sample loader buttons */}
              <div className="flex items-center gap-2">
                <button
                  id="btn-sample-price"
                  onClick={() => loadSample('PRICES')}
                  className={`px-3 py-1.5 rounded text-[11px] font-bold border transition-colors ${
                    importType === 'PRICES'
                      ? 'bg-cyan-900/40 border-cyan-500 text-cyan-300'
                      : 'bg-[#0c1018] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Load Sample Price CSV
                </button>
                <button
                  id="btn-sample-company"
                  onClick={() => loadSample('COMPANIES')}
                  className={`px-3 py-1.5 rounded text-[11px] font-bold border transition-colors ${
                    importType === 'COMPANIES'
                      ? 'bg-cyan-900/40 border-cyan-500 text-cyan-300'
                      : 'bg-[#0c1018] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Load Sample Company CSV
                </button>
              </div>
            </div>

            {/* CSV Editor Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-bold">
                  CSV Content Input (RFC-4180 format)
                </label>
                <span className="text-[10px] text-slate-500">
                  {importType === 'PRICES' ? 'Expected: symbol, date, open, high, low, close, volume...' : 'Expected: symbol, companyname, sectorid...'}
                </span>
              </div>
              <textarea
                id="textarea-csv-import"
                value={csvInput}
                onChange={e => setCsvInput(e.target.value)}
                rows={8}
                className="w-full bg-[#070a10] border border-slate-800 rounded p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="Paste CSV records here..."
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Data will be validated through <span className="text-cyan-400">dataValidationService</span> prior to commit.
              </span>
              <button
                id="btn-process-import"
                onClick={handleImport}
                disabled={isImporting || !csvInput.trim()}
                className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isImporting ? 'VALIDATING & INGESTING...' : 'VALIDATE & INGEST CSV'}</span>
              </button>
            </div>
          </div>

          {/* Import Execution Result */}
          {importResult && (
            <div className="bg-[#111722] border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                    Ingestion Execution Summary
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">{importResult.completedAt}</span>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-[#0c1018] rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Processed</div>
                  <div className="text-base font-bold text-slate-200 mt-1">{importResult.recordsProcessed}</div>
                </div>
                <div className="p-3 bg-[#0c1018] rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Imported Clean</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">{importResult.importedCount}</div>
                </div>
                <div className="p-3 bg-[#0c1018] rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Warnings</div>
                  <div className="text-base font-bold text-yellow-400 mt-1">{importResult.warningCount}</div>
                </div>
                <div className="p-3 bg-[#0c1018] rounded border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Rejected</div>
                  <div className={`text-base font-bold mt-1 ${importResult.rejectedCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {importResult.rejectedCount}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#0c1018] rounded border border-slate-800 text-[11px] text-slate-300">
                <span className="font-bold text-cyan-400">Engine Report:</span> {importResult.summaryMessage}
              </div>

              {/* Ingestion Error Log */}
              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400 font-bold uppercase">
                    Row-Level Discrepancies ({importResult.errors.length}):
                  </div>
                  <div className="overflow-x-auto rounded border border-slate-800">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#0b0f17] text-[10px] text-slate-400 uppercase border-b border-slate-800">
                        <tr>
                          <th className="p-2">Row #</th>
                          <th className="p-2">Severity</th>
                          <th className="p-2">Error / Validation Failure</th>
                          <th className="p-2">Raw Data Line</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {importResult.errors.map((err, i) => (
                          <tr key={i} className="hover:bg-slate-800/20">
                            <td className="p-2 text-cyan-400 font-bold">Row {err.rowNumber}</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                err.severity === 'CRITICAL' || err.severity === 'ERROR'
                                  ? 'bg-rose-950 text-rose-400'
                                  : 'bg-yellow-950 text-yellow-400'
                              }`}>
                                {err.severity}
                              </span>
                            </td>
                            <td className="p-2 text-slate-200">{err.errorMessage}</td>
                            <td className="p-2 font-mono text-[10px] text-slate-400 truncate max-w-xs">
                              {err.rawRecord}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RELATIONAL DATABASE SCHEMA */}
      {activeTab === 'SCHEMA' && (
        <div className="space-y-4">
          <div className="bg-[#111722] border border-slate-800 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-cyan-400" />
                  <span>PostgreSQL &amp; Supabase Relational Schema Specification</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Normalized database tables avoiding duplication, enforcing constraints (high &gt;= low, positive rates), and foreign keys.
                </p>
              </div>

              <button
                id="btn-copy-sql"
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded bg-[#0c1018] border border-slate-700 hover:border-cyan-500 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedSql ? 'COPIED TO CLIPBOARD' : 'COPY DDL SQL'}</span>
              </button>
            </div>

            {/* Table Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  table: 'companies',
                  pk: 'id (VARCHAR)',
                  fk: 'sector_id -> sectors(id)',
                  cols: 'symbol, company_name, security_type, listed_date, listed_shares, paid_up_capital, face_value, status',
                  desc: 'Core listing master with unique ticker constraint and capital records.',
                },
                {
                  table: 'price_history',
                  pk: 'id (BIGSERIAL)',
                  fk: 'company_id -> companies(id)',
                  cols: 'symbol, trade_date, open, high, low, close, previous_close, change, change_percent, volume, turnover',
                  desc: 'Normalized OHLCV daily bars. Enforces high >= low and unique (company_id, trade_date).',
                },
                {
                  table: 'sectors',
                  pk: 'id (VARCHAR)',
                  fk: 'None (Root)',
                  cols: 'name, index_symbol, status, description, created_at',
                  desc: 'NEPSE sector classifications (Commercial Banks, Hydropower, etc.).',
                },
                {
                  table: 'brokers',
                  pk: 'id (VARCHAR)',
                  fk: 'None (Root)',
                  cols: 'broker_number (INT UNIQUE), broker_name, status, address, contact',
                  desc: 'Licensed stock broker master directory (Broker #1 to #99).',
                },
                {
                  table: 'broker_transactions',
                  pk: 'id (BIGSERIAL)',
                  fk: 'company_id -> companies(id), broker_id -> brokers(id)',
                  cols: 'trade_date, broker_number, buy_quantity, buy_value, sell_quantity, sell_value, net_quantity, net_value',
                  desc: 'Aggregated floor sheet transaction logs for institutional accumulation tracking.',
                },
                {
                  table: 'financial_statements',
                  pk: 'id (VARCHAR)',
                  fk: 'company_id -> companies(id)',
                  cols: 'fiscal_year, quarter, revenue, operating_profit, net_profit, equity, total_assets, total_shares, dividends',
                  desc: 'Quarterly financial reports. Raw data strictly separated from calculated financial ratios.',
                },
              ].map(t => (
                <div key={t.table} className="bg-[#0c1018] border border-slate-800 rounded p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 text-xs uppercase">{t.table}</span>
                    <span className="text-[10px] text-slate-500 font-mono">PK: {t.pk}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{t.desc}</p>
                  <div className="pt-2 border-t border-slate-800/80 text-[10px] space-y-1">
                    <div>
                      <span className="text-slate-500 uppercase font-bold">FK:</span>{' '}
                      <span className="text-amber-400">{t.fk}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase font-bold">Fields:</span>{' '}
                      <span className="text-slate-400">{t.cols}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROVIDER ABSTRACTIONS */}
      {activeTab === 'PROVIDERS' && (
        <div className="space-y-4">
          <div className="bg-[#111722] border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Decoupled Provider Interface Registry</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  The UI communicates strictly with domain services. Services query repositories, and repositories query active data providers.
                </p>
              </div>

              <div className="text-[11px] text-slate-400">
                Current Active Mode:{' '}
                <span className="font-bold text-amber-400">{providerRegistry.getMode()}</span>
              </div>
            </div>

            {/* Provider Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  interface: 'IMarketDataProvider',
                  activeImpl: providerRegistry.getMarketProvider().providerName,
                  isLive: providerRegistry.getMarketProvider().isLive,
                  methods: 'fetchIndices(date?), fetchDailyStatistics(date?)',
                  desc: 'Supplies NEPSE benchmark index, sector sub-indices, turnover, and market breadth statistics.',
                },
                {
                  interface: 'IStockDataProvider',
                  activeImpl: providerRegistry.getStockProvider().providerName,
                  isLive: providerRegistry.getStockProvider().isLive,
                  methods: 'fetchCompanies(), fetchPriceHistory(symbol, limit?), fetchLatestPrice(symbol)',
                  desc: 'Supplies listed company masters, daily OHLCV historical price series, and real-time tick updates.',
                },
                {
                  interface: 'IFundamentalDataProvider',
                  activeImpl: providerRegistry.getFundamentalProvider().providerName,
                  isLive: providerRegistry.getFundamentalProvider().isLive,
                  methods: 'fetchFinancialStatements(symbol)',
                  desc: 'Supplies raw balance-sheet and quarterly income statements filed with SEBON/NEPSE.',
                },
                {
                  interface: 'IBrokerDataProvider',
                  activeImpl: providerRegistry.getBrokerProvider().providerName,
                  isLive: providerRegistry.getBrokerProvider().isLive,
                  methods: 'fetchBrokers(), fetchBrokerTransactions(symbol?, date?)',
                  desc: 'Supplies registered brokerage houses and floor sheet buy/sell clearing transactions.',
                },
              ].map(p => (
                <div key={p.interface} className="bg-[#0c1018] border border-slate-800 rounded p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">{p.interface}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.isLive ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-amber-300'
                    }`}>
                      {p.isLive ? 'LIVE' : 'MOCK'}
                    </span>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">{p.activeImpl}</div>
                  <p className="text-[11px] text-slate-400">{p.desc}</p>
                  <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                    <span className="font-bold uppercase">Contract Methods:</span> {p.methods}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Gateway Transparency Note */}
            <div className="p-4 bg-[#0c1018] border border-slate-800 rounded flex items-start gap-3">
              <Terminal className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-300 space-y-1">
                <div className="font-bold text-slate-100">Live Gateway Architectural Note</div>
                <p className="text-slate-400">
                  In accordance with financial application discipline, live data providers are provisioned with explicit exception guards. The system never pretends mock data is live data. Once verified broker WebSocket or exchange REST credentials are authenticated, the <code className="text-cyan-400">LiveMarketDataProvider</code> and <code className="text-cyan-400">LiveStockDataProvider</code> can be seamlessly activated without modifying any UI components.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
