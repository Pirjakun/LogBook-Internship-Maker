import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatTanggalIndo } from './exportWord';

export async function exportToExcel(logbooks, title = "LOGBOOK MAGANG") {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Logbook Magang');

  // Title Row
  worksheet.mergeCells('A1:E1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title.toUpperCase();
  titleCell.font = { name: 'Times New Roman', size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Empty row
  worksheet.getRow(2).height = 10;

  // Header Row (Row 3)
  const headers = ['No', 'Minggu', 'Hari / Tanggal', 'Kegiatan / Deskripsi', 'Dokumentasi'];
  const headerRow = worksheet.getRow(3);
  headerRow.values = headers;
  headerRow.height = 25;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Times New Roman', size: 12, bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEFEFEF' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Set Column Widths
  worksheet.columns = [
    { key: 'no', width: 8 },
    { key: 'minggu', width: 14 },
    { key: 'tanggal', width: 28 },
    { key: 'kegiatan', width: 50 },
    { key: 'dokumentasi', width: 35 }
  ];

  // Data Rows
  logbooks.forEach((item, index) => {
    const rowNumber = index + 4;
    const row = worksheet.getRow(rowNumber);
    
    row.values = [
      index + 1,
      `Minggu ${item.minggu}`,
      formatTanggalIndo(item.tanggal),
      item.kegiatan || '-',
      item.dokumentasi_url || '-'
    ];

    row.height = 35;

    // Apply Styles (Times New Roman 12 pt)
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }; // No
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }; // Minggu
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; // Tanggal
    row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; // Kegiatan
    row.getCell(5).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }; // Dokumentasi URL

    row.eachCell((cell) => {
      cell.font = { name: 'Times New Roman', size: 12, bold: false };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Write buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const fileName = `Logbook_Magang_${new Date().toISOString().slice(0, 10)}.xlsx`;

  // Use FileReader Data URL to prevent Chrome/Edge from falling back to Blob UUID filename
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
  reader.readAsDataURL(blob);
}
