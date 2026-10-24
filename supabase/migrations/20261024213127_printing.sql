-- Automatic printing: scheduled editions, what the printer box did with them, and stopping an edition.

-- An edition can wait for its print time ("scheduled") and be stopped by the reader ("stopped").
-- The edition workflow checks the status before each step, so this column is the only way to control it.
alter table public.editions drop constraint editions_status_check;
alter table public.editions add constraint editions_status_check
  check (status in ('scheduled', 'writing', 'ready', 'failed', 'stopped'));

-- For papers made for the printer box: when to print, and what happened.
alter table public.editions
  add column print_at timestamptz,
  add column printed_at timestamptz,
  add column print_error text;

-- Each reader's printer box. Only a hash of its key is kept, so a stolen database can't print papers.
-- Only the server (with the secret key) reads or writes it.
create table public.printers (
  user_id uuid primary key references auth.users on delete cascade,
  key_hash text not null unique,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.printers enable row level security;
grant all on public.printers to service_role;
