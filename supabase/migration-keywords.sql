-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Adds keywords/tags to posts (set from the post editor, shown on the article).

alter table posts add column if not exists keywords text[] not null default '{}'::text[];