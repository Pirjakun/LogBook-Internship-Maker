import './globals.css';

export const metadata = {
  title: 'LogBook Magang - Catatan & Dokumentasi Harian',
  description: 'Aplikasi web sederhana dan ringan untuk mencatat logbook magang, upload foto dari kamera, serta export ke Word (DOCX) dan Excel (XLSX).',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
