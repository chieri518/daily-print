-- Stories a reader follows with + on the Paper page. The edition workflow researches updates on them for Your Desk.
-- A story is known by its headline, as the editor wrote it; the deck tells the researcher what it's about.
create table public.followed_stories (
  user_id uuid not null references auth.users on delete cascade,
  headline text not null,
  deck text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, headline)
);

alter table public.followed_stories enable row level security;
grant select, insert, delete on public.followed_stories to authenticated;
grant all on public.followed_stories to service_role;

create policy "Readers see the stories they follow" on public.followed_stories for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "Readers follow stories" on public.followed_stories for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "Readers stop following stories" on public.followed_stories for delete
  to authenticated using ((select auth.uid()) = user_id);
