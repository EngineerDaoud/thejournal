-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Adds categories + subcategories (used by the Articledropdown in the navbar).

alter table posts add column if not exists subcategory text;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references categories(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- No duplicate names on the same level.
create unique index if not exists categories_unique_name
on categories (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

alter table categories enable row level security;

create policy "Public can read categories"
on categories for select
using (true);

create policy "Admin can insert categories"
on categories for insert
with check (auth.jwt() ->> 'email' = 'muhammaddaoud207@gmail.com');

create policy "Admin can update categories"
on categories for update
using (auth.jwt() ->> 'email' = 'muhammaddaoud207@gmail.com');

create policy "Admin can delete categories"
on categories for delete
using (auth.jwt() ->> 'email' = 'muhammaddaoud207@gmail.com');

-- Bring in the categories your posts already use.
insert into categories (name)
select distinct trim(category) from posts
where category is not null and trim(category) <> ''
on conflict do nothing;