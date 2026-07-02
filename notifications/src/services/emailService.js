import { Resend } from "resend";
import { cotizacionTemplate } from "../templates/cotizacion.js";
import { estadoCotizacionTemplate } from "../templates/estadoCotizacion.js";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || "Autonort <cotizaciones@danisys.lat>";

export const emailService = {
  async enviarCotizacion({
    to,
    cliente_nombre,
    numero_cotizacion,
    fecha_emision,
    marca,
    modelo,
    placa,
    total,
    estado,
    link_publico,
    pdf_buffer,
  }) {
    const html = cotizacionTemplate({
      cliente_nombre,
      numero_cotizacion,
      fecha_emision,
      marca,
      modelo,
      placa,
      total,
      estado,
      link_publico,
    });

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Cotización ${numero_cotizacion} — Autonort Peru`,
      html,
      attachments: pdf_buffer
        ? [
            {
              filename: `cotizacion_${numero_cotizacion}.pdf`,
              content: pdf_buffer,
            },
          ]
        : [],
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    return { enviado: true, messageId: data.id, to };
  },

  async enviarEstadoCotizacion({
    to,
    cliente_nombre,
    numero_cotizacion,
    fecha_emision,
    marca,
    modelo,
    placa,
    total,
    estado,
    link_publico,
  }) {
    const html = estadoCotizacionTemplate({
      cliente_nombre,
      numero_cotizacion,
      fecha_emision,
      marca,
      modelo,
      placa,
      total,
      estado,
      link_publico,
    });

    const asuntos = {
      aprobada: `✓ Cotización ${numero_cotizacion} aprobada — Autonort`,
      rechazada: `Cotización ${numero_cotizacion} no aprobada — Autonort`,
      vencida: `Cotización ${numero_cotizacion} vencida — Autonort`,
    };

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject:
        asuntos[estado] ||
        `Actualización cotización ${numero_cotizacion} — Autonort`,
      html,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    return { enviado: true, messageId: data.id, to };
  },
};
