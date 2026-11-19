-- A followed story is known by its id (see withIds in lib/edition/editor.ts), not its headline, which the editor had
-- to copy exactly. Follows saved by headline can't be matched to an id, so they're dropped: readers follow again.
delete from public.followed_stories;
alter table public.followed_stories add column story_id text not null;
alter table public.followed_stories drop constraint followed_stories_pkey;
alter table public.followed_stories add primary key (user_id, story_id);
