-- Run this in your Supabase SQL editor

-- API keys table
create table if not exists api_keys (
  id            uuid primary key default gen_random_uuid(),
  key_hash      text not null unique,
  user_email    text not null,
  plan          text not null default 'free',  -- 'free' | 'pro'
  credits_used  int  not null default 0,
  credit_limit  int  not null default 100,
  created_at    timestamptz not null default now()
);

-- Screenshots audit log
create table if not exists screenshots (
  id          uuid primary key default gen_random_uuid(),
  api_key_id  uuid not null references api_keys(id) on delete cascade,
  url         text not null,
  created_at  timestamptz not null default now()
);

create index if not exists screenshots_api_key_id_idx on screenshots(api_key_id);
