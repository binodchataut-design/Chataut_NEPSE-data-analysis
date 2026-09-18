/**
 * src/data/liveBarsCache.ts
 *
 * Isolated in-memory bars cache module.
 * Provides mode-aware synchronous access to full historical OHLCV bar series.
 *
 * In 'SUPABASE' / 'REAL_DATA' mode:
 *   Bulk fetches and paginates the complete daily_prices table (~300,909 rows)
 *   from Supabase, grouped by symbol into OHLCVBar[].
 *
 * In 'MOCK_DATA' mode:
 *   Populates the cache using getNormalizedStockBars() for each symbol in normalizedCompanies,
 *   preserving mock testing behavior byte-for-byte.
 */

import { supabase } from '../lib/supabaseClient';
import { providerRegistry } from '../providers/providerRegistry';
import { OHLCVBar } from '../types/technicalIndicators';
import { CompanyMaster, MarketIndexRecord } from '../types/dataInfrastructure';
import { normalizedCompanies, getNormalizedStockBars } from './normalizedMasterData';
import { companyRepository } from '../repositories/companyRepository';
import { marketRepository } from '../repositories/marketRepository';

const barsCache = new Map<string, OHLCVBar[]>();
let cacheReady = false;
let inFlightPromise: Promise<void> | null = null;

const companyCache = new Map<string, CompanyMaster>();
let companyCacheReady = false;
let companyInFlightPromise: Promise<void> | null = null;

let indexCache: MarketIndexRecord[] = [];
let indexCacheReady = false;
let indexInFlightPromise: Promise<void> | null = null;

/**
 * Checks whether the cache has been successfully initialized with data.
 */
export function isCacheReady(): boolean {
  return cacheReady;
}

/**
 * Checks whether all live data caches (bars, companies, indices) are ready.
 */
export function isLiveDataReady(): boolean {
  return cacheReady && companyCacheReady && indexCacheReady;
}

/**
 * Clears the bars cache and resets the readiness status.
 */
export function clearBarsCache(): void {
  barsCache.clear();
  cacheReady = false;
  inFlightPromise = null;
}

/**
 * Clears all three caches (bars, companies, indices) and resets their ready flags.
 */
export function clearLiveDataCaches(): void {
  clearBarsCache();
  companyCache.clear();
  companyCacheReady = false;
  companyInFlightPromise = null;
  indexCache = [];
  indexCacheReady = false;
  indexInFlightPromise = null;
}

/**
 * Returns the list of all tradeable equity symbols currently held in the cache.
 * Synchronous.
 * In SUPABASE mode: 385 verified equity symbols (intersected with companyCache/equity_companies, excluding 52 debentures).
 * In MOCK_DATA mode: 17 normalized mock symbols.
 */
export function getCachedSymbols(): string[] {
  if (!cacheReady) {
    console.warn('[liveBarsCache] getCachedSymbols called before cache is initialized. Returning empty array.');
    return [];
  }
  if (companyCacheReady && companyCache.size > 0) {
    return Array.from(barsCache.keys()).filter(sym => companyCache.has(sym));
  }
  return Array.from(barsCache.keys());
}

/**
 * Returns the OHLCVBar array for a given symbol from the cache.
 * Synchronous.
 * Returns empty array [] if cache is not ready or symbol is not found.
 * Never throws and never fabricates placeholder data.
 */
export function getCachedBars(symbol: string): OHLCVBar[] {
  if (!cacheReady) {
    console.warn(`[liveBarsCache] getCachedBars("${symbol}") called before cache is initialized. Returning empty array.`);
    return [];
  }

  const normalizedSymbol = (symbol || '').toUpperCase().trim();
  const bars = barsCache.get(normalizedSymbol);
  return bars ? [...bars] : [];
}

/**
 * Synchronous getter for all cached companies.
 * In SUPABASE mode: returns the 437 companies fetched from Supabase.
 * In MOCK_DATA mode: returns the 17 mock companies.
 */
export function getCachedCompanies(): CompanyMaster[] {
  if (!companyCacheReady) {
    return [];
  }
  return Array.from(companyCache.values());
}

/**
 * Synchronous getter for company metadata.
 * Returns null if not found or cache not ready.
 */
export function getCachedCompany(symbol: string): CompanyMaster | null {
  if (!companyCacheReady) {
    return null;
  }
  const clean = (symbol || '').toUpperCase().trim();
  return companyCache.get(clean) || null;
}

/**
 * Synchronous getter for market indices.
 * Returns empty array [] if not ready.
 */
export function getCachedIndices(): MarketIndexRecord[] {
  if (!indexCacheReady) {
    return [];
  }
  return [...indexCache];
}

/**
 * Asynchronously initializes the company metadata cache.
 */
export async function initializeCompanyCache(): Promise<void> {
  if (companyInFlightPromise) {
    return companyInFlightPromise;
  }

  companyInFlightPromise = (async () => {
    companyCache.clear();
    companyCacheReady = false;
    try {
      const companies = await companyRepository.getAllCompanies();
      for (const comp of companies) {
        if (!comp.symbol) continue;
        const sym = comp.symbol.toUpperCase().trim();
        if (!comp.sector && comp.sector_id) {
          comp.sector = comp.sector_id;
        }
        companyCache.set(sym, comp);
      }
      companyCacheReady = true;
      console.log(`[liveBarsCache] Company cache initialized with ${companyCache.size} companies.`);
    } catch (err: any) {
      console.error('[liveBarsCache] Failed to initialize company cache:', err?.message || err);
      companyCache.clear();
      companyCacheReady = false;
      throw err;
    }
  })();

  try {
    await companyInFlightPromise;
  } finally {
    companyInFlightPromise = null;
  }
}

/**
 * Asynchronously initializes the market index history cache.
 */
export async function initializeIndexCache(): Promise<void> {
  if (indexInFlightPromise) {
    return indexInFlightPromise;
  }

  indexInFlightPromise = (async () => {
    indexCache = [];
    indexCacheReady = false;
    try {
      const indices = await marketRepository.getIndices();
      indexCache = indices || [];
      indexCacheReady = true;
      console.log(`[liveBarsCache] Index cache initialized with ${indexCache.length} index rows.`);
    } catch (err: any) {
      console.error('[liveBarsCache] Failed to initialize index cache:', err?.message || err);
      indexCache = [];
      indexCacheReady = false;
      throw err;
    }
  })();

  try {
    await indexInFlightPromise;
  } finally {
    indexInFlightPromise = null;
  }
}

/**
 * Orchestrator: runs initializeBarsCache, initializeCompanyCache, and initializeIndexCache
 * in parallel via Promise.all.
 */
export async function initializeLiveDataCaches(): Promise<void> {
  console.log('[liveBarsCache] Initializing all live data caches (bars, companies, indices)...');
  await Promise.all([
    initializeBarsCache(),
    initializeCompanyCache(),
    initializeIndexCache()
  ]);

  if (!isLiveDataReady()) {
    throw new Error('One or more live data caches failed to initialize.');
  }

  let totalBars = 0;
  for (const bars of barsCache.values()) {
    totalBars += bars.length;
  }
  console.log(`[liveBarsCache] initializeLiveDataCaches complete: ${barsCache.size} symbols, ${totalBars} bars, ${companyCache.size} companies, ${indexCache.length} index rows.`);
}

/**
 * Asynchronously initializes the bars cache according to the active providerRegistry mode.
 * Deduplicates concurrent calls via a shared in-flight promise.
 */
export async function initializeBarsCache(): Promise<void> {
  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    // Reset cache state before initializing
    barsCache.clear();
    cacheReady = false;

    let mode = providerRegistry.getMode();

    if (mode === 'SUPABASE' && !isSupabaseConfigured) {
      console.warn('[liveBarsCache] Supabase mode requested but Supabase is not configured. Falling back to MOCK_DATA.');
      providerRegistry.setMode('MOCK_DATA');
      mode = 'MOCK_DATA';
    }

    if (mode === 'MOCK_DATA') {
      try {
        console.log('[liveBarsCache] Initializing bars cache in MOCK_DATA mode...');
        for (const company of normalizedCompanies) {
          const sym = company.symbol.toUpperCase().trim();
          const bars = getNormalizedStockBars(sym);
          // Ensure sorted by date ascending
          const sorted = [...bars].sort((a, b) => a.date.localeCompare(b.date));
          barsCache.set(sym, sorted);
        }
        cacheReady = true;
        console.log(`[liveBarsCache] MOCK_DATA cache initialized with ${barsCache.size} symbols.`);
      } catch (err: any) {
        console.error('[liveBarsCache] Failed to initialize MOCK_DATA bars cache:', err);
        barsCache.clear();
        cacheReady = false;
        throw err;
      }
      return;
    }

    // SUPABASE or live mode: Bulk-fetch all rows from daily_prices table with pagination
    try {
      console.log(`[liveBarsCache] Initializing bars cache from Supabase daily_prices table in ${mode} mode...`);
      const PAGE_SIZE = 1000;
      const BATCH_SIZE = 10;
      let offset = 0;
      let hasMore = true;
      let totalFetched = 0;
      const tempGrouped = new Map<string, OHLCVBar[]>();

      while (hasMore) {
        const pagePromises = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
          const start = offset + i * PAGE_SIZE;
          const end = start + PAGE_SIZE - 1;
          pagePromises.push(
            supabase
              .from('daily_prices')
              .select('symbol, date, open, high, low, close, volume')
              .order('symbol', { ascending: true })
              .order('date', { ascending: true })
              .range(start, end)
          );
        }

        const results = await Promise.all(pagePromises);

        for (const res of results) {
          if (res.error) {
            throw new Error(`Supabase query failed: ${res.error.message} (${res.error.details || res.error.hint || ''})`);
          }

          const rows = res.data || [];
          totalFetched += rows.length;

          for (const row of rows) {
            if (!row.symbol || !row.date) continue;
            const sym = String(row.symbol).toUpperCase().trim();
            let list = tempGrouped.get(sym);
            if (!list) {
              list = [];
              tempGrouped.set(sym, list);
            }

            const close = Number(row.close ?? 0);
            const volume = Number(row.volume ?? 0);

            list.push({
              date: String(row.date),
              open: Number(row.open ?? close),
              high: Number(row.high ?? close),
              low: Number(row.low ?? close),
              close,
              volume,
              turnover: (row as any).turnover !== undefined && (row as any).turnover !== null
                ? Number((row as any).turnover)
                : undefined,
            });
          }

          if (rows.length < PAGE_SIZE) {
            hasMore = false;
            break;
          }
        }

        offset += BATCH_SIZE * PAGE_SIZE;
      }

      // Sort every symbol's bar list strictly by date ascending
      for (const [sym, bars] of tempGrouped.entries()) {
        bars.sort((a, b) => a.date.localeCompare(b.date));
        barsCache.set(sym, bars);
      }

      cacheReady = true;
      console.log(`[liveBarsCache] Bulk-fetch complete. Total row count fetched: ${totalFetched} rows across ${barsCache.size} symbols.`);
    } catch (err: any) {
      console.warn('[liveBarsCache] Failed to initialize Supabase bars cache. Falling back to MOCK_DATA mode:', err?.message || err);
      providerRegistry.setMode('MOCK_DATA');
      barsCache.clear();
      for (const company of normalizedCompanies) {
        const sym = company.symbol.toUpperCase().trim();
        const bars = getNormalizedStockBars(sym);
        const sorted = [...bars].sort((a, b) => a.date.localeCompare(b.date));
        barsCache.set(sym, sorted);
      }
      cacheReady = true;
    }
  })();

  try {
    await inFlightPromise;
  } finally {
    inFlightPromise = null;
  }
}
