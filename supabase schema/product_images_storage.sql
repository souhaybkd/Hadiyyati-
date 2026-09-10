-- Product images bucket + policies for Hadiyyati
-- Run in Supabase Dashboard → SQL Editor (production project).
-- The app also creates/updates this bucket via the service role if it is missing,
-- but policies for client-side uploads still need to be applied here.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
on storage.objects for select
using (bucket_id = 'product-images');

drop policy if exists "Users upload own product images" on storage.objects;
create policy "Users upload own product images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own product images" on storage.objects;
create policy "Users update own product images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users delete own product images" on storage.objects;
create policy "Users delete own product images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
