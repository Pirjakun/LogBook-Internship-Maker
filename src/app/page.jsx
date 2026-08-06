'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  BookOpen, 
  Search, 
  Filter, 
  Loader2,
  LayoutGrid,
  Table as TableIcon,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  Download
} from 'lucide-react';
import { 
  getLogbooks, 
  saveLogbook, 
  deleteLogbook, 
  isSupabaseConfigured,
  getCurrentUser,
  signInWithGoogle,
  signOutUser 
} from '../lib/supabaseClient';
import { exportToWord } from '../lib/exportWord';
import { exportToExcel } from '../lib/exportExcel';
import LogbookTable from '../components/LogbookTable';
import LogbookMobileCard from '../components/LogbookMobileCard';
import LogbookFormModal from '../components/LogbookFormModal';

export default function HomePage() {
  const [logbooks, setLogbooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Load User & Data
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const data = await getLogbooks();
        setLogbooks(data);
      }
    } catch (err) {
      console.error('Error loading logbooks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Auto switch to card view on small screens
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('card');
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        setUser(loggedUser);
        const data = await getLogbooks();
        setLogbooks(data);
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Gagal login: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    setLogbooks([]);
  };

  // Available Weeks list
  const weeksList = useMemo(() => {
    const weeksSet = new Set(logbooks.map(item => item.minggu));
    return Array.from(weeksSet).sort((a, b) => Number(a) - Number(b));
  }, [logbooks]);

  // Filtered Logbooks
  const filteredLogbooks = useMemo(() => {
    return logbooks.filter(item => {
      const matchWeek = selectedWeek === 'all' || item.minggu.toString() === selectedWeek.toString();
      const matchSearch = !searchQuery || (item.kegiatan && item.kegiatan.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchWeek && matchSearch;
    });
  }, [logbooks, selectedWeek, searchQuery]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (entryData) => {
    await saveLogbook(entryData);
    const data = await getLogbooks();
    setLogbooks(data);
  };

  const handleDeleteEntry = async (id) => {
    if (!id) return;
    const isConfirmed = confirm('Apakah Anda yakin ingin menghapus catatan logbook ini?');
    if (!isConfirmed) return;

    try {
      setLogbooks(prev => prev.filter(item => item.id !== id));
      await deleteLogbook(id);
      const data = await getLogbooks();
      setLogbooks(data);
    } catch (err) {
      console.error('Error deleting logbook entry:', err);
      alert('Gagal menghapus entri: ' + (err.message || 'Terjadi kesalahan'));
      const data = await getLogbooks();
      setLogbooks(data);
    }
  };

  const handleExportWord = async () => {
    try {
      setIsExportingWord(true);
      await exportToWord(filteredLogbooks);
    } catch (err) {
      console.error('Export Word Error:', err);
      alert('Gagal mengeksport file Word. ' + err.message);
    } finally {
      setIsExportingWord(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      await exportToExcel(filteredLogbooks);
    } catch (err) {
      console.error('Export Excel Error:', err);
      alert('Gagal mengeksport file Excel. ' + err.message);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportSelect = (e) => {
    const value = e.target.value;
    if (value === 'word') {
      handleExportWord();
    } else if (value === 'excel') {
      handleExportExcel();
    }
    e.target.value = ''; // reset dropdown
  };

  // ==========================================
  // DIRECT LOGIN SCREEN GATE (WHEN NOT LOGGED IN)
  // ==========================================
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
          <p style={{ fontWeight: 600 }}>Memuat LogBook Magang...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-landing-container">
        <div className="login-landing-card">
          <div className="login-landing-icon">
            <BookOpen size={36} style={{ color: 'white' }} />
          </div>

          <h1 className="login-landing-title">LogBook Magang</h1>
          <p className="login-landing-subtitle">
            Aplikasi pencatatan kegiatan harian magang yang dapat langsung di-export ke format Word dan Excel.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="btn btn-google-auth"
              style={{ boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)', height: '48px' }}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Menghubungkan Google...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Masuk dengan Google
                </>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
            <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
            Penyimpanan aman dengan Supabase Cloud
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN DASHBOARD (WHEN LOGGED IN)
  // ==========================================
  return (
    <div>
      {/* Header */}
      <header className="app-header">
        <div className="container header-flex">
          <div>
            <h1 className="app-title">
              <BookOpen size={24} style={{ color: 'var(--primary)' }} />
              LogBook Magang
            </h1>
            <p className="app-subtitle">
              Catatan & Dokumentasi Harian
            </p>
          </div>

          {/* User Profile Info & Logout */}
          <div className="user-profile-bar">
            {user.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt="User Avatar"
                className="user-avatar-img"
              />
            ) : (
              <div className="user-avatar-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', color: 'var(--primary)' }}>
                <UserIcon size={18} />
              </div>
            )}

            <div className="user-info">
              <span className="user-name">{user.user_metadata?.full_name || 'Peserta Magang'}</span>
              <span className="user-email">{user.email}</span>
            </div>

            <button
              onClick={handleSignOut}
              className="btn-icon btn-delete"
              title="Keluar / Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="container">
        {/* Perfectly Fitted Mobile Toolbar Card */}
        <div className="toolbar-card">
          {/* Top Row: View Mode & Export Dropdown */}
          <div className="toolbar-row">
            {/* View Mode: Card vs Table */}
            <div className="view-switcher-pill">
              <button
                onClick={() => setViewMode('card')}
                className={`btn-pill ${viewMode === 'card' ? 'active' : ''}`}
                title="Tampilan Kartu"
              >
                <LayoutGrid size={14} />
                <span className="btn-pill-label">Kartu</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`btn-pill ${viewMode === 'table' ? 'active' : ''}`}
                title="Tampilan Tabel"
              >
                <TableIcon size={14} />
                <span className="btn-pill-label">Tabel</span>
              </button>
            </div>

            {/* Compact Export Select Dropdown */}
            <div className="export-select-wrapper">
              <Download size={14} className="export-select-icon" />
              <select
                onChange={handleExportSelect}
                defaultValue=""
                className="custom-select export-select-input"
                disabled={isExportingWord || isExportingExcel || filteredLogbooks.length === 0}
              >
                <option value="" disabled hidden>
                  {isExportingWord ? 'Proses Word...' : isExportingExcel ? 'Proses Excel...' : 'Export'}
                </option>
                <option value="word">📄 Export Word (.docx)</option>
                <option value="excel">📊 Export Excel (.xlsx)</option>
              </select>
            </div>
          </div>

          {/* Bottom Row: Search Box & Week Filter Select */}
          <div className="toolbar-row">
            <div className="search-box-wrapper">
              <Search size={14} className="search-box-icon" />
              <input
                type="text"
                placeholder="Cari kegiatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-box-input"
              />
            </div>

            <div className="filter-select-wrapper">
              <Filter size={14} className="filter-box-icon" />
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="custom-select filter-box-select"
              >
                <option value="all">Semua Mgg</option>
                {weeksList.map(w => (
                  <option key={w} value={w}>Mgg {w}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* View Layout Rendering */}
        {viewMode === 'card' ? (
          <LogbookMobileCard
            logbooks={filteredLogbooks}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteEntry}
          />
        ) : (
          <LogbookTable
            logbooks={filteredLogbooks}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteEntry}
          />
        )}
      </main>

      {/* Floating Action Button (FAB) for adding logbook */}
      <button
        onClick={handleOpenAddModal}
        className="btn-fab"
        title="Tambah Logbook Baru"
        aria-label="Tambah Logbook Baru"
      >
        <Plus size={28} />
      </button>

      {/* Logbook Entry Form Modal */}
      <LogbookFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEntry}
        initialData={editingEntry}
      />
    </div>
  );
}
