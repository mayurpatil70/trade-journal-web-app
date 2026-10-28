-- Migration 008: Add PnL, Commissions, Swap and Trade Analytics Columns
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- Safe, idempotent, and non-destructive.

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS pnl NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS commissions NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS swap NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'closed',
ADD COLUMN IF NOT EXISTS hold_duration_minutes NUMERIC DEFAULT 0;

-- Optimized indexes for instant performance analytics and calendar querying
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_user_date_pnl ON trades(user_id, date, pnl);
CREATE INDEX IF NOT EXISTS idx_trades_user_account_date ON trades(user_id, account_name, date);

COMMENT ON COLUMN trades.pnl IS 'Closed realized trade profit or loss in account currency';
COMMENT ON COLUMN trades.commissions IS 'Broker commissions paid for trade executions';
COMMENT ON COLUMN trades.swap IS 'Overnight financing swap fees';
COMMENT ON COLUMN trades.status IS 'Trade status: closed or open';
COMMENT ON COLUMN trades.hold_duration_minutes IS 'Total trade duration in minutes';
