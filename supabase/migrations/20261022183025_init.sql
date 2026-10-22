-- Each reader's paper settings, stored as the Settings object from lib/editor.ts.
create table public.papers (
  user_id uuid primary key references auth.users on delete cascade,
  settings jsonb not null,
  updated_at timestamptz not null default now()
);

-- One row per edition. The PDF is stored at editions/{user_id}/{id}.pdf.
create table public.editions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  status text not null default 'writing' check (status in ('writing', 'ready', 'failed')),
  content jsonb, -- the edition's text and sources
  cost_usd numeric(8, 4),
  error text,
  created_at timestamptz not null default now()
);
create index editions_user_id_created_at on public.editions (user_id, created_at desc);

alter table public.papers enable row level security;
alter table public.editions enable row level security;

grant select, insert, update on public.papers to authenticated;
grant select, insert on public.editions to authenticated;
grant all on public.papers, public.editions to service_role;

create policy "Readers see their own paper" on public.papers for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "Readers create their own paper" on public.papers for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "Readers update their own paper" on public.papers for update
  to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Readers see their own editions" on public.editions for select
  to authenticated using ((select auth.uid()) = user_id);
-- Readers only start editions. The workflow fills them in with the secret key.
create policy "Readers start their own editions" on public.editions for insert
  to authenticated with check ((select auth.uid()) = user_id and status = 'writing');

-- Private bucket for PDFs. Readers can read files in their own folder; only the workflow writes.
insert into storage.buckets (id, name, public) values ('editions', 'editions', false);

create policy "Readers read their own PDFs" on storage.objects for select
  to authenticated using (bucket_id = 'editions' and (storage.foldername(name))[1] = (select auth.uid())::text);
