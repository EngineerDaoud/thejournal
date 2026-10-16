-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Reader articles: anyone can SEND an article for approval. It is saved as "pending" and is
-- NOT on the site. Only the admin can see it (with the email), approve it, or reject it.

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 5 and 160),
  author_name text not null check (char_length(author_name) between 2 and 80),
  email text not null check (char_length(email) between 5 and 160),
  country text,
  tldr text check (tldr is null or char_length(tldr) <= 600),
  category text not null check (char_length(category) between 1 and 80),
  excerpt text check (excerpt is null or char_length(excerpt) <= 300),
  content jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notified boolean not null default false,
  post_id uuid,
  created_at timestamptz not null default now()
);

-- (if the table already exists from an earlier run, this adds the missing column)
alter table submissions add column if not exists country text;
alter table submissions add column if not exists tldr text;

create index if not exists submissions_status_idx on submissions (status, created_at desc);

alter table submissions enable row level security;

-- Anyone may send an article, but only as "pending". Nobody can read the table from the website.
drop policy if exists "Anyone can send an article" on submissions;
create policy "Anyone can send an article"
on submissions for insert
with check (status = 'pending' and notified = false and post_id is null);

drop policy if exists "Admin can read submissions" on submissions;
create policy "Admin can read submissions"
on submissions for select
using (is_admin());

drop policy if exists "Admin can update submissions" on submissions;
create policy "Admin can update submissions"
on submissions for update
using (is_admin());

drop policy if exists "Admin can delete submissions" on submissions;
create policy "Admin can delete submissions"
on submissions for delete
using (is_admin());

-- Spam guard: 3 articles per email per day, and 30 per hour for the whole site.
create or replace function limit_submissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.email := lower(trim(new.email));
  if (select count(*) from submissions
        where email = new.email and created_at > now() - interval '24 hours') >= 3 then
    raise exception 'You have already sent several articles today. Please try again tomorrow.';
  end if;
  if (select count(*) from submissions where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Too many articles are being sent right now. Please try again later.';
  end if;
  return new;
end;
$$;

drop trigger if exists limit_submissions_trigger on submissions;
create trigger limit_submissions_trigger
before insert on submissions
for each row execute function limit_submissions();