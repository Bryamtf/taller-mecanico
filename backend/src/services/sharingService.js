const pdfService = require("./pdfService");
const empresa = require("../config/empresa");
const formatFecha = require("../utils/formatFecha");

class SharingService {
  constructor() {
    this.empresa = empresa;
  }

  async enviarWhatsApp(telefono, linkPublico, cotizacion) {
    const total = parseFloat(cotizacion.total) || 0;

    const mensaje =
      `*${this.empresa.nombre}*\n\n` +
      `Hola ${cotizacion.cliente_nombre}, adjuntamos la cotización N° ${cotizacion.numero_cotizacion || cotizacion.cotizacion_id}\n\n` +
      `Monto total: S/ ${total.toFixed(2)}\n\n` +
      `Ver detalles: ${linkPublico}\n\n` +
      `Agradecemos su preferencia.`;

    const encodedMsg = encodeURIComponent(mensaje);
    const whatsappLink = `https://wa.me/${telefono}?text=${encodedMsg}`;

    if (process.env.WHATSAPP_API_TOKEN) {
      const response = await fetch(
        "https://graph.facebook.com/v17.0/me/messages",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: telefono,
            type: "template",
            template: {
              name: "cotizacion",
              language: { code: "es" },
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: cotizacion.cliente_nombre },
                    {
                      type: "text",
                      text: (
                        cotizacion.numero_cotizacion || cotizacion.cotizacion_id
                      ).toString(),
                    },
                    { type: "text", text: `S/ ${total.toFixed(2)}` },
                    { type: "text", text: linkPublico },
                  ],
                },
              ],
            },
          }),
        },
      );

      return {
        enviado: true,
        link: whatsappLink,
        apiResponse: await response.json(),
      };
    }

    return {
      enviado: "manual",
      link: whatsappLink,
      mensaje: "Comparte este enlace con el cliente por WhatsApp",
    };
  }

  async enviarEmail(email, linkPublico, cotizacion) {
    try {
      const total = parseFloat(cotizacion.total) || 0;

      // Generar PDF
      const pdfBuffer = await pdfService.generar(cotizacion);
      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

      // Llamar al microservicio de notificaciones
      const response = await fetch(
        `${process.env.NOTIFICATIONS_URL}/api/email/cotizacion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.NOTIFICATIONS_SECRET,
          },
          body: JSON.stringify({
            to: email,
            cliente_nombre: cotizacion.cliente_nombre,
            numero_cotizacion:
              cotizacion.numero_cotizacion || cotizacion.cotizacion_id,
            fecha_emision: formatFecha(cotizacion.fecha_emision),
            marca: cotizacion.marca,
            modelo: cotizacion.modelo,
            placa: cotizacion.placa,
            total: total.toFixed(2),
            estado: cotizacion.estado,
            link_publico: linkPublico,
            pdf_base64: pdfBase64,
          }),
        },
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Error en el servicio de notificaciones",
        );
      }

      return data.data;
    } catch (error) {
      console.error("Error al enviar email:", error);
      throw new Error(`No se pudo enviar el email: ${error.message}`);
    }
  }

  generarLinkPublico(token) {
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return `${baseUrl}/cotizacion/${token}`;
  }
}

module.exports = new SharingService();
