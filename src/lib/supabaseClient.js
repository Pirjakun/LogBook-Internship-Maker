import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Initial Mock Data if using local storage
const INITIAL_MOCK_DATA = [
  {
    id: '1',
    minggu: '1',
    tanggal: '2026-08-03',
    kegiatan: 'Orientasi tempat magang, pengenalan tim pengembang, dan setup environment project.',
    dokumentasi_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    minggu: '1',
    tanggal: '2026-08-04',
    kegiatan: 'Mempelajari arsitektur sistem pendukung keputusan dan struktur database perusahaan.',
    dokumentasi_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    minggu: '1',
    tanggal: '2026-08-05',
    kegiatan: 'Perancangan antarmuka pengguna (UI/UX) web logbook magang dan diskusi dengan supervisor.',
    dokumentasi_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80',
    created_at: new Date().toISOString(),
  }
];

// File Validation Helper (Images only, max 5MB)
export function validateImageFile(file) {
  if (!file) return { valid: true };

  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];

  // Check type
  const isImageMime = file.type ? ALLOWED_TYPES.includes(file.type.toLowerCase()) : false;
  const isImageExt = /\.(jpe?g|png|webp|gif|heic)$/i.test(file.name);

  if (!isImageMime && !isImageExt) {
    return {
      valid: false,
      error: `Format file "${file.name}" tidak didukung. Harap upload file gambar (.jpg, .png, .webp, .gif).`
    };
  }

  // Check size
  if (file.size > MAX_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Ukuran file terlalu besar (${sizeInMB} MB). Maksimal ukuran file foto adalah ${MAX_SIZE_MB} MB.`
    };
  }

  return { valid: true };
}

// Google Authentication Helpers
export async function signInWithGoogle() {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
      }
    });
    if (error) throw error;
  } else {
    // Mock Login for Demo Mode
    const mockUser = {
      id: 'demo-user-123',
      email: 'peserta.magang@gmail.com',
      user_metadata: {
        full_name: 'Peserta Magang Demo',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
      }
    };
    localStorage.setItem('logbook_demo_user', JSON.stringify(mockUser));
    return mockUser;
  }
}

export async function signOutUser() {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } else {
    localStorage.removeItem('logbook_demo_user');
  }
}

export async function getCurrentUser() {
  if (isSupabaseConfigured && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } else {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('logbook_demo_user');
    return stored ? JSON.parse(stored) : null;
  }
}

// Get Logbooks Data
export async function getLogbooks() {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('logbooks')
      .select('*')
      .order('tanggal', { ascending: true })
      .order('minggu', { ascending: true });

    if (error) {
      console.error('Error fetching from Supabase:', error);
      throw error;
    }
    return data || [];
  } else {
    if (typeof window === 'undefined') return INITIAL_MOCK_DATA;
    const stored = localStorage.getItem('logbook_data');
    if (!stored) {
      localStorage.setItem('logbook_data', JSON.stringify(INITIAL_MOCK_DATA));
      return INITIAL_MOCK_DATA;
    }
    return JSON.parse(stored);
  }
}

// Save/Add Logbook Entry
export async function saveLogbook(entry) {
  const currentUser = await getCurrentUser();
  const userId = currentUser ? currentUser.id : null;

  if (isSupabaseConfigured && supabase) {
    if (entry.id && typeof entry.id === 'string' && entry.id.length > 10) {
      // Update
      const { data, error } = await supabase
        .from('logbooks')
        .update({
          minggu: entry.minggu,
          tanggal: entry.tanggal,
          kegiatan: entry.kegiatan,
          dokumentasi_url: entry.dokumentasi_url,
        })
        .eq('id', entry.id)
        .select();

      if (error) throw error;
      return data[0];
    } else {
      // Insert
      const { data, error } = await supabase
        .from('logbooks')
        .insert([{
          user_id: userId,
          minggu: entry.minggu,
          tanggal: entry.tanggal,
          kegiatan: entry.kegiatan,
          dokumentasi_url: entry.dokumentasi_url,
        }])
        .select();

      if (error) throw error;
      return data[0];
    }
  } else {
    // LocalStorage Fallback
    const list = await getLogbooks();
    let updatedList;
    if (entry.id) {
      updatedList = list.map(item => item.id === entry.id ? { ...item, ...entry } : item);
    } else {
      const newEntry = {
        ...entry,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      };
      updatedList = [...list, newEntry];
    }
    localStorage.setItem('logbook_data', JSON.stringify(updatedList));
    return entry;
  }
}

// Delete Logbook Entry
export async function deleteLogbook(id) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('logbooks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } else {
    const list = await getLogbooks();
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem('logbook_data', JSON.stringify(filtered));
  }
}

// Upload Image
export async function uploadDokumentasi(file) {
  if (!file) return '';

  // Perform validation first
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (isSupabaseConfigured && supabase) {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { error: uploadError } = await supabase
      .storage
      .from('dokumentasi')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading image to Supabase Storage:', uploadError);
      throw uploadError;
    }

    const { data: publicUrlData } = supabase
      .storage
      .from('dokumentasi')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } else {
    // Return Base64 Data URL for Local Storage Mode
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
