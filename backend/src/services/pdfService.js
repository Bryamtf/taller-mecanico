const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class PDFService {
  constructor() {
    this.empresa = {
      nombre: "AUTONORT PERU SAC",
      ruc: "20601234567",
      direccion: "Av. Principal 123, Lima - Perú",
      telefono: "(01) 234-5678",
      email: "info@autonort.com",
      website: "www.autonort.com",
    };
  }

  /**
   * Genera el PDF de una cotización
   * @param {Object} cotizacion - Datos de la cotización con detalles
   * @returns {Promise<Buffer>} - Buffer del PDF generado
   */
  async generar(cotizacion) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: "A4",
          info: {
            Title: `Cotización ${cotizacion.cotizacion_id}`,
            Author: this.empresa.nombre,
            Subject: "Cotización de servicios automotrices",
          },
        });

        const chunks = [];

        // Capturar datos del PDF
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        this.agregarEncabezado(doc);

        this.agregarTitulo(doc, cotizacion);

        this.agregarDatosCliente(doc, cotizacion);

        this.agregarDatosVehiculo(doc, cotizacion);

        this.agregarTablaDetalles(doc, cotizacion.detalles);

        this.agregarResumenes(doc, cotizacion);

        this.agregarObservaciones(doc, cotizacion);

        this.agregarPiePagina(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Encabezado con logo y datos de la empresa
   */
  agregarEncabezado(doc) {
    // Logo (si existe, si no, solo texto)
    const logoPath = path.join(__dirname, "../../uploads/logo.jpeg");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 80 });
      doc.moveDown(2);
    } else {
      // Texto del taller
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#1a56db")
        .text(this.empresa.nombre, 50, 45, { align: "left" });
    }

    // Datos de contacto
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#4b5563")
      .text(this.empresa.ruc, 50, 80)
      .text(this.empresa.direccion, 50, 95)
      .text(
        `Tel: ${this.empresa.telefono} | Email: ${this.empresa.email}`,
        50,
        110,
      );

    // Línea separadora
    doc.moveTo(50, 130).lineTo(550, 130).strokeColor("#e5e7eb").stroke();

    return doc;
  }

  /**
   * Título de la cotización
   */
  agregarTitulo(doc, cotizacion) {
    doc.moveDown(1);

    // Número de cotización destacado
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor("#1a56db")
      .text(`COTIZACIÓN N° ${cotizacion.cotizacion_id}`, 50, 150, {
        align: "center",
      });

    // Estado
    const estadoColor = this.getEstadoColor(cotizacion.estado);
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(estadoColor)
      .text(`Estado: ${cotizacion.estado.toUpperCase()}`, { align: "center" });

    // Fechas
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#4b5563")
      .text(`Fecha de emisión: ${cotizacion.fecha_emision}`, {
        align: "center",
      })
      .text(
        `Fecha de vencimiento: ${cotizacion.fecha_vencimiento || "No especificada"}`,
        { align: "center" },
      );

    doc.moveDown(1);

    return doc;
  }

  /**
   * Datos del cliente
   */
  agregarDatosCliente(doc, cotizacion) {
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#374151")
      .text("DATOS DEL CLIENTE", 50);

    doc.fontSize(10).font("Helvetica").fillColor("#4b5563");

    const clienteY = doc.y + 5;

    doc
      .text(`Cliente: ${cotizacion.cliente_nombre}`, 60, clienteY)
      .text(
        `DNI/RUC: ${cotizacion.dni_ruc || "No especificado"}`,
        60,
        clienteY + 15,
      )
      .text(
        `Teléfono: ${cotizacion.telefono || "No especificado"}`,
        60,
        clienteY + 30,
      )
      .text(
        `Email: ${cotizacion.email || "No especificado"}`,
        60,
        clienteY + 45,
      );

    doc.moveDown(6);

    return doc;
  }

  /**
   * Datos del vehículo
   */
  agregarDatosVehiculo(doc, cotizacion) {
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#374151")
      .text("DATOS DEL VEHÍCULO", 50);

    doc.fontSize(10).font("Helvetica").fillColor("#4b5563");

    const vehiculoY = doc.y + 5;

    doc
      .text(`Placa: ${cotizacion.placa}`, 60, vehiculoY)
      .text(
        `Marca/Modelo: ${cotizacion.marca} ${cotizacion.modelo}`,
        60,
        vehiculoY + 15,
      )
      .text(
        `Color: ${cotizacion.color || "No especificado"}`,
        60,
        vehiculoY + 30,
      );

    if (cotizacion.kilometraje_momento) {
      doc.text(
        `Kilometraje: ${cotizacion.kilometraje_momento.toLocaleString()} km`,
        300,
        vehiculoY,
      );
    }

    doc.moveDown(5);

    return doc;
  }

  /**
   * Tabla de detalles de servicios y repuestos
   */
  agregarTablaDetalles(doc, detalles) {
    doc.moveDown(1);

    // Encabezados de tabla
    const startX = 50;
    let currentY = doc.y + 10;

    // Fondo del encabezado
    doc
      .rect(startX, currentY - 5, 500, 25)
      .fillColor("#f3f4f6")
      .fill();

    // Textos del encabezado
    doc.fillColor("#374151").fontSize(10).font("Helvetica-Bold");

    doc.text("CANT.", startX + 10, currentY);
    doc.text("DESCRIPCIÓN", startX + 70, currentY);
    doc.text("P. UNIT.", startX + 320, currentY);
    doc.text("DESC.", startX + 390, currentY);
    doc.text("SUBTOTAL", startX + 450, currentY);

    currentY += 25;

    // Línea separadora
    doc
      .moveTo(startX, currentY - 5)
      .lineTo(startX + 500, currentY - 5)
      .strokeColor("#d1d5db")
      .stroke();

    // Detalles
    doc.fontSize(9).font("Helvetica").fillColor("#4b5563");

    let y = currentY;

    detalles.forEach((detalle, index) => {
      const descripcion =
        detalle.descripcion_custom || detalle.articulo_nombre || "Servicio";
      const tipo = detalle.es_servicio ? "🔧 " : "🔩 ";

      const cantidad = parseFloat(detalle.cantidad) || 0;
      const precioUnitario = parseFloat(detalle.precio_unitario) || 0;
      const descuento = parseFloat(detalle.descuento) || 0;
      const subtotal = parseFloat(detalle.subtotal) || 0;

      // Verificar si necesitamos nueva página
      if (y > 700) {
        doc.addPage();
        y = 50;
        this.agregarEncabezado(doc);
        doc.moveDown(3);
      }

      doc.text(cantidad.toString(), startX + 15, y, {
        width: 40,
        align: "center",
      });
      doc.text(tipo + descripcion, startX + 70, y, { width: 230 });
      doc.text(`S/ ${precioUnitario.toFixed(2)}`, startX + 325, y, {
        width: 60,
        align: "right",
      });
      doc.text(`S/ ${descuento.toFixed(2)}`, startX + 395, y, {
        width: 50,
        align: "right",
      });
      doc.text(`S/ ${subtotal.toFixed(2)}`, startX + 450, y, {
        width: 70,
        align: "right",
      });

      y += 20;
    });

    // Guardar posición Y para resúmenes
    this.lastY = y + 10;

    return doc;
  }
  /**
   * Resúmenes de montos
   */
  agregarResumenes(doc, cotizacion) {
    const y = this.lastY;

    const subtotal = parseFloat(cotizacion.subtotal) || 0;
    const descuento = parseFloat(cotizacion.descuento) || 0;
    const igv = parseFloat(cotizacion.igv) || 0;
    const total = parseFloat(cotizacion.total) || 0;

    // Cuadro de resumen
    const resumenX = 350;
    const resumenY = y;

    doc
      .rect(resumenX, resumenY, 200, 100)
      .fillColor("#ffffff")
      .fill()
      .strokeColor("#e5e7eb")
      .stroke();

    doc.fontSize(10).font("Helvetica-Bold").fillColor("#374151");

    doc.text("RESUMEN", resumenX + 10, resumenY + 5);

    doc.fontSize(9).font("Helvetica");

    doc
      .text("Subtotal:", resumenX + 10, resumenY + 25)
      .text(`S/ ${subtotal.toFixed(2)}`, resumenX + 140, resumenY + 25, {
        width: 50,
        align: "right",
      });

    doc
      .text("Descuento:", resumenX + 10, resumenY + 45)
      .text(`S/ ${descuento.toFixed(2)}`, resumenX + 140, resumenY + 45, {
        width: 50,
        align: "right",
      });

    doc
      .text("IGV (18%):", resumenX + 10, resumenY + 65)
      .text(`S/ ${igv.toFixed(2)}`, resumenX + 140, resumenY + 65, {
        width: 50,
        align: "right",
      });

    // Línea separadora
    doc
      .moveTo(resumenX + 10, resumenY + 78)
      .lineTo(resumenX + 190, resumenY + 78)
      .strokeColor("#d1d5db")
      .stroke();

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#1a56db")
      .text("TOTAL:", resumenX + 10, resumenY + 82)
      .text(`S/ ${total.toFixed(2)}`, resumenX + 135, resumenY + 82, {
        width: 60,
        align: "right",
      });

    doc.moveDown(8);

    return doc;
  }

  /**
   * Observaciones y términos
   */
  agregarObservaciones(doc, cotizacion) {
    doc.moveDown(2);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#374151")
      .text("OBSERVACIONES Y CONDICIONES:", 50);

    doc.fontSize(9).font("Helvetica").fillColor("#4b5563");

    const observaciones = cotizacion.observaciones || "Ninguna";

    // Texto justificado
    const textWidth = 450;
    const textHeight = doc.heightOfString(observaciones, { width: textWidth });

    doc.text(observaciones, 50, doc.y + 5, { width: textWidth, align: "left" });

    doc.moveDown(2);

    // Términos y condiciones
    doc
      .fontSize(9)
      .font("Helvetica-Oblique")
      .fillColor("#6b7280")
      .text("Términos:", 50)
      .text("• Cotización válida por 15 días", 60)
      .text("• Los precios incluyen IGV", 60)
      .text("• La garantía aplica según política del taller", 60)
      .text("• Para cualquier consulta, contactar al área de servicio", 60);

    doc.moveDown(2);

    // Firma
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#374151")
      .text("Atentamente,", 50)
      .text("AUTONORT PERU SAC", 50);

    return doc;
  }

  /**
   * Pie de página
   */
  agregarPiePagina(doc) {
    // Versión simple - solo pie en la última página
    // Sin eventos, sin switchToPage

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#9ca3af")
      .text(
        `${this.empresa.nombre} - ${this.empresa.direccion} - ${this.empresa.telefono}`,
        50,
        doc.page.height - 50,
        { align: "center", width: 500 },
      )
      .text(
        `Documento generado por AUTONORT PERU SAC`,
        50,
        doc.page.height - 35,
        { align: "center", width: 500 },
      );

    return doc;
  }

  /**
   * Obtener color según estado
   */
  getEstadoColor(estado) {
    const colores = {
      borrador: "#f59e0b", // ámbar
      pendiente: "#f59e0b", // ámbar
      aprobada: "#10b981", // verde
      rechazada: "#ef4444", // rojo
      vencida: "#6b7280", // gris
    };
    return colores[estado] || "#374151";
  }

  /**
   * Guardar PDF en archivo
   * @param {Object} cotizacion - Datos de la cotización
   * @returns {Promise<string>} - Ruta del archivo guardado
   */
  async guardarArchivo(cotizacion) {
    const pdfBuffer = await this.generar(cotizacion);

    // Crear directorio si no existe
    const dir = path.join(__dirname, "../../uploads/cotizaciones");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filename = `cotizacion_${cotizacion.cotizacion_id}_${Date.now()}.pdf`;
    const filepath = path.join(dir, filename);

    fs.writeFileSync(filepath, pdfBuffer);

    return `/uploads/cotizaciones/${filename}`;
  }
}

module.exports = new PDFService();
