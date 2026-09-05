-- Flyway Migration: V1 Initial Schema for MyHomeStock
-- Includes optimistic locking column (`version`) for concurrent multi-device sync
-- Includes household_id for multi-device/family sharing isolation

CREATE TABLE IF NOT EXISTS stock_items (
    id BIGSERIAL PRIMARY KEY,
    household_id VARCHAR(50) NOT NULL DEFAULT 'default',
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT '未分類',
    quantity INTEGER NOT NULL DEFAULT 1,
    unit VARCHAR(20) NOT NULL DEFAULT '個',
    min_threshold INTEGER NOT NULL DEFAULT 1,
    memo TEXT,
    expiry_date DATE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_items_household ON stock_items(household_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_category ON stock_items(household_id, category);
CREATE INDEX IF NOT EXISTS idx_stock_items_expiry_date ON stock_items(household_id, expiry_date);
