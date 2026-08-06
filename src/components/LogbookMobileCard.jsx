'use client';

import { useState } from 'react';
import { Edit2, Trash2, Calendar, Maximize2, X, Image as ImageIcon } from 'lucide-react';
import { formatTanggalIndo } from '../lib/exportWord';

export default function LogbookMobileCard({ logbooks, onEdit, onDelete }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (logbooks.length === 0) {
    return (
      <div className="mobile-empty-state">
        <p>Belum ada data logbook. Klik tombol + di bawah untuk menambah catatan baru.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mobile-card-grid">
        {logbooks.map((item, index) => (
          <div key={item.id || index} className="mobile-logbook-card">
            {/* Top Bar: No, Week badge, and Actions */}
            <div className="mobile-card-header">
              <div className="mobile-card-meta">
                <span className="badge-no">#{index + 1}</span>
                <span className="badge-week">Minggu {item.minggu}</span>
              </div>
              
              <div className="mobile-card-actions">
                <button
                  onClick={() => onEdit(item)}
                  className="btn-icon btn-edit"
                  title="Edit Logbook"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="btn-icon btn-delete"
                  title="Hapus Logbook"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Date */}
            <div className="mobile-card-date">
              <Calendar size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>{formatTanggalIndo(item.tanggal)}</span>
            </div>

            {/* Activity Description */}
            <div className="mobile-card-kegiatan">
              <p>{item.kegiatan || 'Tidak ada deskripsi kegiatan.'}</p>
            </div>

            {/* Documentation Image */}
            {item.dokumentasi_url ? (
              <div className="mobile-card-image-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.dokumentasi_url}
                  alt={`Dokumentasi ${item.tanggal}`}
                  className="mobile-card-img"
                  onClick={() => setSelectedImage(item.dokumentasi_url)}
                />
                <button
                  onClick={() => setSelectedImage(item.dokumentasi_url)}
                  className="btn-mobile-zoom"
                >
                  <Maximize2 size={14} /> Lihat Foto
                </button>
              </div>
            ) : (
              <div className="mobile-card-no-img">
                <ImageIcon size={16} />
                <span>Tanpa foto dokumentasi</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="modal-backdrop" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="btn-lightbox-close"
              title="Tutup"
            >
              <X size={24} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedImage} alt="Foto Dokumentasi Full" className="lightbox-img" />
          </div>
        </div>
      )}
    </>
  );
}
