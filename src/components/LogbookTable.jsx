'use client';

import { useState } from 'react';
import { Edit2, Trash2, ExternalLink, X, Image as ImageIcon } from 'lucide-react';
import { formatTanggalIndo } from '../lib/exportWord';

export default function LogbookTable({ logbooks, onEdit, onDelete }) {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <>
      <div className="table-responsive-container">
        <table className="logbook-table">
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>No</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Minggu</th>
              <th style={{ width: '220px' }}>Hari/Tanggal</th>
              <th>Kegiatan / Deskripsi</th>
              <th style={{ width: '140px', maxWidth: '140px', textAlign: 'center' }}>Dokumentasi</th>
              <th className="no-print" style={{ width: '100px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {logbooks.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted">
                  Belum ada data logbook magang. Klik tombol &quot;Tambah Entri Logbook&quot; untuk menambahkan.
                </td>
              </tr>
            ) : (
              logbooks.map((item, index) => (
                <tr key={item.id || index}>
                  {/* No */}
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  
                  {/* Minggu */}
                  <td style={{ textAlign: 'center' }}>Minggu {item.minggu}</td>
                  
                  {/* Hari/Tanggal */}
                  <td>
                    <strong>{formatTanggalIndo(item.tanggal)}</strong>
                  </td>
                  
                  {/* Kegiatan */}
                  <td style={{ whiteSpace: 'pre-wrap' }}>
                    {item.kegiatan || '-'}
                  </td>
                  
                  {/* Dokumentasi */}
                  <td style={{ textAlign: 'center', width: '140px', maxWidth: '140px' }}>
                    {item.dokumentasi_url ? (
                      <div className="dokumentasi-thumb-container">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.dokumentasi_url}
                          alt={`Dokumentasi ${item.tanggal}`}
                          className="dokumentasi-thumb"
                          onClick={() => setSelectedImage(item.dokumentasi_url)}
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedImage(item.dokumentasi_url)}
                          className="btn-zoom-image"
                          title="Perbesar Gambar"
                        >
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="badge-no-img">
                        <ImageIcon size={14} style={{ marginRight: 4, display: 'inline' }} />
                        Tidak ada
                      </span>
                    )}
                  </td>
                  
                  {/* Aksi */}
                  <td className="no-print" style={{ textAlign: 'center' }}>
                    <div className="action-buttons">
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Image Lightbox Modal */}
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
