-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Adds scheduled publishing: a post can wait as a draft and go live by itself at a set time.

alter table posts add column if not exists publish_at timestamptz;

-- Publishes every draft whose time has come. The post's date becomes the scheduled time.
create or replace function publish_due_posts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update posts
     set published  = true,
         created_at = publish_at,
         updated_at = now(),
         publish_at = null
   where published = false
     and publish_at is not null
     and publish_at <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on function publish_due_posts() to anon, authenticated;

-- OPTIONAL but recommended (publishes on the exact minute even if nobody visits the site):
-- 1) Supabase Dashboard -> Database -> Extensions -> enable "pg_cron"
-- 2) then run this line in the SQL editor:
-- select cron.schedule('publish-due-posts', '* * * * *', 'select publish_due_posts();');