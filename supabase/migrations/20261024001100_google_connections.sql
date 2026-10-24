-- A reader's Google Calendar connection, for printing today's birthdays.
-- Only the server (with the secret key) reads or writes it: readers have no access, so the token never reaches a browser.
create table public.google_connections (
  user_id uuid primary key references auth.users on delete cascade,
  refresh_token text not null,
  created_at timestamptz not null default now()
);

alter table public.google_connections enable row level security;
grant all on public.google_connections to service_role;
