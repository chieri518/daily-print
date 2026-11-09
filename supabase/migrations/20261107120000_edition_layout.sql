-- The web view: everything besides the text needed to draw an edition again (see Layout in lib/paper.tsx).
alter table public.editions add column layout jsonb;
