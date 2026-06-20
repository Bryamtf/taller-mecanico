const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const empresa = require("../config/empresa");
const formatFecha = require("../utils/formatFecha");
class PDFService {
  constructor() {
    this.empresa = empresa;
    this.browser = null;
    this.logoHTML = this.cargarLogoHTML();
  }

  cargarLogoHTML() {
    const logoPath = path.join(__dirname, "../../uploads/logo.jpeg");
    if (!fs.existsSync(logoPath)) {
      return `<div class="logo-placeholder">LOGO</div>`;
    }
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString("base64");
    return `<img src="data:image/jpeg;base64,${logoBase64}" class="logo" alt="Logo" />`;
  }

  async getBrowser() {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
        headless: "new",
      });
    }
    return this.browser;
  }

  async generar(cotizacion) {
    const html = this.generarHTML(cotizacion);
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      const buffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "10mm", bottom: "15mm", left: "10mm", right: "10mm" },
      });
      return buffer;
    } finally {
      await page.close();
    }
  }

  generarHTML(cotizacion) {
    const numeroMostrar =
      cotizacion.numero_cotizacion || `${cotizacion.cotizacion_id}`;
    const logoHTML = this.logoHTML;

    // Separar repuestos y servicios
    const repuestos = (cotizacion.detalles || []).filter((d) => !d.es_servicio);
    const servicios = (cotizacion.detalles || []).filter((d) => d.es_servicio);

    const generarFilasRepuestos = (items) =>
      items.length === 0
        ? `<tr><td colspan="6" style="text-align:center;padding:8px;color:black;">Sin repuestos</td></tr>`
        : items
            .map(
              (d, i) => `
        <tr>
          <td class="tc">${i + 1}</td>
          <td>${this.escaparHTML(d.descripcion_custom || d.articulo_nombre || "")}</td>
          <td class="tc">${this.escaparHTML(d.marca || "-")}</td>
          <td class="tc">${parseFloat(d.cantidad) || 0}</td>
          <td class="tr">S/ ${(parseFloat(d.precio_unitario) || 0).toFixed(2)}</td>
          <td class="tr">S/ ${(parseFloat(d.subtotal) || 0).toFixed(2)}</td>
        </tr>`,
            )
            .join("");

    const generarFilasServicios = (items) =>
      items.length === 0
        ? `<tr><td colspan="6" style="text-align:center;padding:8px;color:black;">Sin mano de obra</td></tr>`
        : items
            .map(
              (d, i) => `
        <tr>
          <td class="tc">${i + 1}</td>
          <td>${this.escaparHTML(d.descripcion_custom || d.articulo_nombre || "")}</td>
          <td class="tc">${parseFloat(d.cantidad) || 0}</td>
          <td class="tr">S/ ${(parseFloat(d.precio_unitario) || 0).toFixed(2)}</td>
          <td class="tr">S/ ${(parseFloat(d.descuento) || 0).toFixed(2)}</td>
          <td class="tr">S/ ${(parseFloat(d.subtotal) || 0).toFixed(2)}</td>
        </tr>`,
            )
            .join("");

    const subtotalRepuestos = repuestos.reduce(
      (acc, d) => acc + (parseFloat(d.subtotal) || 0),
      0,
    );
    const subtotalServicios = servicios.reduce(
      (acc, d) => acc + (parseFloat(d.subtotal) || 0),
      0,
    );
    const subtotal = parseFloat(cotizacion.subtotal) || 0;
    const descuento = parseFloat(cotizacion.descuento) || 0;
    const igv = parseFloat(cotizacion.igv) || 0;
    const total = parseFloat(cotizacion.total) || 0;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }

    body {
      font-family: Arial, sans-serif;
      font-size: 9px;
      color: #000;
      background: #fff;
    }

    /* ── ENCABEZADO ── */
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .header-empresa h1 {
      font-size: 16px;
      font-weight: bold;
      text-transform: uppercase;
      color: #000;
    }
    .logo { height: 60px; width: auto; }
    .logo-placeholder {
      width: 80px; height: 60px;
      background: #eee;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; color: #999; border: 1px solid #ccc;
    }

    .header-address {
      font-size: 8px;
      color: #333;
      margin-bottom: 6px;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
    }

    /* ── BLOQUE CLIENTE + COTIZACIÓN ── */
    .info-row {
      display: grid;
      grid-template-columns: 1fr 200px;
      gap: 8px;
      margin-bottom: 6px;
    }

    .info-cliente table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
    }
    .info-cliente td {
      padding: 2px 4px;
    }
    .info-cliente td:first-child {
      font-weight: bold;
      width: 80px;
    }

    .cotizacion-box {
      border: 1.5px solid #000;
    }
    .cotizacion-box .cot-header {
      background: #000;
      color: #fff;
      text-align: center;
      font-weight: bold;
      font-size: 10px;
      padding: 3px;
      letter-spacing: 1px;
    }
    .cotizacion-box table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
    }
    .cotizacion-box td {
      padding: 3px 6px;
      border-bottom: 1px solid #ddd;
    }
    .cotizacion-box td:first-child {
      font-weight: bold;
      border-right: 1px solid #ddd;
      background: #f5f5f5;
    }

    /* ── DATOS VEHICULO ── */
    .vehiculo-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
      border: 1px solid #ccc;
      margin-bottom: 8px;
      font-size: 8.5px;
    }
    .vehiculo-campo {
      padding: 3px 6px;
      border-right: 1px solid #ccc;
    }
    .vehiculo-campo:last-child { border-right: none; }
    .vehiculo-campo label {
      font-weight: bold;
      display: block;
      font-size: 7.5px;
      color: #555;
      text-transform: uppercase;
    }

    /* ── TABLAS ── */
    .tabla-seccion { margin-bottom: 8px; }

    .tabla-titulo {
      background: #E8B800;
      color: #000;
      font-weight: bold;
      font-size: 9px;
      padding: 4px 8px;
      text-transform: uppercase;
      border: 1px solid #ccc;
      border-bottom: none;
    }

    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
    }
    table.data-table thead tr {
      background: #E8B800;
    }
    table.data-table thead th {
      padding: 4px 6px;
      font-weight: bold;
      text-transform: uppercase;
      border: 1px solid #000000 ;
      font-size: 8px;
    }
    table.data-table tbody td {
      padding: 4px 6px;
      border: 1px solid #000000 ;
    }
    table.data-table tbody tr:nth-child(even) {
      background: #fafafa;
    }
    .subtotal-row td {
      font-weight: bold;
      background: #f5f5f5 !important;
      border-top: 2px solid #ccc;
      text-align: right;
      padding: 4px 6px;
    }
    .subtotal-row td:last-child { color: #000; }

    /* ── RESUMEN DE TOTALES ── */
    .resumen-grid {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 12px;
      margin-bottom: 10px;
    }

    .observaciones-box {
      border: 1px solid #ccc;
      padding: 8px;
      font-size: 8px;
    }
    .observaciones-box h4 {
      font-size: 9px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .observaciones-box ul {
      padding-left: 12px;
      color: #555;
      line-height: 1.7;
    }

    .totales-tabla table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
    }
    .totales-titulo {
      background: #E8B800;
      font-weight: bold;
      font-size: 9px;
      padding: 4px 8px;
      text-transform: uppercase;
      border: 1px solid #ccc;
      border-bottom: none;
    }
    .totales-tabla thead th {
      background: #E8B800;
      padding: 4px 6px;
      border: 1px solid #000000 ;
      font-weight: bold;
      font-size: 8px;
      text-transform: uppercase;
    }
    .totales-tabla tbody td {
      padding: 4px 6px;
      border: 1px solid #000000 ;
    }
    .total-final-row td {
      background: #E8B800 !important;
      font-weight: bold;
      font-size: 10px;
      padding: 5px 6px;
      border: 1px solid #bbb;
    }

    /* ── PIE ── */
    .pie-pagina {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      padding: 5px 10mm;
      background: #f3f4f6;
      border-top: 1px solid #ccc;
      text-align: center;
      font-size: 7.5px;
      color: #888;
    }

    .tc { text-align: center; }
    .tr { text-align: right; }
    .bold { font-weight: bold; }
  </style>
</head>
<body>

  <!-- ENCABEZADO -->
  <div class="header-top">
    <div class="header-empresa">
      <h1>${this.escaparHTML(this.empresa.nombre)}</h1>
    </div>
    <div>${logoHTML}</div>
  </div>
  <div class="header-address">
    ${this.escaparHTML(this.empresa.direccion)}<br/>
    <strong>RUC: ${this.empresa.ruc}</strong>
  </div>

  <!-- CLIENTE + COTIZACIÓN -->
  <div class="info-row">
    <div class="info-cliente">
      <table>
        <tr>
          <td>CLIENTE:</td>
          <td><strong>${this.escaparHTML(cotizacion.cliente_nombre)}</strong></td>
        </tr>
        <tr>
          <td>RUC:</td>
          <td>${this.escaparHTML(cotizacion.dni_ruc || "-")}</td>
        </tr>
        <tr>
          <td>CELULAR:</td>
          <td>${this.escaparHTML(cotizacion.telefono || "-")}</td>
        </tr>
        <tr>
          <td>MARCA:</td>
          <td>${this.escaparHTML(cotizacion.marca || "-")}</td>
        </tr>
        <tr>
          <td>MOTOR:</td>
          <td>${this.escaparHTML(cotizacion.motor || "-")}</td>
        </tr>
      </table>
    </div>
    <div class="cotizacion-box">
      <div class="cot-header">COTIZACIÓN</div>
      <table>
        <tr>
          <td>N°:</td>
          <td><strong>${this.escaparHTML(numeroMostrar)}</strong></td>
        </tr>
        <tr>
          <td>FECHA:</td>
          <td>${formatFecha(cotizacion.fecha_emision)}</td>
        </tr>
        <tr>
          <td>MONEDA:</td>
          <td>SOLES</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- DATOS VEHÍCULO -->
  <div class="vehiculo-row">
    <div class="vehiculo-campo">
      <label>Kilometraje</label>
      ${cotizacion.kilometraje_momento ? parseFloat(cotizacion.kilometraje_momento).toLocaleString() + " km" : "-"}
    </div>
    <div class="vehiculo-campo">
      <label>Placa</label>
      <strong>${this.escaparHTML(cotizacion.placa || "-")}</strong>
    </div>
    <div class="vehiculo-campo">
      <label>VIN</label>
      ${this.escaparHTML(cotizacion.vin || "-")}
    </div>
    <div class="vehiculo-campo">
      <label>Modelo</label>
      ${this.escaparHTML(cotizacion.modelo || "-")}
    </div>
    <div class="vehiculo-campo">
      <label>Color</label>
      ${this.escaparHTML(cotizacion.color || "-")}
    </div>
    <div class="vehiculo-campo">
      <label>Año</label>
      ${this.escaparHTML(String(cotizacion.anio || "-"))}
    </div>
  </div>

  <!-- TABLA REPUESTOS -->
  <div class="tabla-seccion">
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:35px;">ITEM</th>
          <th>REPUESTOS</th>
          <th style="width:80px;">MARCA</th>
          <th style="width:70px;">CANTIDAD</th>
          <th style="width:75px;" class="tr">P.UNIT</th>
          <th style="width:80px;" class="tr">SUBTOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${generarFilasRepuestos(repuestos)}
        <tr class="subtotal-row">
          <td colspan="5">SUB-TOTAL</td>
          <td>S/ ${subtotalRepuestos.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- TABLA MANO DE OBRA -->
  <div class="tabla-seccion">
    <div class="tabla-titulo">MANO DE OBRA</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:35px;">ITEM</th>
          <th>DESCRIPCIÓN</th>
          <th style="width:70px;">CANTIDAD</th>
          <th style="width:75px;" class="tr">P.UNIT</th>
          <th style="width:65px;" class="tr">DESC.</th>
          <th style="width:80px;" class="tr">P.TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${generarFilasServicios(servicios)}
        <tr class="subtotal-row">
          <td colspan="5">SUB-TOTAL</td>
          <td>S/ ${subtotalServicios.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- RESUMEN + OBSERVACIONES -->
  <div class="resumen-grid">
    <div class="observaciones-box">
      <h4>Observaciones y Condiciones</h4>
      <p style="margin-bottom:6px;">${this.escaparHTML(cotizacion.observaciones || "Ninguna")}</p>
      <ul>
        <li>Cotización válida por 15 días</li>
        <li>Los precios incluyen IGV</li>
        <li>La garantía aplica según política del taller</li>
        <li>Para cualquier consulta, contactar al área de servicio</li>
      </ul>
    </div>

    <div class="totales-tabla">
      <div class="totales-titulo">RESUMEN DE TOTALES</div>
      <table>
        <thead>
          <tr>
            <th style="width:35px;">ITEM</th>
            <th>DESCRIPCIÓN</th>
            <th style="width:70px;" class="tr">P.TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="tc">1</td>
            <td>REPUESTOS</td>
            <td class="tr">S/ ${subtotalRepuestos.toFixed(2)}</td>
          </tr>
          <tr>
            <td class="tc">2</td>
            <td>MANO DE OBRA</td>
            <td class="tr">S/ ${subtotalServicios.toFixed(2)}</td>
          </tr>
          ${
            descuento > 0
              ? `
          <tr>
            <td class="tc">3</td>
            <td>DESCUENTO</td>
            <td class="tr">- S/ ${descuento.toFixed(2)}</td>
          </tr>`
              : ""
          }
          <tr>
            <td colspan="2" style="text-align:right;font-weight:bold;padding:4px 6px;border:1px solid #ddd;">SUB-TOTAL</td>
            <td class="tr bold" style="border:1px solid #ddd;padding:4px 6px;">S/ ${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="text-align:right;font-weight:bold;padding:4px 6px;border:1px solid #ddd;">IGV (18%)</td>
            <td class="tr bold" style="border:1px solid #ddd;padding:4px 6px;">S/ ${igv.toFixed(2)}</td>
          </tr>
          <tr class="total-final-row">
            <td colspan="2" style="text-align:right;">TOTAL</td>
            <td class="tr">S/ ${total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- PIE DE PÁGINA -->
  <div class="pie-pagina">
    ${this.empresa.nombre} — ${this.escaparHTML(this.empresa.direccion)} — ${this.empresa.telefono}
    &nbsp;|&nbsp; Documento generado por ${this.empresa.nombre}
  </div>

</body>
</html>`;
  }

  escaparHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  getEstadoColor(estado) {
    const colores = {
      borrador: "#f59e0b",
      pendiente: "#f59e0b",
      aprobada: "#10b981",
      rechazada: "#ef4444",
      vencida: "#6b7280",
    };
    return colores[estado] || "#374151";
  }

  async guardarArchivo(cotizacionId, numeroCotizacion, pdfBuffer) {
    const dir = path.join(
      __dirname,
      `../../uploads/cotizaciones/${cotizacionId}/pdf`,
    );
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = `cotizacion_${cotizacionId}_${numeroCotizacion}.pdf`;
    const rutaAbsoluta = path.join(dir, filename);
    const rutaRelativa = `/uploads/cotizaciones/${cotizacionId}/pdf/${filename}`;
    fs.writeFileSync(rutaAbsoluta, pdfBuffer);
    return rutaRelativa;
  }
}

module.exports = new PDFService();
