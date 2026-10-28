-- Migration 006: Add entry/exit date, time, and exit price to trades table
-- Run this query in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- Safe and idempotent: can be run multiple times without error.

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS entry_date DATE,
ADD COLUMN IF NOT EXISTS entry_time VARCHAR(20),
ADD COLUMN IF NOT EXISTS exit_date DATE,
ADD COLUMN IF NOT EXISTS exit_time VARCHAR(20),
ADD COLUMN IF NOT EXISTS exit_price NUMERIC;

-- Create an index for fast date-range filtering on dashboard and calendar
CREATE INDEX IF NOT EXISTS idx_trades_date_user ON trades(user_id, date);
CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON trades(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_trades_exit_date ON trades(user_id, exit_date);

-- Comment for documentation
COMMENT ON COLUMN trades.exit_date IS 'Closing execution date of the trade';
COMMENT ON COLUMN trades.exit_time IS 'Closing execution time (e.g. 13:24 or 01:24 PM)';
COMMENT ON COLUMN trades.exit_price IS 'Actual market exit price of the trade';
