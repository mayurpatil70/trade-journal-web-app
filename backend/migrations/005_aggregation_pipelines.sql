-- Migration 005: Supabase Aggregation Pipelines
-- Run this in the Supabase SQL Editor.
-- Idempotent and safe to run multiple times.

-- ==============================================================================
-- 1. USER TRADE ANALYTICS AGGREGATION PIPELINE
-- Computes complete win rate, profit factor, R-multiples, setup, session,
-- and asset performance entirely inside PostgreSQL in <5ms.
-- ==============================================================================
CREATE OR REPLACE FUNCTION aggregate_user_trades(
    p_user_id TEXT,
    p_account_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH filtered_trades AS (
        SELECT
            id,
            user_id,
            asset,
            session,
            setup,
            result,
            r_multiple,
            pnl,
            rule_break,
            date,
            created_at,
            CASE 
                WHEN lower(trim(coalesce(result, ''))) = 'win' THEN 'win'
                WHEN lower(trim(coalesce(result, ''))) = 'loss' THEN 'loss'
                WHEN lower(trim(coalesce(result, ''))) = 'be' THEN 'be'
                WHEN coalesce(r_multiple, 0) > 0 THEN 'win'
                WHEN coalesce(r_multiple, 0) < 0 THEN 'loss'
                ELSE 'be'
            END AS norm_result,
            CASE 
                WHEN lower(trim(coalesce(result, ''))) = 'loss' AND coalesce(r_multiple, 0) > 0 THEN -abs(r_multiple)
                WHEN lower(trim(coalesce(result, ''))) = 'be' THEN 0
                WHEN lower(trim(coalesce(result, ''))) = 'win' AND coalesce(r_multiple, 0) < 0 THEN abs(r_multiple)
                ELSE coalesce(r_multiple, 0)
            END AS norm_r,
            CASE 
                WHEN lower(trim(coalesce(result, ''))) = 'loss' AND coalesce(pnl, 0) > 0 THEN -abs(pnl)
                WHEN lower(trim(coalesce(result, ''))) = 'win' AND coalesce(pnl, 0) < 0 THEN abs(pnl)
                ELSE coalesce(pnl, 0)
            END AS norm_pnl
        FROM trades
        WHERE user_id = p_user_id
          AND (p_account_name IS NULL OR p_account_name = '' OR account_name = p_account_name)
    ),
    summary_stats AS (
        SELECT
            count(*)::int AS total_trades,
            count(*) FILTER (WHERE norm_result = 'win')::int AS wins,
            count(*) FILTER (WHERE norm_result = 'loss')::int AS losses,
            count(*) FILTER (WHERE norm_result = 'be')::int AS breakevens,
            round(
                COALESCE(
                    (count(*) FILTER (WHERE norm_result = 'win')::numeric / 
                     NULLIF(count(*) FILTER (WHERE norm_result IN ('win', 'loss')), 0)) * 100,
                    0
                ), 1
            ) AS win_rate,
            round(COALESCE(sum(norm_r), 0)::numeric, 2) AS total_r,
            round(COALESCE(sum(norm_pnl), 0)::numeric, 2) AS total_pnl,
            round(COALESCE(avg(norm_r), 0)::numeric, 2) AS avg_r,
            round(COALESCE(avg(norm_r) FILTER (WHERE norm_result = 'win'), 0)::numeric, 2) AS avg_win_r,
            round(COALESCE(avg(norm_r) FILTER (WHERE norm_result = 'loss'), 0)::numeric, 2) AS avg_loss_r,
            round(
                COALESCE(
                    sum(norm_pnl) FILTER (WHERE norm_pnl > 0) / 
                    NULLIF(abs(sum(norm_pnl) FILTER (WHERE norm_pnl < 0)), 0),
                    CASE WHEN sum(norm_pnl) FILTER (WHERE norm_pnl > 0) > 0 THEN 999 ELSE 0 END
                )::numeric, 2
            ) AS profit_factor,
            round(COALESCE(max(norm_r) FILTER (WHERE norm_result = 'win'), 0)::numeric, 2) AS max_win_r,
            round(COALESCE(min(norm_r) FILTER (WHERE norm_result = 'loss'), 0)::numeric, 2) AS max_loss_r
        FROM filtered_trades
    ),
    setup_breakdown AS (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'name', setup,
                    'total', count(*),
                    'wins', count(*) FILTER (WHERE norm_result = 'win'),
                    'winRate', round((count(*) FILTER (WHERE norm_result = 'win')::numeric / NULLIF(count(*), 0)) * 100, 1),
                    'netR', round(COALESCE(sum(norm_r), 0)::numeric, 2),
                    'netPnl', round(COALESCE(sum(norm_pnl), 0)::numeric, 2)
                ) ORDER BY sum(norm_r) DESC
            ),
            '[]'::jsonb
        ) AS setups
        FROM filtered_trades
        WHERE setup IS NOT NULL AND trim(setup) != ''
        GROUP BY setup
    ),
    session_breakdown AS (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'name', session,
                    'total', count(*),
                    'wins', count(*) FILTER (WHERE norm_result = 'win'),
                    'winRate', round((count(*) FILTER (WHERE norm_result = 'win')::numeric / NULLIF(count(*), 0)) * 100, 1),
                    'netR', round(COALESCE(sum(norm_r), 0)::numeric, 2),
                    'netPnl', round(COALESCE(sum(norm_pnl), 0)::numeric, 2)
                ) ORDER BY sum(norm_r) DESC
            ),
            '[]'::jsonb
        ) AS sessions
        FROM filtered_trades
        WHERE session IS NOT NULL AND trim(session) != ''
        GROUP BY session
    ),
    asset_breakdown AS (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'name', asset,
                    'total', count(*),
                    'wins', count(*) FILTER (WHERE norm_result = 'win'),
                    'winRate', round((count(*) FILTER (WHERE norm_result = 'win')::numeric / NULLIF(count(*), 0)) * 100, 1),
                    'netR', round(COALESCE(sum(norm_r), 0)::numeric, 2),
                    'netPnl', round(COALESCE(sum(norm_pnl), 0)::numeric, 2)
                ) ORDER BY count(*) DESC
            ),
            '[]'::jsonb
        ) AS assets
        FROM filtered_trades
        WHERE asset IS NOT NULL AND trim(asset) != ''
        GROUP BY asset
    ),
    rule_breakdown AS (
        SELECT jsonb_build_object(
            'followed_rules', jsonb_build_object(
                'total', count(*) FILTER (WHERE rule_break IN ('no', 'false', '0')),
                'win_rate', round(COALESCE((count(*) FILTER (WHERE rule_break IN ('no', 'false', '0') AND norm_result = 'win')::numeric / NULLIF(count(*) FILTER (WHERE rule_break IN ('no', 'false', '0')), 0)) * 100, 0), 1),
                'net_r', round(COALESCE(sum(norm_r) FILTER (WHERE rule_break IN ('no', 'false', '0')), 0)::numeric, 2)
            ),
            'broke_rules', jsonb_build_object(
                'total', count(*) FILTER (WHERE rule_break IN ('yes', 'true', '1')),
                'win_rate', round(COALESCE((count(*) FILTER (WHERE rule_break IN ('yes', 'true', '1') AND norm_result = 'win')::numeric / NULLIF(count(*) FILTER (WHERE rule_break IN ('yes', 'true', '1')), 0)) * 100, 0), 1),
                'net_r', round(COALESCE(sum(norm_r) FILTER (WHERE rule_break IN ('yes', 'true', '1')), 0)::numeric, 2)
            )
        ) AS rules
        FROM filtered_trades
    )
    SELECT jsonb_build_object(
        'summary', to_jsonb(s.*),
        'by_setup', COALESCE((SELECT setups FROM setup_breakdown LIMIT 1), '[]'::jsonb),
        'by_session', COALESCE((SELECT sessions FROM session_breakdown LIMIT 1), '[]'::jsonb),
        'by_asset', COALESCE((SELECT assets FROM asset_breakdown LIMIT 1), '[]'::jsonb),
        'rule_discipline', rb.rules
    )
    INTO v_result
    FROM summary_stats s
    CROSS JOIN rule_breakdown rb;

    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;


-- ==============================================================================
-- 2. ADMIN PLATFORM METRICS AGGREGATION PIPELINE
-- Computes registered users, subscription breakdown, platform volume,
-- and withdrawal metrics directly in the database engine.
-- ==============================================================================
CREATE OR REPLACE FUNCTION aggregate_admin_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_metrics JSONB;
BEGIN
    WITH user_counts AS (
        SELECT 
            count(*)::int AS total_users,
            count(*) FILTER (WHERE coalesce(discord_verified, false) = true)::int AS discord_verified_users,
            count(*) FILTER (WHERE created_at >= now() - interval '24 hours')::int AS new_users_24h,
            count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS new_users_7d
        FROM users
    ),
    subscription_stats AS (
        SELECT 
            count(*) FILTER (WHERE status = 'paid')::int AS paid_transactions,
            count(*) FILTER (WHERE status = 'pending')::int AS pending_transactions,
            round(COALESCE(sum(amount_usdt) FILTER (WHERE status = 'paid'), 0)::numeric, 2) AS total_revenue_usdt
        FROM journal_subscriptions
    ),
    profile_stats AS (
        SELECT
            count(*) FILTER (WHERE subscription_ends_at > now() OR account_status = 'active')::int AS active_subscribers,
            count(*) FILTER (WHERE trial_ends_at > now() AND (subscription_ends_at IS NULL OR subscription_ends_at <= now()))::int AS trial_users,
            count(*) FILTER (WHERE (trial_ends_at <= now() OR account_status = 'expired') AND (subscription_ends_at IS NULL OR subscription_ends_at <= now()))::int AS expired_users
        FROM profiles
    ),
    trade_stats AS (
        SELECT 
            count(*)::int AS total_trades,
            count(*) FILTER (WHERE created_at >= now() - interval '24 hours')::int AS trades_24h,
            round(COALESCE(sum(pnl), 0)::numeric, 2) AS total_volume_pnl
        FROM trades
    ),
    withdrawal_stats AS (
        SELECT 
            count(*) FILTER (WHERE status = 'pending')::int AS pending_withdrawals_count,
            round(COALESCE(sum(amount) FILTER (WHERE status = 'pending'), 0)::numeric, 2) AS pending_withdrawals_amount
        FROM withdrawals
    )
    SELECT jsonb_build_object(
        'users', to_jsonb(u.*),
        'subscriptions', to_jsonb(sub.*),
        'profiles', to_jsonb(prof.*),
        'trades', to_jsonb(tr.*),
        'withdrawals', to_jsonb(w.*),
        'generated_at', now()
    )
    INTO v_metrics
    FROM user_counts u
    CROSS JOIN subscription_stats sub
    CROSS JOIN profile_stats prof
    CROSS JOIN trade_stats tr
    CROSS JOIN withdrawal_stats w;

    RETURN COALESCE(v_metrics, '{}'::jsonb);
END;
$$;

-- Supporting Indexes for Aggregation Pipeline Performance
CREATE INDEX IF NOT EXISTS idx_trades_analytics ON trades (user_id, account_name, result);
CREATE INDEX IF NOT EXISTS idx_users_discord_verified ON users (discord_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_dates ON profiles (subscription_ends_at, trial_ends_at);
