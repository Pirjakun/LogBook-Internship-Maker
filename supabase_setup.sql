-- 1. Buat Tabel Logbooks (jika belum ada)
create table if not exists logbooks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  minggu integer not null,
  tanggal text not null,
  kegiatan text not null,
  dokumentasi_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tambahkan kolom dokumentasi_url jika belum ada
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='logbooks' and column_name='dokumentasi_url') then
    alter table logbooks add column dokumentasi_url text;
  end if;
end $$;

-- 2. Hapus policy lama untuk mencegah bentrok
drop policy if exists "User dapat melihat logbook sendiri" on logbooks;
drop policy if exists "User dapat menambah logbook sendiri" on logbooks;
drop policy if exists "User dapat mengubah logbook sendiri" on logbooks;
drop policy if exists "User dapat menghapus logbook sendiri" on logbooks;
drop policy if exists "Enable all for authenticated users" on logbooks;

-- 3. Aktifkan Keamanan RLS
alter table logbooks enable row level security;

-- 4. Kebijakan Keamanan RLS (Row Level Security) yang Aman & Stabil
create policy "User dapat melihat logbook sendiri" 
  on logbooks for select 
  to authenticated 
  using (auth.uid() = user_id or user_id is null);

create policy "User dapat menambah logbook sendiri" 
  on logbooks for insert 
  to authenticated 
  with check (auth.uid() = user_id or user_id is null);

create policy "User dapat mengubah logbook sendiri" 
  on logbooks for update 
  to authenticated 
  using (auth.uid() = user_id or user_id is null);

create policy "User dapat menghapus logbook sendiri" 
  on logbooks for delete 
  to authenticated 
  using (auth.uid() = user_id or user_id is null);
