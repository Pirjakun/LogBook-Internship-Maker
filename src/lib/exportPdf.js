import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatTanggalIndo } from './exportWord';

// Load image Data URL & natural dimensions for embedding into PDF
async function fetchImageDataUrl(url) {
  try {
    if (!url) return null;
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          resolve({
            dataUrl,
            width: img.naturalWidth || 120,
            height: img.naturalHeight || 90
          });
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Could not fetch image for PDF export:', err);
    return null;
  }
}

export async function exportToPdf(logbooks, title = "LOGBOOK MAGANG") {
  // Create A4 PDF Document (Portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Title
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text(title.toUpperCase(), pageWidth / 2, 16, { align: 'center' });

  // Prepare table data & preload images
  const tableData = [];
  const imageMap = {};

  for (let i = 0; i < logbooks.length; i++) {
    const item = logbooks[i];
    let imageData = null;

    if (item.dokumentasi_url) {
      imageData = await fetchImageDataUrl(item.dokumentasi_url);
    }

    tableData.push([
      (i + 1).toString(),
      `Minggu ${item.minggu}`,
      formatTanggalIndo(item.tanggal),
      item.kegiatan || '-',
      imageData ? '' : '-'
    ]);

    if (imageData) {
      imageMap[i] = imageData;
    }
  }

  // Generate Table using jsPDF-AutoTable
  autoTable(doc, {
    startY: 22,
    head: [['No', 'Minggu', 'Hari / Tanggal', 'Kegiatan / Deskripsi', 'Dokumentasi']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 10,
      textColor: [0, 0, 0],
      lineColor: [180, 180, 180],
      lineWidth: 0.2,
      valign: 'middle',
      minCellHeight: 12
    },
    headStyles: {
      fillColor: [239, 239, 239],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      minCellHeight: 10
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },  // No
      1: { cellWidth: 22, halign: 'center' },  // Minggu
      2: { cellWidth: 40, halign: 'left' },    // Tanggal
      3: { cellWidth: 68, halign: 'left' },    // Kegiatan
      4: { cellWidth: 40, halign: 'center' }   // Dokumentasi
    },
    didParseCell: (data) => {
      // Ensure rows containing images expand height properly to 28mm
      if (data.section === 'body') {
        const rowIndex = data.row.index;
        if (imageMap[rowIndex]) {
          data.cell.styles.minCellHeight = 28;
        }
      }
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const rowIndex = data.row.index;
        const imgObj = imageMap[rowIndex];

        if (imgObj && imgObj.dataUrl) {
          const cell = data.cell;
          // Calculate proportional aspect ratio fit inside cell (max width 34mm, max height 24mm)
          const maxW = 34;
          const maxH = 24;

          const ratio = Math.min(maxW / imgObj.width, maxH / imgObj.height);
          const finalW = imgObj.width * ratio;
          const finalH = imgObj.height * ratio;

          // Center image vertically & horizontally inside the expanded cell
          const posX = cell.x + (cell.width - finalW) / 2;
          const posY = cell.y + (cell.height - finalH) / 2;

          try {
            const format = imgObj.dataUrl.includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(imgObj.dataUrl, format, posX, posY, finalW, finalH);
          } catch (e) {
            console.warn('PDF image draw error:', e);
          }
        }
      }
    }
  });

  // Save PDF using Base64 Data URL to force exact filename
  const pdfBlob = doc.output('blob');
  const fileName = `Logbook_Magang_${new Date().toISOString().slice(0, 10)}.pdf`;

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 1000);
  };
  reader.readAsDataURL(pdfBlob);
}
