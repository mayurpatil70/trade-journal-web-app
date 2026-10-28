-- Migration 007: Create or update profiles table with trading rules, preferences, and pre-trade checklist
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- Safe and idempotent: can be executed repeatedly without errors or data loss.

-- 1. Create profiles table if it does not already exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  username TEXT UNIQUE,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  currency VARCHAR(10) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  discipline_rules JSONB DEFAULT '{
    "maxRiskPerTrade": "2%",
    "maxTradesPerDay": 5,
    "dailyLossCap": "5%",
    "lossStreakBreak": "3",
    "targetRR": "1:2",
    "preferredSessions": ["London", "New York"],
    "favoritePairs": ["EUR/USD", "GBP/USD", "XAU/USD"]
  }'::jsonb,
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

-- 2. If table already exists, safely add any missing columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS discipline_rules JSONB DEFAULT '{
  "maxRiskPerTrade": "2%",
  "maxTradesPerDay": 5,
  "dailyLossCap": "5%",
  "lossStreakBreak": "3",
  "targetRR": "1:2",
  "preferredSessions": ["London", "New York"],
  "favoritePairs": ["EUR/USD", "GBP/USD", "XAU/USD"]
}'::jsonb,
ADD COLUMN IF NOT EXISTS pre_trade_checklist JSONB DEFAULT '[
  {"id": "1", "text": "Checked higher timeframe", "checked": true, "order": 1},
  {"id": "2", "text": "Risk within limits", "checked": true, "order": 2},
  {"id": "3", "text": "Fits my trading plan", "checked": true, "order": 3},
  {"id": "4", "text": "Key levels identified", "checked": true, "order": 4},
  {"id": "5", "text": "Economic calendar checked", "checked": true, "order": 5}
]'::jsonb,
ADD COLUMN IF NOT EXISTS current_plan VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';

-- 3. Create indexes for high-speed lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

