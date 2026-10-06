-- Run in the Supabase SQL editor. Idempotent.

create table if not exists bot_configs (
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
create index if not exists bot_configs_user_idx on bot_configs (user_id, created_at desc);

create table if not exists bot_orders (
  id               uuid primary key default gen_random_uuid(),
  config_id        uuid not null references bot_configs (id) on delete cascade,
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
create index if not exists bot_orders_user_created_idx on bot_orders (user_id, created_at desc);
create index if not exists bot_orders_config_status_idx on bot_orders (config_id, status);

create table if not exists bot_logs (
  id         bigint generated always as identity primary key,
  config_id  uuid references bot_configs (id) on delete cascade,
  user_id    text not null,
  level      text not null default 'info',
  message    text not null,
  created_at timestamptz not null default now()
);
create index if not exists bot_logs_user_created_idx on bot_logs (user_id, created_at desc);

alter table bot_configs enable row level security;
alter table bot_orders enable row level security;
alter table bot_logs enable row level security;
