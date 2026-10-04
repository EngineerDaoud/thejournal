-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Adds a view counter so the Blog page can show the most-viewed (trending) posts.

alter table posts add column if not exists views integer not null default 0;

-- Readers are not logged in, so they cannot UPDATE posts directly.
-- This small function is the only thing they may call: it adds +1 to one published post.
create or replace function increment_post_views(post_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update posts set views = views + 1
  where slug = post_slug and published = true;
$$;

grant execute on function increment_post_views(text) to anon, authenticated;