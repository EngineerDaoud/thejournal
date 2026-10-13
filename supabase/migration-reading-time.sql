-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Adds the "estimated reading time" (in minutes) that the admin types for each post.

alter table posts add column if not exists reading_time integer;