import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FECHA_HOY = () => new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const NOMBRE_ARCHIVO = (ext) => `inventario_${new Date().toISOString().slice(0, 10)}.${ext}`;

const filaTabla = (p) => [
  p.codigo_interno  || '—',
  p.nombre,
  p.tipo            || '—',
  p.marcas          || '—',
  Number(p.stock_total),
  Number(p.stock_minimo),
  p.precio_min != null ? `S/ ${Number(p.precio_min).toFixed(2)}` : '—',
  p.precio_max != null ? `S/ ${Number(p.precio_max).toFixed(2)}` : '—',
  p.valor_stock != null ? `S/ ${Number(p.valor_stock).toFixed(2)}` : '—',
];

const CABECERAS = ['Código', 'Nombre', 'Tipo', 'Marcas', 'Stock actual', 'Stock mín.', 'Precio venta min', 'Precio venta max', 'Valor stock (costo)'];

export function exportarExcel(productos) {
  const data = productos.map((p) => ({
    'Código':               p.codigo_interno  || '',
    'Nombre':               p.nombre,
    'Tipo':                 p.tipo            || '',
    'Marcas':               p.marcas          || '',
    'Stock actual':         Number(p.stock_total),
    'Stock mínimo':         Number(p.stock_minimo),
    'Precio venta min (S/)': p.precio_min != null ? Number(p.precio_min) : '',
    'Precio venta max (S/)': p.precio_max != null ? Number(p.precio_max) : '',
    'Valor stock costo (S/)': p.valor_stock != null ? Number(p.valor_stock) : '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  ws['!cols'] = [
    { wch: 14 }, { wch: 36 }, { wch: 12 }, { wch: 28 },
    { wch: 13 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 22 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  XLSX.writeFile(wb, NOMBRE_ARCHIVO('xlsx'));
}

export function exportarPDF(productos) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Inventario de Productos', 14, 14);

  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(`Generado: ${FECHA_HOY()} · Total: ${productos.length} producto${productos.length !== 1 ? 's' : ''}`, 14, 20);

  autoTable(doc, {
    startY: 25,
    head: [CABECERAS],
    body: productos.map(filaTabla),
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [229, 186, 74],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 55 },
      2: { cellWidth: 20 },
      3: { cellWidth: 40 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 26, halign: 'right' },
      7: { cellWidth: 26, halign: 'right' },
      8: { cellWidth: 28, halign: 'right' },
    },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        doc.internal.pageSize.getWidth() - 14,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'right' }
      );
    },
  });

  doc.save(NOMBRE_ARCHIVO('pdf'));
}
