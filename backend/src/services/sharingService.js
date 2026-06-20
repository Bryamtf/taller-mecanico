const nodemailer = require("nodemailer");
const pdfService = require("./pdfService");
const empresa = require("../config/empresa");
const formatFecha = require("../utils/formatFecha");

class SharingService {
  constructor() {
    this.empresa = empresa;

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  /**
   * Enviar cotización por WhatsApp
   * Usando API de WhatsApp Business o link directo
   */
  async enviarWhatsApp(telefono, linkPublico, cotizacion) {
    const total = parseFloat(cotizacion.total) || 0;

    const mensaje =
      `*AUTONORT PERU SAC*\n\n` +
      `Hola ${cotizacion.cliente_nombre}, adjuntamos la cotización N° ${cotizacion.cotizacion_id}\n\n` +
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
                    { type: "text", text: cotizacion.cotizacion_id.toString() },
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

  /**
   * Enviar cotización por Email con PDF adjunto
   */
  async enviarEmail(email, linkPublico, cotizacion) {
    try {
      const total = parseFloat(cotizacion.total) || 0;

      const pdfBuffer = await pdfService.generar(cotizacion);

      const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #1a56db; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">${this.empresa.nombre}</h1>
                    </div>
                    
                    <div style="padding: 20px;">
                        <h2>Hola ${cotizacion.cliente_nombre},</h2>
                        
                        <p>Adjuntamos la cotización solicitada para su vehículo.</p>
                        
                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>N° Cotización:</strong> ${cotizacion.numero_cotizacion || cotizacion.cotizacion_id}</p>
                            <p><strong>Fecha:</strong> ${formatFecha(cotizacion.fecha_emision)}</p>
                            <p><strong>Vehículo:</strong> ${cotizacion.marca} ${cotizacion.modelo} - ${cotizacion.placa}</p>
                            <p><strong>Monto Total:</strong> S/ ${total.toFixed(2)}</p>
                            <p><strong>Estado:</strong> ${cotizacion.estado}</p>
                        </div>
                        
                        <p>Para ver los detalles completos, haga clic en el siguiente enlace:</p>
                        <p style="text-align: center;">
                            <a href="${linkPublico}" style="background-color: #1a56db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver Cotización</a>
                        </p>
                        
                        <p>El PDF de la cotización se adjunta a este correo.</p>
                        
                        <hr style="margin: 30px 0;">
                        
                        <p style="color: #6b7280; font-size: 12px;">
                            ${this.empresa.nombre}<br>
                            ${this.empresa.direccion}<br>
                            Tel: ${this.empresa.telefono}
                        </p>
                    </div>
                </div>
            `;

      const info = await this.transporter.sendMail({
        from: `"${this.empresa.nombre}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Cotización N° ${cotizacion.numero_cotizacion || cotizacion.cotizacion_id} - ${this.empresa.nombre}`,
        html: html,
        attachments: [
          {
            filename: `cotizacion_${cotizacion.cotizacion_id}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      return {
        enviado: true,
        messageId: info.messageId,
        to: email,
      };
    } catch (error) {
      console.error("Error al enviar email:", error);
      throw new Error(`No se pudo enviar el email: ${error.message}`);
    }
  }

  /**
   * Generar link público para compartir
   */
  generarLinkPublico(token) {
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return `${baseUrl}/cotizacion/${token}`;
  }
}

module.exports = new SharingService();
