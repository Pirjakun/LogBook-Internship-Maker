-- SQL Script Setup untuk Supabase Project (Termasuk Google Auth Support)
-- Jalankan di SQL Editor di dashboard Supabase (https://app.supabase.com)

-- 1. Buat Tabel Logbook dengan dukungan user_id
CREATE TABLE IF NOT EXISTS public.logbooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  minggu VARCHAR(50) NOT NULL,
  tanggal DATE NOT NULL,
  kegiatan TEXT,
  dokumentasi_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.logbooks ENABLE ROW LEVEL SECURITY;

-- Policies untuk pengguna terautentikasi (Auth)
DROP POLICY IF EXISTS "Allow user logbook access" ON public.logbooks;
CREATE POLICY "Allow user logbook access" ON public.logbooks 
  FOR ALL 
  USING (auth.uid() = user_id OR user_id IS NULL) 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 2. Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logbook-images', 'logbook-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy Storage
DROP POLICY IF EXISTS "Allow public read storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload storage" ON storage.objects;

CREATE POLICY "Allow public read storage" ON storage.objects FOR SELECT USING (bucket_id = 'logbook-images');
CREATE POLICY "Allow authenticated upload storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logbook-images');
CREATE POLICY "Allow authenticated delete storage" ON storage.objects FOR DELETE USING (bucket_id = 'logbook-images');
