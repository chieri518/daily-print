-- Hard terms each reader knows (marked ✓ on the Paper page), stored in lower case. They are never explained again.
create table public.known_words (
  user_id uuid not null references auth.users on delete cascade,
  word text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, word)
);

alter table public.known_words enable row level security;
grant select, insert on public.known_words to authenticated;
grant all on public.known_words to service_role;

create policy "Readers see their own known words" on public.known_words for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "Readers add their own known words" on public.known_words for insert
  to authenticated with check ((select auth.uid()) = user_id);
