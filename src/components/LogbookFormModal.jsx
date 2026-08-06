'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import CameraCaptureModal from './CameraCaptureModal';
import { uploadDokumentasi, validateImageFile } from '../lib/supabaseClient';

export default function LogbookFormModal({ isOpen, onClose, onSave, initialData }) {
  const [minggu, setMinggu] = useState('1');
  const [tanggal, setTanggal] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setMinggu(initialData.minggu || '1');
      setTanggal(initialData.tanggal || '');
      setKegiatan(initialData.kegiatan || '');
      setImagePreview(initialData.dokumentasi_url || '');
      setImageFile(null);
    } else {
      setMinggu('1');
      setTanggal(new Date().toISOString().slice(0, 10));
      setKegiatan('');
      setImageFile(null);
      setImagePreview('');
    }
    setError('');
    setIsDragging(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const processSelectedFile = (file) => {
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      setImageFile(null);
      return;
    }

    setError('');
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleCameraCapture = (file, previewUrl) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    setError('');
    setImageFile(file);
    setImagePreview(previewUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!minggu) {
      setError('Minggu wajib diisi');
      return;
    }
    if (!tanggal) {
      setError('Hari/Tanggal wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      let dokumentasiUrl = imagePreview || '';

      if (imageFile) {
        dokumentasiUrl = await uploadDokumentasi(imageFile);
      }

      await onSave({
        id: initialData?.id,
        minggu: minggu.toString(),
        tanggal,
        kegiatan,
        dokumentasi_url: dokumentasiUrl
      });

      onClose();
    } catch (err) {
      console.error('Save failed:', err);
      setError(err.message || 'Gagal menyimpan data logbook.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop">
        <div className="modal-content form-modal">
          <div className="modal-header">
            <h3 className="modal-title">
              {initialData ? 'Edit Entri Logbook' : 'Tambah Entri Logbook Baru'}
            </h3>
            <button onClick={onClose} className="btn-icon" aria-label="Tutup">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body space-y-4">
              {error && (
                <div className="alert-error" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Minggu ke-</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={minggu}
                    onChange={(e) => setMinggu(e.target.value)}
                    className="form-input"
                    placeholder="Contoh: 1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hari / Tanggal</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Kegiatan / Deskripsi Pekerjaan</label>
                <textarea
                  value={kegiatan}
                  onChange={(e) => setKegiatan(e.target.value)}
                  className="form-textarea"
                  rows={4}
                  placeholder="Tuliskan detail aktivitas atau tugas magang pada hari tersebut..."
                />
              </div>

              {/* Upload Foto (Opsional) */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Dokumentasi Foto</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                    (Opsional / Boleh Dikosongkan)
                  </span>
                </label>
                
                {/* Symmetrical Upload Buttons */}
                <div className="image-upload-actions">
                  {/* File Input Trigger */}
                  <label className="btn btn-secondary cursor-pointer">
                    <Upload size={16} /> Upload Gambar
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {/* Web Camera Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="btn btn-secondary"
                  >
                    <Camera size={16} /> Ambil dari Kamera
                  </button>
                </div>

                {/* Preview Box or Drag & Drop Zone */}
                {imagePreview ? (
                  <div className="image-preview-wrapper mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Preview Dokumentasi" className="image-preview-img" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      className="btn-remove-image"
                      title="Hapus Foto"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`image-preview-placeholder mt-3 ${isDragging ? 'is-dragging' : ''}`}
                  >
                    <ImageIcon size={28} style={{ opacity: isDragging ? 0.8 : 0.4 }} />
                    <span>
                      {isDragging ? 'Lepaskan foto di sini...' : 'Tarik & lepas foto di sini (Drag & Drop) atau klik untuk memilih'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer mt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  'Simpan Logbook'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  );
}
