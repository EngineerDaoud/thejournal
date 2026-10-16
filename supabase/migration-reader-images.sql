-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Lets readers upload pictures for their "Write for us" article. They can only write into
-- the "submissions/" folder of the blog-images bucket, and only image file types.
-- (Bucket "File size limit" 10 MB and allowed MIME types should also be set in Storage settings.)

drop policy if exists "Readers can upload article images" on storage.objects;
create policy "Readers can upload article images"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'blog-images'
  and (storage.foldername(name))[1] = 'submissions'
  and lower(storage.extension(name)) in ('jpg', 'png', 'webp', 'gif', 'avif')
);

-- Cover images (with alt/title/caption) and keywords on reader submissions.
alter table submissions add column if not exists cover_image text;
alter table submissions add column if not exists cover_meta jsonb;
alter table submissions add column if not exists keywords text[] not null default '{}'::text[];

-- Same fields as the admin editor: URL slug, author picture, reading time, search intent, target audience.

alter table submissions add column if not exists slug text check (slug is null or char_length(slug) <= 120);
alter table submissions add column if not exists author_avatar text check (author_avatar is null or char_length(author_avatar) < 60000);
alter table submissions add column if not exists reading_time integer check (reading_time is null or reading_time between 1 and 240);
alter table submissions add column if not exists search_intent text;
alter table submissions add column if not exists target_audience text;