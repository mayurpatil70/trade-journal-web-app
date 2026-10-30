-- 012: Email/phone + password registration and login.
-- Safe to re-run. Magic-link users keep working (password_hash stays NULL).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;

-- Case-insensitive unique username; phone stored as E.164 (+<country code><number>).
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key
  ON public.users (lower(username)) WHERE username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_key
  ON public.users (phone) WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_email_lower_idx
  ON public.users (lower(email));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_e164_chk'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_phone_e164_chk CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{7,14}$');
  END IF;
END $$;

