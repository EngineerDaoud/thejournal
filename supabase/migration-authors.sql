-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Lets each Article"owner" (the Author field in the post editor) have their own
-- picture. The picture is stored small (a data URL), so no Storage bucket is
-- needed. Picking the same owner again always shows their saved picture.

create table if not exists authors (
  name text primary key,
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table authors enable row level security;

create policy "Public can read author pictures"
on authors for select
using (true);

create policy "Admin can add author pictures"
on authors for insert
with check (auth.jwt() ->> 'email' = 'muhammaddaoud207@gmail.com');

create policy "Admin can update author pictures"
on authors for update
using (auth.jwt() ->> 'email' = 'muhammaddaoud207@gmail.com');