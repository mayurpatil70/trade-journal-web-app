-- Migration 011: Trader Lounge social layer (profiles, follows, thought feed, real-time chat, partner deals)
-- Run in the Supabase SQL Editor. Idempotent.
-- User ids are TEXT to match trades.user_id; the AI coach already owns `chat_messages`, so lounge chat uses `lounge_messages`.

CREATE TABLE IF NOT EXISTS trader_profiles (
  user_id TEXT PRIMARY KEY,
  handle VARCHAR(30) UNIQUE,
  bio TEXT DEFAULT '',
  primary_strategy VARCHAR(40),
  prop_badges JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trader_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX IF NOT EXISTS idx_trader_follows_follower ON trader_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_trader_follows_following ON trader_follows(following_id);

CREATE TABLE IF NOT EXISTS trader_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]'::jsonb,
  trade_id TEXT,
  asset_tag VARCHAR(30),
  sentiment VARCHAR(10) CHECK (sentiment IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
  trade_result VARCHAR(4) CHECK (trade_result IN ('WIN', 'LOSS', 'BE')),
  is_setup BOOLEAN DEFAULT FALSE,
  parent_id UUID REFERENCES trader_posts(id) ON DELETE CASCADE,
  likes_count INT DEFAULT 0,
  reposts_count INT DEFAULT 0,
  replies_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trader_posts_feed ON trader_posts(created_at DESC) WHERE parent_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_trader_posts_user ON trader_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trader_posts_parent ON trader_posts(parent_id, created_at ASC);

CREATE TABLE IF NOT EXISTS trader_post_likes (
  post_id UUID REFERENCES trader_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS trader_post_reposts (
  post_id UUID REFERENCES trader_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS trader_post_bookmarks (
  post_id UUID REFERENCES trader_posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE OR REPLACE FUNCTION bump_trader_post_counter() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  v_col TEXT := TG_ARGV[0];
  v_post UUID;
  v_delta INT := CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE -1 END;
BEGIN
  IF v_col = 'replies_count' THEN
    v_post := CASE WHEN TG_OP = 'INSERT' THEN NEW.parent_id ELSE OLD.parent_id END;
  ELSE
    v_post := CASE WHEN TG_OP = 'INSERT' THEN NEW.post_id ELSE OLD.post_id END;
  END IF;
  IF v_post IS NOT NULL THEN
    EXECUTE format('UPDATE trader_posts SET %I = GREATEST(%I + $1, 0) WHERE id = $2', v_col, v_col)
      USING v_delta, v_post;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_trader_post_likes ON trader_post_likes;
CREATE TRIGGER trg_trader_post_likes AFTER INSERT OR DELETE ON trader_post_likes
  FOR EACH ROW EXECUTE FUNCTION bump_trader_post_counter('likes_count');
DROP TRIGGER IF EXISTS trg_trader_post_reposts ON trader_post_reposts;
CREATE TRIGGER trg_trader_post_reposts AFTER INSERT OR DELETE ON trader_post_reposts
  FOR EACH ROW EXECUTE FUNCTION bump_trader_post_counter('reposts_count');
DROP TRIGGER IF EXISTS trg_trader_post_replies ON trader_posts;
CREATE TRIGGER trg_trader_post_replies AFTER INSERT OR DELETE ON trader_posts
  FOR EACH ROW EXECUTE FUNCTION bump_trader_post_counter('replies_count');

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  slug VARCHAR(60) UNIQUE,
  title VARCHAR(100),
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);

CREATE TABLE IF NOT EXISTS lounge_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  is_trade_share BOOLEAN DEFAULT FALSE,
  shared_trade_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lounge_messages_conv ON lounge_messages(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS partnership_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name VARCHAR(100) NOT NULL,
  partner_type VARCHAR(30) NOT NULL CHECK (partner_type IN ('PROP_FIRM', 'REGULATED_BROKER')),
  logo_url TEXT NOT NULL,
  headline VARCHAR(255) NOT NULL,
  reward_description TEXT NOT NULL,
  promo_code VARCHAR(50),
  affiliate_url TEXT NOT NULL,
  min_rank_required INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO conversations (is_group, is_public, slug, title, description) VALUES
  (TRUE, TRUE, 'gold-scalpers', '#gold-scalpers', 'XAUUSD intraday scalps, levels and live calls'),
  (TRUE, TRUE, 'funded-traders', '#funded-traders', 'Passed a challenge? Share payouts, rules and risk plans'),
  (TRUE, TRUE, 'ict-mentorship', '#ict-mentorship', 'Liquidity, FVGs, killzones and model reviews'),
  (TRUE, TRUE, 'general', '#general', 'Open floor for every ForexNotes trader')
ON CONFLICT (slug) DO NOTHING;

-- Verified leaderboard: aggregates journal trades of traders who opted in (is_public).
CREATE OR REPLACE FUNCTION get_lounge_leaderboard(
  p_since TIMESTAMPTZ DEFAULT NULL,
  p_funded_only BOOLEAN DEFAULT FALSE,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  user_id TEXT,
  total_trades INT,
  wins INT,
  losses INT,
  win_rate NUMERIC,
  total_pnl NUMERIC,
  profit_factor NUMERIC,
  consistency_score NUMERIC,
  discipline_pct NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH t AS (
    SELECT tr.user_id,
           lower(trim(coalesce(tr.result, ''))) AS res,
           coalesce(tr.pnl, 0)::numeric AS pnl,
           coalesce(nullif(trim(tr.rule_break::text), ''), 'none') AS rule_break,
           date_trunc('day', tr.created_at) AS day
    FROM trades tr
    JOIN trader_profiles tp ON tp.user_id = tr.user_id AND tp.is_public
    WHERE (p_since IS NULL OR tr.created_at >= p_since)
      AND (NOT p_funded_only OR jsonb_array_length(coalesce(tp.prop_badges, '[]'::jsonb)) > 0)
  ),
  daily AS (
    SELECT user_id, day, sum(pnl) AS day_pnl FROM t GROUP BY user_id, day
  ),
  agg AS (
    SELECT user_id,
           count(*)::int AS total_trades,
           count(*) FILTER (WHERE res = 'win')::int AS wins,
           count(*) FILTER (WHERE res = 'loss')::int AS losses,
           sum(pnl) AS total_pnl,
           sum(pnl) FILTER (WHERE pnl > 0) AS gross_profit,
           abs(sum(pnl) FILTER (WHERE pnl < 0)) AS gross_loss,
           count(*) FILTER (WHERE lower(rule_break) IN ('none', 'no', 'false', '[]', ''))::numeric AS clean_trades
    FROM t GROUP BY user_id
  )
  SELECT a.user_id,
         a.total_trades,
         a.wins,
         a.losses,
         round(100.0 * a.wins / nullif(a.wins + a.losses, 0), 1) AS win_rate,
         round(coalesce(a.total_pnl, 0), 2) AS total_pnl,
         round(coalesce(a.gross_profit, 0) / nullif(a.gross_loss, 0), 2) AS profit_factor,
         round(100.0 * (SELECT count(*) FILTER (WHERE d.day_pnl > 0) FROM daily d WHERE d.user_id = a.user_id)
               / nullif((SELECT count(*) FROM daily d WHERE d.user_id = a.user_id), 0), 1) AS consistency_score,
         round(100.0 * a.clean_trades / nullif(a.total_trades, 0), 1) AS discipline_pct
  FROM agg a
  WHERE a.total_trades > 0
  ORDER BY total_pnl DESC
  LIMIT p_limit;
$$;

ALTER TABLE trader_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_post_reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_deals ENABLE ROW LEVEL SECURITY;
