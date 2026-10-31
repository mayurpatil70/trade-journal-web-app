-- 016: Brokers on trader profiles, username backfill, orphan follow cleanup.
-- Safe to re-run. Run each statement separately in the Supabase SQL editor.

ALTER TABLE public.trader_profiles
  ADD COLUMN IF NOT EXISTS brokers JSONB DEFAULT '[]'::jsonb;

UPDATE public.users u
SET username = lower(p.username)
FROM public.profiles p
WHERE p.id::text = u.id::text
  AND u.username IS NULL
  AND p.username ~ '^[A-Za-z0-9_.]{3,20}$'
  AND NOT EXISTS (SELECT 1 FROM public.users x WHERE lower(x.username) = lower(p.username))
  AND (SELECT count(*) FROM public.profiles p2 WHERE lower(p2.username) = lower(p.username)) = 1;

DELETE FROM public.trader_follows f
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = f.follower_id)
   OR NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id::text = f.following_id);
