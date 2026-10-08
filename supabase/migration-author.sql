-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Adds the "Author" column. Drafts are already admin-only via the existing RLS policies.
alter table posts add column if not exists author text;