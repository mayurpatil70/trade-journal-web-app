-- Migration 014: Traders Community (Discord-style servers with invite links) and profile links. Run after 013. Idempotent.

ALTER TABLE trader_profiles ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS community_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(60) NOT NULL,
  description TEXT DEFAULT '',
  icon_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  owner_id TEXT NOT NULL,
  invite_code VARCHAR(16) NOT NULL UNIQUE,
  member_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_community_servers_public ON community_servers(is_public, member_count DESC);

CREATE TABLE IF NOT EXISTS community_server_members (
  server_id UUID NOT NULL REFERENCES community_servers(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (server_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_server_members_user ON community_server_members(user_id);

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS server_id UUID REFERENCES community_servers(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_conversations_server ON conversations(server_id);

CREATE OR REPLACE FUNCTION bump_community_member_count() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_servers SET member_count = member_count + 1 WHERE id = NEW.server_id;
  ELSE
    UPDATE community_servers SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.server_id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_community_member_count ON community_server_members;
CREATE TRIGGER trg_community_member_count AFTER INSERT OR DELETE ON community_server_members
  FOR EACH ROW EXECUTE FUNCTION bump_community_member_count();

ALTER TABLE community_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_server_members ENABLE ROW LEVEL SECURITY;
