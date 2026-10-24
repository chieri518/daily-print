-- Readers can stop an edition while it's being written. The edition workflow checks the status before each step.
alter table public.editions drop constraint editions_status_check;
alter table public.editions add constraint editions_status_check check (status in ('writing', 'ready', 'failed', 'stopped'));
