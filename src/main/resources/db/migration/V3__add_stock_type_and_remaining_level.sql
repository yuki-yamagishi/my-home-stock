-- Flyway Migration: V3 Add stock_type and remaining_level for 4-level stock management
-- Adds stock_type ('QUANTITY', 'REMAINING_LEVEL') and remaining_level ('EMPTY', 'LOW', 'PLENTY', 'FULL')

ALTER TABLE stock_items ADD COLUMN stock_type VARCHAR(20) NOT NULL DEFAULT 'QUANTITY';
ALTER TABLE stock_items ADD COLUMN remaining_level VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_stock_items_stock_type ON stock_items(household_id, stock_type);
