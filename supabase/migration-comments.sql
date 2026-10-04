-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Adds reader comments. A new comment is saved with approved = false, so it is
-- NOT visible on the site until you approve it in /admin/comments.
--
-- NOTE: replace the email below if your admin login email ever changes.
--       (This is the login email, the same one used in migration-categories.sql.)

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  post_slug text not null,
  post_title text,
  name text not null,
  email text not null,
  body text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on comments (post_id, approved, created_at desc);
create index if not exists comments_slug_idx on comments (post_slug, approved, created_at desc);

alter table comments enable row level security;

-- Anyone may leave a comment, but only as "not approved yet".
create policy "Anyone can leave a comment"
on comments for insert
with check (approved = false);

-- The public only ever sees comments you approved.
create policy "Public can read approved comments"
on comments for select
using (approved = true);

-- You (the admin) can see every comment, including the pending ones.
create policy "Admin can read all comments"
on comments for select
using (auth.jwt() ->> 'email' = 'muhammaddaoud207@gmail.com');

create policy "Admin can update comments"
on comments for update
using (auth.jwt() ->> 'email' = 'muhammaddaoud207@gmail.com');

create policy "Admin can delete comments"
on comments for delete
using (auth.jwt() ->> 'email' = 'muhammaddaoud207@gmail.com');