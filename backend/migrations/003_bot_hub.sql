-- Run in the Supabase SQL editor. Idempotent. Backs the /bot-hub routes.

create table if not exists user_api_keys (
  id                uuid primary key default gen_random_uuid(),
  user_id           text not null,
  exchange          text not null default 'binance',
  api_key           text not null,
  api_secret_enc    text not null,
  api_secret_iv     text not null,
  api_secret_tag    text not null,
  label             text,
  live_enabled      boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, exchange)
);

create table if not exists hub_bot_configs (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  name          text not null,
  symbol        text not null,
  strategy_type text not null,
  params        jsonb not null,
  is_active     boolean not null default false,
  highest_price numeric not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists hub_bot_configs_user_idx on hub_bot_configs (user_id, created_at desc);

create table if not exists hub_bot_orders (
  id               uuid primary key default gen_random_uuid(),
  config_id        uuid not null references hub_bot_configs (id) on delete cascade,
  user_id          text not null,
  binance_order_id bigint,
  client_order_id  text,
  symbol           text not null,
  side             text not null,
  type             text not null,
  price            numeric not null,
  quantity         numeric not null,
  executed_qty     numeric not null default 0,
  pnl              numeric,
  status           text not null,
  parent_order_id  uuid,
  created_at       timestamptz not null default now()
);
create index if not exists hub_bot_orders_user_created_idx on hub_bot_orders (user_id, created_at desc);
create index if not exists hub_bot_orders_config_status_idx on hub_bot_orders (config_id, status);

create table if not exists hub_bot_logs (
  id         bigint generated always as identity primary key,
  config_id  uuid references hub_bot_configs (id) on delete cascade,
  user_id    text not null,
  level      text not null default 'info',
  message    text not null,
  created_at timestamptz not null default now()
);
create index if not exists hub_bot_logs_user_created_idx on hub_bot_logs (user_id, created_at desc);

create table if not exists mt5_bridges (
  user_id        text primary key,
  token_hash     text not null unique,
  token_prefix   text not null,
  mode           text not null default 'paper',
  auto_execute   boolean not null default false,
  symbols        text[] not null default '{}',
  timeframe      text not null default 'H1',
  max_risk_pct   numeric not null default 1,
  min_rr         numeric not null default 1,
  last_seen_at   timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists mt5_signals (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  symbol      text not null,
  timeframe   text not null,
  action      text not null,
  entry       numeric,
  sl          numeric,
  tp          numeric,
  status      text not null default 'pending',
  reason      text,
  created_at  timestamptz not null default now(),
  executed_at timestamptz
);
create index if not exists mt5_signals_user_created_idx on mt5_signals (user_id, created_at desc);
create index if not exists mt5_signals_user_status_idx on mt5_signals (user_id, status);

alter table user_api_keys enable row level security;
alter table hub_bot_configs enable row level security;
alter table hub_bot_orders enable row level security;
alter table hub_bot_logs enable row level security;
alter table mt5_bridges enable row level security;
alter table mt5_signals enable row level security;
