-- ==============================================================================
-- PERSONAL NEPSE RESEARCH & TRADING INTELLIGENCE SYSTEM
-- Relational PostgreSQL & Supabase Database Architecture Schema
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SECTORS MASTER
CREATE TABLE IF NOT EXISTS sectors (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    index_symbol VARCHAR(32) NOT NULL UNIQUE,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. COMPANIES MASTER
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(64) PRIMARY KEY,
    symbol VARCHAR(16) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    sector_id VARCHAR(32) NOT NULL REFERENCES sectors(id) ON DELETE RESTRICT,
    security_type VARCHAR(16) NOT NULL DEFAULT 'EQ' CHECK (security_type IN ('EQ', 'MF', 'DEB', 'PREF')),
    listed_date DATE,
    listed_shares BIGINT NOT NULL DEFAULT 0 CHECK (listed_shares >= 0),
    paid_up_capital NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (paid_up_capital >= 0),
    face_value NUMERIC(10, 2) NOT NULL DEFAULT 100.00 CHECK (face_value > 0),
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELISTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_symbol ON companies(symbol);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector_id);

-- 4. BROKERS MASTER
CREATE TABLE IF NOT EXISTS brokers (
    id VARCHAR(64) PRIMARY KEY,
    broker_number INTEGER NOT NULL UNIQUE CHECK (broker_number > 0 AND broker_number < 1000),
    broker_name VARCHAR(255) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')),
    address TEXT,
    contact VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brokers_number ON brokers(broker_number);

-- 5. HISTORICAL PRICE DATA (Daily OHLCV)
CREATE TABLE IF NOT EXISTS price_history (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    symbol VARCHAR(16) NOT NULL,
    trade_date DATE NOT NULL,
    open NUMERIC(12, 2) NOT NULL CHECK (open > 0),
    high NUMERIC(12, 2) NOT NULL CHECK (high > 0),
    low NUMERIC(12, 2) NOT NULL CHECK (low > 0),
    close NUMERIC(12, 2) NOT NULL CHECK (close > 0),
    previous_close NUMERIC(12, 2) NOT NULL CHECK (previous_close > 0),
    change NUMERIC(12, 2) NOT NULL,
    change_percent NUMERIC(8, 4) NOT NULL,
    volume BIGINT NOT NULL CHECK (volume >= 0),
    turnover NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (turnover >= 0),
    transactions INTEGER NOT NULL DEFAULT 0 CHECK (transactions >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Enforce valid OHLC relationship at DB level
    CONSTRAINT check_high_low CHECK (high >= low),
    CONSTRAINT check_high_open CHECK (high >= open),
    CONSTRAINT check_high_close CHECK (high >= close),
    CONSTRAINT check_low_open CHECK (low <= open),
    CONSTRAINT check_low_close CHECK (low <= close),
    -- Ensure unique price per company per day
    CONSTRAINT uq_company_date UNIQUE (company_id, trade_date)
);

CREATE INDEX IF NOT EXISTS idx_price_history_sym_date ON price_history(symbol, trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(trade_date DESC);

-- 6. MARKET INDICES
CREATE TABLE IF NOT EXISTS market_indices (
    id BIGSERIAL PRIMARY KEY,
    index_id VARCHAR(32) NOT NULL,
    name VARCHAR(100) NOT NULL,
    trade_date DATE NOT NULL,
    open NUMERIC(12, 2) NOT NULL,
    high NUMERIC(12, 2) NOT NULL,
    low NUMERIC(12, 2) NOT NULL,
    close NUMERIC(12, 2) NOT NULL,
    change NUMERIC(12, 2) NOT NULL,
    change_percent NUMERIC(8, 4) NOT NULL,
    turnover NUMERIC(18, 2) NOT NULL DEFAULT 0,
    volume BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_index_date UNIQUE (index_id, trade_date)
);

CREATE INDEX IF NOT EXISTS idx_market_indices_id_date ON market_indices(index_id, trade_date DESC);

-- 7. MARKET DAILY STATISTICS
CREATE TABLE IF NOT EXISTS market_daily_statistics (
    id VARCHAR(32) PRIMARY KEY,
    trade_date DATE NOT NULL UNIQUE,
    advancers INTEGER NOT NULL CHECK (advancers >= 0),
    decliners INTEGER NOT NULL CHECK (decliners >= 0),
    unchanged INTEGER NOT NULL CHECK (unchanged >= 0),
    total_turnover NUMERIC(20, 2) NOT NULL CHECK (total_turnover >= 0),
    total_volume BIGINT NOT NULL CHECK (total_volume >= 0),
    total_transactions INTEGER NOT NULL CHECK (total_transactions >= 0),
    listed_companies INTEGER NOT NULL CHECK (listed_companies >= 0),
    traded_companies INTEGER NOT NULL CHECK (traded_companies >= 0),
    advance_decline_ratio NUMERIC(8, 4) NOT NULL DEFAULT 1.0,
    market_breadth VARCHAR(16) NOT NULL CHECK (market_breadth IN ('BULLISH', 'NEUTRAL', 'BEARISH')),
    stocks_above_20ema NUMERIC(6, 2) NOT NULL DEFAULT 0,
    stocks_above_50sma NUMERIC(6, 2) NOT NULL DEFAULT 0,
    stocks_above_200sma NUMERIC(6, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. BROKER TRANSACTIONS (Floor Sheet aggregations)
CREATE TABLE IF NOT EXISTS broker_transactions (
    id BIGSERIAL PRIMARY KEY,
    trade_date DATE NOT NULL,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    symbol VARCHAR(16) NOT NULL,
    broker_id VARCHAR(64) NOT NULL REFERENCES brokers(id) ON DELETE RESTRICT,
    broker_number INTEGER NOT NULL,
    buy_quantity BIGINT NOT NULL DEFAULT 0 CHECK (buy_quantity >= 0),
    buy_value NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (buy_value >= 0),
    sell_quantity BIGINT NOT NULL DEFAULT 0 CHECK (sell_quantity >= 0),
    sell_value NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (sell_value >= 0),
    net_quantity BIGINT NOT NULL,
    net_value NUMERIC(18, 2) NOT NULL,
    transaction_count INTEGER NOT NULL DEFAULT 0 CHECK (transaction_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_broker_stock_date UNIQUE (trade_date, company_id, broker_id)
);

CREATE INDEX IF NOT EXISTS idx_broker_transactions_date ON broker_transactions(trade_date DESC);
CREATE INDEX IF NOT EXISTS idx_broker_transactions_sym ON broker_transactions(symbol, trade_date DESC);

-- 9. FINANCIAL PERIODS & RAW FINANCIAL STATEMENTS
CREATE TABLE IF NOT EXISTS financial_periods (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    fiscal_year VARCHAR(16) NOT NULL,
    quarter VARCHAR(4) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    end_date DATE,
    is_audited BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_company_fiscal_quarter UNIQUE (company_id, fiscal_year, quarter)
);

CREATE TABLE IF NOT EXISTS financial_statements (
    id VARCHAR(64) PRIMARY KEY,
    period_id VARCHAR(64) NOT NULL REFERENCES financial_periods(id) ON DELETE CASCADE,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    symbol VARCHAR(16) NOT NULL,
    revenue NUMERIC(18, 2) NOT NULL DEFAULT 0,
    operating_profit NUMERIC(18, 2) NOT NULL DEFAULT 0,
    net_profit NUMERIC(18, 2) NOT NULL DEFAULT 0,
    paid_up_capital NUMERIC(18, 2) NOT NULL DEFAULT 0,
    reserve_and_surplus NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_assets NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_liabilities NUMERIC(18, 2) NOT NULL DEFAULT 0,
    equity NUMERIC(18, 2) NOT NULL DEFAULT 0,
    current_assets NUMERIC(18, 2) NOT NULL DEFAULT 0,
    current_liabilities NUMERIC(18, 2) NOT NULL DEFAULT 0,
    cash_and_equivalents NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_shares NUMERIC(18, 4) NOT NULL DEFAULT 1,
    declared_cash_dividend NUMERIC(6, 2) DEFAULT 0,
    declared_bonus_dividend NUMERIC(6, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CORPORATE ACTIONS & DIVIDENDS
CREATE TABLE IF NOT EXISTS dividends (
    id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    fiscal_year VARCHAR(16) NOT NULL,
    cash_dividend_percent NUMERIC(6, 2) NOT NULL DEFAULT 0,
    bonus_share_percent NUMERIC(6, 2) NOT NULL DEFAULT 0,
    book_closure_date DATE,
    agm_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'APPROVED', 'DISTRIBUTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
