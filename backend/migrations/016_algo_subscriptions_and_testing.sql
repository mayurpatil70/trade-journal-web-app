-- Migration: 016_algo_subscriptions_and_testing.sql
-- Description: Create tables and columns for TradingView VIP Algo ($169/mo) and Admin Testing Architecture

-- 1. Create dedicated Algo Subscriptions table
CREATE TABLE IF NOT EXISTS algo_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tradingview_username TEXT NOT NULL,
  amount_usdt NUMERIC(10, 2) NOT NULL DEFAULT 169.00,
  chain TEXT NOT NULL DEFAULT 'BEP20',
  tx_hash TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid', -- 'paid', 'expired', 'revoked'
  access_status TEXT NOT NULL DEFAULT 'pending_invite', -- 'pending_invite', 'active', 'revoked'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 2. Add columns to profiles for quick gate checks
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS algo_active BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS algo_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tradingview_username TEXT;

-- 3. Create Automation Logs table for Architecture B testing
CREATE TABLE IF NOT EXISTS algo_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tradingview_username TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'invite_user',
  status TEXT NOT NULL DEFAULT 'success', -- 'queued', 'processing', 'success', 'failed'
  attempt_count INT DEFAULT 1,
  log_output TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for high-speed queries & replay protection
CREATE INDEX IF NOT EXISTS idx_algo_subscriptions_tx_hash ON algo_subscriptions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_algo_subscriptions_user_id ON algo_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_algo_subscriptions_status ON algo_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_algo_automation_logs_created ON algo_automation_logs(created_at DESC);

-- 5. RLS Policies (Row Level Security)
ALTER TABLE algo_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE algo_automation_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
DROP POLICY IF EXISTS "Users can read own algo subscriptions" ON algo_subscriptions;
CREATE POLICY "Users can read own algo subscriptions" ON algo_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role and admin have full access
DROP POLICY IF EXISTS "Service role full access algo_subscriptions" ON algo_subscriptions;
CREATE POLICY "Service role full access algo_subscriptions" ON algo_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access algo_automation_logs" ON algo_automation_logs;
CREATE POLICY "Service role full access algo_automation_logs" ON algo_automation_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);
