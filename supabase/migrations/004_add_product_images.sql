alter table public.products
add column if not exists image_path text;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists
  "Merchants can upload product images"
on storage.objects;

create policy
  "Merchants can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] =
    (select auth.uid()::text)
);

drop policy if exists
  "Merchants can view their product image objects"
on storage.objects;

create policy
  "Merchants can view their product image objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'product-images'
  and owner_id = (select auth.uid()::text)
);

drop policy if exists
  "Merchants can delete their product images"
on storage.objects;

create policy
  "Merchants can delete their product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and owner_id = (select auth.uid()::text)
);