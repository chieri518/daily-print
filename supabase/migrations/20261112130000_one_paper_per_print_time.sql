-- One paper per print time. Saving settings and the daily scheduler can schedule the same paper at the same moment;
-- this makes the second one fail instead of making (and paying for) two papers.
create unique index editions_one_per_print_time on public.editions (user_id, print_at)
  where status in ('scheduled', 'writing', 'ready');
