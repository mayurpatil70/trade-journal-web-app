-- Migration 004: Add lot_size to trades table
-- Run in Supabase SQL Editor if you want a dedicated column.
-- (The application also persists lot_size in trades.executions for seamless backward compatibility)

ALTER TABLE trades ADD COLUMN IF NOT EXISTS lot_size NUMERIC;
