import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableCell, 
  TableRow, 
  TextRun, 
  WidthType, 
  AlignmentType,
  ImageRun,
  BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';

// Helper to convert date to Indonesian Day, DD Month YYYY
export function formatTanggalIndo(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Fetch image array buffer & calculate proportional dimensions for Word export
async function fetchImageDataAndDimensions(url, maxW = 140, maxH = 110) {
  try {
    if (!url) return null;
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // Get original image natural dimensions
    const dataUrl = URL.createObjectURL(blob);
    const dimensions = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const res = { width: img.naturalWidth || 120, height: img.naturalHeight || 90 };
        URL.revokeObjectURL(dataUrl);
        resolve(res);
      };
      img.onerror = () => {
        URL.revokeObjectURL(dataUrl);
        resolve({ width: 120, height: 90 });
      };
      img.src = dataUrl;
    });

    // Proportional aspect-ratio scaling
    const ratio = Math.min(maxW / dimensions.width, maxH / dimensions.height);
    const finalWidth = Math.round(dimensions.width * ratio);
    const finalHeight = Math.round(dimensions.height * ratio);

    return {
      buffer: arrayBuffer,
      width: finalWidth,
      height: finalHeight
    };
  } catch (err) {
    console.warn('Could not fetch image for Word export:', err);
    return null;
  }
}

export async function exportToWord(logbooks, title = "LOGBOOK MAGANG") {
  const tableRows = [];

  // Header Row
  const headers = [
    { text: "No", width: 600, align: AlignmentType.CENTER },
    { text: "Minggu", width: 1000, align: AlignmentType.CENTER },
    { text: "Hari / Tanggal", width: 2000, align: AlignmentType.LEFT },
    { text: "Kegiatan / Deskripsi", width: 4000, align: AlignmentType.LEFT },
    { text: "Dokumentasi", width: 2400, align: AlignmentType.CENTER }
  ];

  const headerCells = headers.map(h => new TableCell({
    width: { size: h.width, type: WidthType.DXA },
    shading: { fill: "EFEFEF" },
    children: [
      new Paragraph({
        alignment: h.align,
        children: [
          new TextRun({
            text: h.text,
            bold: true,
            font: "Times New Roman",
            size: 24 // 24 half-points = 12pt
          })
        ]
      })
    ]
  }));

  tableRows.push(new TableRow({ children: headerCells, tableHeader: true }));

  // Data Rows
  for (let index = 0; index < logbooks.length; index++) {
    const item = logbooks[index];
    const imageData = item.dokumentasi_url ? await fetchImageDataAndDimensions(item.dokumentasi_url) : null;

    let docCellChildren = [];
    if (imageData && imageData.buffer) {
      docCellChildren = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: imageData.buffer,
              transformation: {
                width: imageData.width,
                height: imageData.height
              }
            })
          ]
        })
      ];
    } else {
      docCellChildren = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "-",
              font: "Times New Roman",
              size: 24
            })
          ]
        })
      ];
    }

    const row = new TableRow({
      children: [
        // No
        new TableCell({
          width: { size: 600, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: (index + 1).toString(),
                  font: "Times New Roman",
                  size: 24 // 12pt
                })
              ]
            })
          ]
        }),
        // Minggu
        new TableCell({
          width: { size: 1000, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Minggu ${item.minggu}`,
                  font: "Times New Roman",
                  size: 24 // 12pt
                })
              ]
            })
          ]
        }),
        // Hari/Tanggal
        new TableCell({
          width: { size: 2000, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: formatTanggalIndo(item.tanggal),
                  font: "Times New Roman",
                  size: 24 // 12pt
                })
              ]
            })
          ]
        }),
        // Kegiatan
        new TableCell({
          width: { size: 4000, type: WidthType.DXA },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: item.kegiatan || '-',
                  font: "Times New Roman",
                  size: 24 // 12pt
                })
              ]
            })
          ]
        }),
        // Dokumentasi
        new TableCell({
          width: { size: 2400, type: WidthType.DXA },
          children: docCellChildren
        })
      ]
    });

    tableRows.push(row);
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: title.toUpperCase(),
                bold: true,
                font: "Times New Roman",
                size: 28 // 14pt for title
              })
            ]
          }),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
          })
        ]
      }
    ]
  });

  const docBlob = await Packer.toBlob(doc);
  const blob = new Blob([docBlob], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
  const fileName = `Logbook_Magang_${new Date().toISOString().slice(0, 10)}.docx`;

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
