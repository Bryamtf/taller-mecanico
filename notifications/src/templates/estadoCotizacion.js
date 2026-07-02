import { baseLayout } from "./base.js";

const mensajes = {
  aprobada: {
    titulo: "¡Cotización Aprobada!",
    color: "#16a34a",
    badge: "✓ APROBADA",
    badge_color: "#dcfce7",
    badge_text_color: "#15803d",
    cuerpo:
      "¡Buenas noticias! Su cotización ha sido <strong>aprobada</strong>. Nos pondremos en contacto para coordinar el inicio del servicio.",
    cta: "Ver Cotización",
  },
  rechazada: {
    titulo: "Cotización No Aprobada",
    color: "#dc2626",
    badge: "✗ RECHAZADA",
    badge_color: "#fee2e2",
    badge_text_color: "#b91c1c",
    cuerpo:
      "Le informamos que su cotización <strong>no pudo ser aprobada</strong> en esta oportunidad. Si tiene alguna consulta, no dude en contactarnos.",
    cta: "Ver Cotización",
  },
  vencida: {
    titulo: "Cotización Vencida",
    color: "#6b7280",
    badge: "⏰ VENCIDA",
    badge_color: "#f3f4f6",
    badge_text_color: "#4b5563",
    cuerpo:
      "Su cotización ha <strong>vencido</strong>. Si aún está interesado en nuestros servicios, con gusto generamos una nueva cotización para usted.",
    cta: "Ver Cotización",
  },
};

export const estadoCotizacionTemplate = ({
  cliente_nombre,
  numero_cotizacion,
  fecha_emision,
  marca,
  modelo,
  placa,
  total,
  estado,
  link_publico,
}) => {
  const config = mensajes[estado] || mensajes.aprobada;

  const contenido = `
    <div style="text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;background:${config.badge_color};color:${config.badge_text_color};
                   padding:6px 16px;border-radius:20px;font-size:13px;font-weight:700;
                   letter-spacing:0.5px;">
        ${config.badge}
      </span>
    </div>

    <h2 style="margin:0 0 8px;color:#1a3a5c;font-size:18px;text-align:center;">
      ${config.titulo}
    </h2>

    <p style="margin:0 0 24px;color:#64748b;font-size:14px;text-align:center;">
      Hola <strong>${cliente_nombre}</strong>, ${config.cuerpo}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;
             border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:6px 0;">
          <span style="color:#64748b;font-size:13px;">N° Cotización:</span>
          <span style="color:#1a3a5c;font-size:13px;font-weight:600;margin-left:8px;">
            ${numero_cotizacion}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;">
          <span style="color:#64748b;font-size:13px;">Fecha:</span>
          <span style="color:#1a3a5c;font-size:13px;margin-left:8px;">${fecha_emision}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;">
          <span style="color:#64748b;font-size:13px;">Vehículo:</span>
          <span style="color:#1a3a5c;font-size:13px;margin-left:8px;">
            ${marca} ${modelo} — ${placa}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 6px;border-top:1px solid #e2e8f0;">
          <span style="color:#64748b;font-size:13px;">Monto Total:</span>
          <span style="color:#1a3a5c;font-size:16px;font-weight:700;margin-left:8px;">
            S/ ${total}
          </span>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td align="center">
          <a href="${link_publico}"
            style="display:inline-block;background:${config.color};color:#ffffff;
                   text-decoration:none;padding:12px 32px;border-radius:8px;
                   font-size:14px;font-weight:600;">
            ${config.cta}
          </a>
        </td>
      </tr>
    </table>
  `;

  return baseLayout({
    titulo: `${config.titulo} — ${numero_cotizacion}`,
    contenido,
  });
};
