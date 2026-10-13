-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Stores the alt text / title / caption of each cover image (keyed by the image URL).
-- Images inside the article body keep theirs inside the post content, so nothing else is needed.

alter table posts add column if not exists cover_meta jsonb;