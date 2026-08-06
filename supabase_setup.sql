-- 1. Hapus semua policy lama di logbooks
drop policy if exists "User dapat melihat logbook sendiri" on logbooks;
drop policy if exists "User dapat menambah logbook sendiri" on logbooks;
drop policy if exists "User dapat mengubah logbook sendiri" on logbooks;
drop policy if exists "User dapat menghapus logbook sendiri" on logbooks;
drop policy if exists "Enable all for authenticated users" on logbooks;
drop policy if exists "Logbook full access" on logbooks;

-- 2. Pastikan RLS Aktif
alter table logbooks enable row level security;

-- 3. Policy Akses Bebas Error untuk Tabel Logbooks
create policy "Logbook full access" 
  on logbooks 
  for all 
  using (true) 
  with check (true);

-- 4. BUAT & ATUR IZIN STORAGE BUCKET 'dokumentasi' (UNTUK UPLOAD FOTO)
insert into storage.buckets (id, name, public)
values ('dokumentasi', 'dokumentasi', true)
on conflict (id) do update set public = true;

-- Hapus policy lama di storage.objects jika ada
drop policy if exists "Allow authenticated uploads" on storage.objects;
drop policy if exists "Allow public select" on storage.objects;
drop policy if exists "Allow full storage access" on storage.objects;

-- Berikan akses penuh upload & lihat foto di bucket 'dokumentasi'
create policy "Allow full storage access"
  on storage.objects
  for all
  using (bucket_id = 'dokumentasi')
  with check (bucket_id = 'dokumentasi');
