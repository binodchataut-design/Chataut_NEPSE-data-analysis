import { IMarketDataProvider, IStockDataProvider } from '../interfaces';
import {
  CompanyMaster,
  HistoricalPriceRecord,
  MarketIndexRecord,
  DailyMarketStatistics,
  ProviderStatusInfo,
} from '../../types/dataInfrastructure';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { OHLCVBar } from '../../types/technicalIndicators';
import { getCachedBars, getCachedCompanies, getCachedIndices } from '../../data/liveBarsCache';

export class SupabaseDataProvider implements IMarketDataProvider, IStockDataProvider {
  public readonly providerName = 'Supabase NEPSE Data Provider';
  public readonly isLive = true;

  private isConnected = isSupabaseConfigured;
  private lastError: string | null = isSupabaseConfigured
    ? null
    : 'Supabase configuration missing: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be provided in environment variables.';

  // In-memory caches to ensure snappy responsiveness across UI components
  private companiesCache: CompanyMaster[] | null = null;
  private priceHistoryCache = new Map<string, HistoricalPriceRecord[]>();
  private barCache = new Map<string, OHLCVBar[]>();
  private indexCache: MarketIndexRecord[] | null = null;
  private latestDate: string | null = null;

  public getStatus(): ProviderStatusInfo {
    if (!isSupabaseConfigured) {
      return {
        providerStatus: 'LIVE_DATA_UNAVAILABLE',
        reason:
          'Supabase configuration missing: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be provided in environment variables.',
        timestamp: new Date().toISOString(),
        gateway: this.providerName,
        authenticated: false,
      };
    }
    return {
      providerStatus: this.isConnected ? 'LIVE_DATA_CONNECTED' : 'LIVE_DATA_UNAVAILABLE',
      reason: this.isConnected
        ? 'Connected to Supabase NEPSE data warehouse (5-year historical prices & official indices).'
        : (this.lastError || 'Supabase connection unavailable.'),
      timestamp: new Date().toISOString(),
      gateway: this.providerName,
      authenticated: true,
    };
  }

  // ==========================================
  // Company & Stock Master
  // ==========================================
  public async fetchCompanies(): Promise<CompanyMaster[]> {
    if (this.companiesCache && this.companiesCache.length > 0) {
      return [...this.companiesCache];
    }

    const cachedLive = getCachedCompanies();
    if (cachedLive && cachedLive.length > 0) {
      this.companiesCache = cachedLive;
      return [...cachedLive];
    }

    try {
      const { data, error } = await supabase
        .from('equity_companies')
        .select('symbol, name, sector, status')
        .order('symbol', { ascending: true });

      if (error) {
        this.isConnected = false;
        this.lastError = error.message;
        console.warn('Supabase fetchCompanies warning:', error.message);
        return [];
      }

      this.isConnected = true;
      const now = new Date().toISOString();
      const mapped: CompanyMaster[] = (data || []).map((row) => ({
        id: row.symbol,
        symbol: row.symbol,
        company_name: row.name || row.symbol,
        sector_id: row.sector || 'Others',
        sector: row.sector || 'Others',
        security_type: 'EQ',
        status: (row.status === 'SUSPENDED' || row.status === 'DELISTED') ? row.status : 'ACTIVE',
        listed_date: null,
        paid_up_capital: null,
        listed_shares: null,
        face_value: null,
        created_at: now,
        updated_at: now,
        hasFullMetadata: false,
      }));

      this.companiesCache = mapped;
      return [...mapped];
    } catch (err: any) {
      this.isConnected = false;
      this.lastError = err?.message || 'Network error';
      console.warn('Supabase fetchCompanies network issue:', err?.message || err);
      return [];
    }
  }

  // ==========================================
  // Stock Price History
  // ==========================================
  public async fetchPriceHistory(
    symbolOrId: string,
    limit?: number
  ): Promise<HistoricalPriceRecord[]> {
    const symbol = symbolOrId.toUpperCase().trim();
    const cached = this.priceHistoryCache.get(symbol);

    if (cached && (!limit || cached.length >= limit)) {
      return limit ? cached.slice(0, limit) : cached;
    }

    // 1. Check in-memory liveBarsCache first (avoids browser connection exhaustion)
    const liveBars = getCachedBars(symbol);
    if (liveBars && liveBars.length > 0) {
      const mapped: HistoricalPriceRecord[] = [...liveBars].reverse().map((b, idx, arr) => {
        const nextOlder = arr[idx + 1];
        const prevClose = nextOlder ? nextOlder.close : b.open;
        const change = Math.round((b.close - prevClose) * 100) / 100;
        const perChange = prevClose !== 0 ? Math.round(((change / prevClose) * 100) * 100) / 100 : 0;
        return {
          id: `pr-${symbol}-${b.date}`,
          company_id: symbol,
          symbol,
          date: b.date,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
          previous_close: prevClose,
          change,
          change_percent: perChange,
          volume: b.volume,
          turnover: b.turnover || Math.round(b.close * b.volume),
          transactions: 0,
          possible_corporate_action: false,
          created_at: b.date,
        };
      });

      this.priceHistoryCache.set(symbol, mapped);
      this.barCache.set(symbol, liveBars);
      return limit ? mapped.slice(0, limit) : mapped;
    }

    // 2. Fallback to Supabase network query if not in memory
    try {
      const fetchLimit = limit && limit < 2000 ? Math.max(limit, 200) : 2000;
      const { data, error } = await supabase
        .from('daily_prices')
        .select('id, symbol, date, open, high, low, close, volume, per_change, possible_corporate_action, created_at')
        .eq('symbol', symbol)
        .order('date', { ascending: false })
        .limit(fetchLimit);

      if (error) {
        this.lastError = error.message;
        console.warn(`Supabase fetchPriceHistory warning for ${symbol}: ${error.message}`);
        return cached ? (limit ? cached.slice(0, limit) : cached) : [];
      }

      this.isConnected = true;

      const records: HistoricalPriceRecord[] = (data || []).map((row) => {
        const close = Number(row.close ?? 0);
        const perChange = row.per_change !== null && row.per_change !== undefined ? Number(row.per_change) : 0;
        const prevClose = perChange !== 0 ? Math.round((close / (1 + perChange / 100)) * 100) / 100 : close;
        const change = Math.round((close - prevClose) * 100) / 100;
        const vol = Number(row.volume ?? 0);

        return {
          id: `pr-${row.id || `${row.symbol}-${row.date}`}`,
          company_id: row.symbol,
          symbol: row.symbol,
          date: row.date,
          open: Number(row.open ?? close),
          high: Number(row.high ?? close),
          low: Number(row.low ?? close),
          close,
          previous_close: prevClose,
          change,
          change_percent: perChange,
          volume: vol,
          turnover: Math.round(close * vol),
          transactions: 0,
          possible_corporate_action: Boolean(row.possible_corporate_action),
          created_at: row.created_at || row.date,
        };
      });

      this.priceHistoryCache.set(symbol, records);

      const chronological = [...records]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((r) => ({
          date: r.date,
          open: r.open,
          high: r.high,
          low: r.low,
          close: r.close,
          volume: r.volume,
          turnover: r.turnover,
        }));
      this.barCache.set(symbol, chronological);

      return limit ? records.slice(0, limit) : records;
    } catch (err: any) {
      this.lastError = err?.message || 'Network error';
      console.warn(`Supabase fetchPriceHistory network issue for ${symbol}:`, err?.message || err);
      return cached ? (limit ? cached.slice(0, limit) : cached) : [];
    }
  }

  public async fetchLatestPrice(symbolOrId: string): Promise<HistoricalPriceRecord | null> {
    const history = await this.fetchPriceHistory(symbolOrId, 1);
    return history.length > 0 ? history[0] : null;
  }

  public async fetchAllLatestPrices(): Promise<HistoricalPriceRecord[]> {
    try {
      // 1. Derive latest prices instantly from in-memory liveBarsCache
      const companies = await this.fetchCompanies();
      const records: HistoricalPriceRecord[] = [];
      for (const comp of companies) {
        const bars = getCachedBars(comp.symbol);
        if (bars && bars.length > 0) {
          const lastBar = bars[bars.length - 1];
          const prevBar = bars.length > 1 ? bars[bars.length - 2] : null;
          const prevClose = prevBar ? prevBar.close : lastBar.open;
          const change = Math.round((lastBar.close - prevClose) * 100) / 100;
          const perChange = prevClose !== 0 ? Math.round(((change / prevClose) * 100) * 100) / 100 : 0;
          records.push({
            id: `pr-${comp.symbol}-${lastBar.date}`,
            company_id: comp.symbol,
            symbol: comp.symbol,
            date: lastBar.date,
            open: lastBar.open,
            high: lastBar.high,
            low: lastBar.low,
            close: lastBar.close,
            previous_close: prevClose,
            change,
            change_percent: perChange,
            volume: lastBar.volume,
            turnover: lastBar.turnover || Math.round(lastBar.close * lastBar.volume),
            transactions: 0,
            possible_corporate_action: false,
            created_at: lastBar.date,
          });
        }
      }

      if (records.length > 0) {
        return records;
      }

      // 2. Fallback to Supabase query if in-memory cache is not yet ready
      const indices = await this.fetchIndices();
      const latestDate = indices.length > 0 ? indices[0].date : '2026-09-15';

      const { data, error } = await supabase
        .from('daily_prices')
        .select('id, symbol, date, open, high, low, close, volume, per_change, possible_corporate_action, created_at')
        .eq('date', latestDate);

      if (error || !data) {
        console.warn('fetchAllLatestPrices query warning:', error?.message);
        return [];
      }

      return data.map((row) => {
        const close = Number(row.close ?? 0);
        const perChange = row.per_change !== null && row.per_change !== undefined ? Number(row.per_change) : 0;
        const prevClose = perChange !== 0 ? Math.round((close / (1 + perChange / 100)) * 100) / 100 : close;
        const change = Math.round((close - prevClose) * 100) / 100;
        const vol = Number(row.volume ?? 0);

        return {
          id: `pr-${row.id || `${row.symbol}-${row.date}`}`,
          company_id: row.symbol,
          symbol: row.symbol,
          date: row.date,
          open: Number(row.open ?? close),
          high: Number(row.high ?? close),
          low: Number(row.low ?? close),
          close,
          previous_close: prevClose,
          change,
          change_percent: perChange,
          volume: vol,
          turnover: Math.round(close * vol),
          transactions: 0,
          possible_corporate_action: Boolean(row.possible_corporate_action),
          created_at: row.created_at || row.date,
        };
      });
    } catch (err: any) {
      console.warn('fetchAllLatestPrices network issue:', err?.message || err);
      return [];
    }
  }

  // ==========================================
  // Synchronous Bar Access with Auto-Cache
  // ==========================================
  public getCachedBars(symbol: string): OHLCVBar[] | null {
    const live = getCachedBars(symbol);
    if (live && live.length > 0) return live;
    return this.barCache.get(symbol.toUpperCase().trim()) || null;
  }

  public setCachedBars(symbol: string, bars: OHLCVBar[]): void {
    this.barCache.set(symbol.toUpperCase().trim(), bars);
  }

  // ==========================================
  // Market Index & Statistics
  // ==========================================
  public async fetchIndices(date?: string): Promise<MarketIndexRecord[]> {
    if (this.indexCache && !date) {
      return [...this.indexCache];
    }

    const cachedLiveIdx = getCachedIndices();
    if (cachedLiveIdx && cachedLiveIdx.length > 0) {
      if (!date) {
        this.indexCache = cachedLiveIdx;
        return [...cachedLiveIdx];
      }
      const match = cachedLiveIdx.filter(r => r.date === date);
      if (match.length > 0) {
        return match;
      }
    }

    try {
      if (date) {
        const { data, error } = await supabase
          .from('market_index')
          .select('date, close, change_percent, turnover')
          .eq('date', date)
          .order('date', { ascending: false });

        if (error) {
          this.lastError = error.message;
          console.warn('Supabase fetchIndices warning for date:', error.message);
          return [];
        }

        return (data || []).map((row) => this.mapIndexRow(row));
      }

      // Fetch all index records with range pagination to avoid Supabase default 1000-row limit
      const PAGE_SIZE = 1000;
      let offset = 0;
      let hasMore = true;
      const allRows: any[] = [];

      while (hasMore) {
        const { data, error } = await supabase
          .from('market_index')
          .select('date, close, change_percent, turnover')
          .order('date', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) {
          this.lastError = error.message;
          console.warn('Supabase fetchIndices range warning:', error.message);
          return [];
        }

        const rows = data || [];
        allRows.push(...rows);

        if (rows.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      }

      this.isConnected = true;
      const mapped: MarketIndexRecord[] = allRows.map((row) => this.mapIndexRow(row));

      this.indexCache = mapped;
      if (mapped.length > 0) {
        this.latestDate = mapped[0].date;
      }

      return mapped;
    } catch (err: any) {
      this.lastError = err?.message || 'Network error';
      console.warn('Supabase fetchIndices network issue:', err?.message || err);
      return [];
    }
  }

  private mapIndexRow(row: any): MarketIndexRecord {
    const close = Number(row.close ?? 0);
    const perChange = row.change_percent !== null && row.change_percent !== undefined ? Number(row.change_percent) : 0;
    const change = perChange !== 0 ? Math.round(((close * perChange) / (100 + perChange)) * 100) / 100 : 0;
    const turnover = Number(row.turnover ?? 0);

    return {
      id: `idx-nepse-${row.date}`,
      index_id: 'NEPSE',
      name: 'NEPSE Index',
      date: row.date,
      open: close,
      high: close,
      low: close,
      close,
      change,
      change_percent: perChange,
      turnover,
      volume: Math.round(turnover / (close || 1)),
      transactions: 0,
      created_at: row.date,
    };
  }

  public async fetchDailyStatistics(date?: string): Promise<DailyMarketStatistics> {
    const now = new Date().toISOString();
    try {
      const indices = await this.fetchIndices(date);
      const targetDate = date || (indices.length > 0 ? indices[0].date : '2026-09-15');
      const latestIndex = indices.find((i) => i.date === targetDate) || indices[0];

      // 1. Try computing directly from in-memory cached bars
      const companies = await this.fetchCompanies();
      let advancers = 0;
      let decliners = 0;
      let unchanged = 0;
      let totalVolume = 0;
      let totalTurnover = latestIndex ? latestIndex.turnover : 0;
      let tradedCount = 0;

      for (const comp of companies) {
        const bars = getCachedBars(comp.symbol);
        if (!bars || bars.length === 0) continue;
        const targetBarIdx = bars.findIndex(b => b.date === targetDate);
        if (targetBarIdx === -1) continue;

        tradedCount++;
        const b = bars[targetBarIdx];
        const prevBar = targetBarIdx > 0 ? bars[targetBarIdx - 1] : null;
        const prevClose = prevBar ? prevBar.close : b.open;
        const diff = b.close - prevClose;

        totalVolume += b.volume;
        if (!latestIndex?.turnover) {
          totalTurnover += b.turnover || Math.round(b.close * b.volume);
        }

        if (diff > 0.001) advancers++;
        else if (diff < -0.001) decliners++;
        else unchanged++;
      }

      if (tradedCount > 0) {
        const adRatio = decliners > 0 ? Math.round((advancers / decliners) * 100) / 100 : (advancers > 0 ? advancers : 0);
        const breadth = adRatio >= 1.2 ? 'BULLISH' : adRatio <= 0.8 ? 'BEARISH' : 'NEUTRAL';
        return {
          id: `stat-${targetDate}`,
          date: targetDate,
          total_turnover: totalTurnover,
          total_volume: totalVolume || (latestIndex ? latestIndex.volume : 0),
          total_transactions: 0,
          listed_companies: companies.length,
          traded_companies: tradedCount,
          advancers,
          decliners,
          unchanged,
          advance_decline_ratio: adRatio,
          market_breadth: breadth,
          stocks_above_20ema: 0,
          stocks_above_50sma: 0,
          stocks_above_200sma: 0,
          created_at: now,
          hasData: true,
        };
      }

      // 2. Query daily prices from Supabase if cache was empty
      const { data: dayPrices, error } = await supabase
        .from('daily_prices')
        .select('per_change, volume, close')
        .eq('date', targetDate);

      if (error) {
        console.warn('Supabase daily_prices query warning in fetchDailyStatistics:', error.message);
        return {
          id: `stat-${targetDate}`,
          date: targetDate,
          total_turnover: 0,
          total_volume: 0,
          total_transactions: 0,
          listed_companies: 0,
          traded_companies: 0,
          advancers: 0,
          decliners: 0,
          unchanged: 0,
          advance_decline_ratio: 0,
          market_breadth: null,
          stocks_above_20ema: 0,
          stocks_above_50sma: 0,
          stocks_above_200sma: 0,
          created_at: now,
          hasData: false,
        };
      }

      if (!dayPrices || dayPrices.length === 0) {
        return {
          id: `stat-${targetDate}`,
          date: targetDate,
          total_turnover: latestIndex ? latestIndex.turnover : 0,
          total_volume: latestIndex ? latestIndex.volume : 0,
          total_transactions: 0,
          listed_companies: 0,
          traded_companies: 0,
          advancers: 0,
          decliners: 0,
          unchanged: 0,
          advance_decline_ratio: 0,
          market_breadth: null,
          stocks_above_20ema: 0,
          stocks_above_50sma: 0,
          stocks_above_200sma: 0,
          created_at: now,
          hasData: false,
        };
      }

      for (const p of dayPrices) {
        const chg = Number(p.per_change ?? 0);
        const vol = Number(p.volume ?? 0);
        const close = Number(p.close ?? 0);
        totalVolume += vol;
        if (!totalTurnover) {
          totalTurnover += close * vol;
        }
        if (chg > 0.001) advancers++;
        else if (chg < -0.001) decliners++;
        else unchanged++;
      }

      const adRatio = decliners > 0 ? Math.round((advancers / decliners) * 100) / 100 : (advancers > 0 ? advancers : 0);
      const totalTraded = advancers + decliners + unchanged;
      const breadth = adRatio >= 1.2 ? 'BULLISH' : adRatio <= 0.8 ? 'BEARISH' : 'NEUTRAL';

      return {
        id: `stat-${targetDate}`,
        date: targetDate,
        total_turnover: totalTurnover,
        total_volume: totalVolume || (latestIndex ? latestIndex.volume : 0),
        total_transactions: 0,
        listed_companies: 0,
        traded_companies: totalTraded,
        advancers,
        decliners,
        unchanged,
        advance_decline_ratio: adRatio,
        market_breadth: breadth,
        stocks_above_20ema: 0,
        stocks_above_50sma: 0,
        stocks_above_200sma: 0,
        created_at: now,
        hasData: true,
      };
    } catch (err: any) {
      console.warn('Supabase fetchDailyStatistics network issue:', err?.message || err);
      const fallbackDate = date || '2026-09-15';
      return {
        id: `stat-${fallbackDate}`,
        date: fallbackDate,
        total_turnover: 0,
        total_volume: 0,
        total_transactions: 0,
        listed_companies: 0,
        traded_companies: 0,
        advancers: 0,
        decliners: 0,
        unchanged: 0,
        advance_decline_ratio: 0,
        market_breadth: null,
        stocks_above_20ema: 0,
        stocks_above_50sma: 0,
        stocks_above_200sma: 0,
        created_at: now,
        hasData: false,
      };
    }
  }
}

export const supabaseDataProvider = new SupabaseDataProvider();
