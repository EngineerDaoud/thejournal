-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Adds Search Intent and Target Audience (set from the post editor, shown in black boxes on the article).

alter table posts add column if not exists search_intent text;
alter table posts add column if not exists target_audience text;