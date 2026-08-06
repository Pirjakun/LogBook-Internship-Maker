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

// Fetch image array buffer for embedding into DOCX
async function fetchImageBuffer(url) {
  try {
    if (!url) return null;
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return arrayBuffer;
  } catch (err) {
    console.warn('Could not fetch image for Word export:', err);
    return null;
  }
}

export async function exportToWord(logbooks, title = "LOGBOOK MAGANG") {
  const tableRows = [];

  // Header Row
  const headers = [
    { text: "No", width: 800, align: AlignmentType.CENTER },
    { text: "Minggu", width: 1200, align: AlignmentType.CENTER },
    { text: "Hari / Tanggal", width: 2200, align: AlignmentType.LEFT },
    { text: "Kegiatan / Deskripsi", width: 3800, align: AlignmentType.LEFT },
    { text: "Dokumentasi", width: 2000, align: AlignmentType.CENTER }
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
    const imageBuffer = item.dokumentasi_url ? await fetchImageBuffer(item.dokumentasi_url) : null;

    let docCellChildren = [];
    if (imageBuffer) {
      docCellChildren = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: imageBuffer,
              transformation: {
                width: 100,
                height: 75
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
          width: { size: 800, type: WidthType.DXA },
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
          width: { size: 1200, type: WidthType.DXA },
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
          width: { size: 2200, type: WidthType.DXA },
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
          width: { size: 3800, type: WidthType.DXA },
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
          width: { size: 2000, type: WidthType.DXA },
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

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 1000);
}
