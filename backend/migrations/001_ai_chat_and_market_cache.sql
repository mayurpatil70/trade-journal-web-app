-- Run in the Supabase SQL editor. Idempotent.

create table if not exists market_data_cache (
  cache_key  text primary key,
  payload    jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists market_data_cache_expires_idx
  on market_data_cache (expires_at);

create table if not exists chat_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_created_idx
  on chat_messages (user_id, created_at desc);

-- The backend talks to these tables with its own key; block direct client access.
alter table market_data_cache enable row level security;
alter table chat_messages enable row level security;
