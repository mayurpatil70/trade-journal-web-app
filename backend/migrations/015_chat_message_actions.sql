-- Migration 015: chat replies, forwards, edits, unsend and @mentions (run after 014). Idempotent.
ALTER TABLE lounge_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES lounge_messages(id) ON DELETE SET NULL;
ALTER TABLE lounge_messages ADD COLUMN IF NOT EXISTS is_forwarded BOOLEAN DEFAULT FALSE;
ALTER TABLE lounge_messages ADD COLUMN IF NOT EXISTS mentions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lounge_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE lounge_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
