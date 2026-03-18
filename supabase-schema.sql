-- Run this in your Supabase project → SQL Editor

create table listings (
  id          uuid default gen_random_uuid() primary key,
  url         text unique not null,
  title       text not null,
  snippet     text,
  platform    text not null,
  is_new      boolean default true,
  found_at    timestamptz default now(),
  posted_at   timestamptz
);

create index listings_platform_idx on listings(platform);
create index listings_found_at_idx on listings(found_at desc);

create table run_log (
  id          uuid default gen_random_uuid() primary key,
  ran_at      timestamptz default now(),
  found_count integer default 0,
  error_msg   text
);

create table scraper_status (
  id          integer primary key default 1,
  running     boolean default false,
  updated_at  timestamptz default now()
);

-- Seed the status row (only ever one row)
insert into scraper_status (id, running) values (1, false);
