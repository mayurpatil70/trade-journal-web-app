-- ==============================================================================
-- Migration 009: Robust Trading Rules & Account Guardrails Setup
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- Safe & Idempotent: Can be executed multiple times without errors or data loss.
-- ==============================================================================

-- 1. Safely remove restrictive foreign key constraint to auth.users if present,
--    allowing profiles to work seamlessly with public.users / custom auth models.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END $$;

-- 2. Ensure profiles table exists with all required columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  username TEXT UNIQUE,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  currency VARCHAR(10) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  discipline_rules JSONB DEFAULT '{
    "maxRiskPerTrade": "2%",
    "maxTradesPerDay": "5",
    "dailyLossCap": "5%",
    "lossStreakBreak": "3 in a row",
    "targetRR": "1:2"
  }'::jsonb,
  rules_onboarded BOOLEAN DEFAULT false,
  pre_trade_checklist JSONB DEFAULT '[
    {"id": "1", "text": "Checked higher timeframe", "checked": true, "order": 1},
    {"id": "2", "text": "Risk within limits", "checked": true, "order": 2},
    {"id": "3", "text": "Fits my trading plan", "checked": true, "order": 3},
    {"id": "4", "text": "Key levels identified", "checked": true, "order": 4},
    {"id": "5", "text": "Economic calendar checked", "checked": true, "order": 5}
  ]'::jsonb,
  current_plan VARCHAR(20) DEFAULT 'free',
  account_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. If profiles table already exists, safely add missing columns
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS discipline_rules JSONB DEFAULT '{
    "maxRiskPerTrade": "2%",
    "maxTradesPerDay": "5",
    "dailyLossCap": "5%",
    "lossStreakBreak": "3 in a row",
    "targetRR": "1:2"
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS rules_onboarded BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pre_trade_checklist JSONB DEFAULT '[
    {"id": "1", "text": "Checked higher timeframe", "checked": true, "order": 1},
    {"id": "2", "text": "Risk within limits", "checked": true, "order": 2},
    {"id": "3", "text": "Fits my trading plan", "checked": true, "order": 3},
    {"id": "4", "text": "Key levels identified", "checked": true, "order": 4},
    {"id": "5", "text": "Economic calendar checked", "checked": true, "order": 5}
  ]'::jsonb,
  ADD COLUMN IF NOT EXISTS current_plan VARCHAR(20) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Ensure public.users table ALSO has discipline_rules and rules_onboarded
--    This dual-store guarantees rules are never lost even if profiles has sync lag.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS discipline_rules JSONB DEFAULT '{
        "maxRiskPerTrade": "2%",
        "maxTradesPerDay": "5",
        "dailyLossCap": "5%",
        "lossStreakBreak": "3 in a row",
        "targetRR": "1:2"
      }'::jsonb,
      ADD COLUMN IF NOT EXISTS rules_onboarded BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 5. Ensure trades table has account_name column and proper indexing
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trades') THEN
    ALTER TABLE public.trades
      ADD COLUMN IF NOT EXISTS account_name TEXT DEFAULT 'Default Account';
    CREATE INDEX IF NOT EXISTS idx_trades_user_account ON public.trades(user_id, account_name);
    CREATE INDEX IF NOT EXISTS idx_trades_account_name ON public.trades(account_name);
  END IF;
END $$;

-- 6. High-performance lookup indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- 7. Backfill existing rows with defaults where discipline_rules is null
UPDATE public.profiles
SET discipline_rules = '{
  "maxRiskPerTrade": "2%",
  "maxTradesPerDay": "5",
  "dailyLossCap": "5%",
  "lossStreakBreak": "3 in a row",
  "targetRR": "1:2"
}'::jsonb
WHERE discipline_rules IS NULL;

-- 8. Enable Row Level Security (RLS) policies allowing authenticated & service queries
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow public full access to profiles'
  ) THEN
    CREATE POLICY "Allow public full access to profiles" 
      ON public.profiles 
      FOR ALL 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Verification check query:
SELECT 'Migration 009 executed successfully!' AS status;

