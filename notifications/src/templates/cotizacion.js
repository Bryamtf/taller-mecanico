import { baseLayout } from "./base.js";

export const cotizacionTemplate = ({
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
  const contenido = `
    <h2 style="margin:0 0 8px;color:#1a3a5c;font-size:18px;">
      Hola, ${cliente_nombre}
    </h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">
      Adjuntamos la cotización solicitada para su vehículo. A continuación el resumen:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:6px 0;">
          <span style="color:#64748b;font-size:13px;">N° Cotización:</span>
          <span style="color:#1a3a5c;font-size:13px;font-weight:600;margin-left:8px;">${numero_cotizacion}</span>
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
          <span style="color:#1a3a5c;font-size:13px;margin-left:8px;">${marca} ${modelo} — ${placa}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0;">
          <span style="color:#64748b;font-size:13px;">Estado:</span>
          <span style="color:#1a3a5c;font-size:13px;margin-left:8px;">${estado}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 6px;border-top:1px solid #e2e8f0;">
          <span style="color:#64748b;font-size:13px;">Monto Total:</span>
          <span style="color:#1a3a5c;font-size:16px;font-weight:700;margin-left:8px;">S/ ${total}</span>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">
      Para ver los detalles completos de su cotización, haga clic en el siguiente enlace:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${link_publico}"
            style="display:inline-block;background:#1a3a5c;color:#ffffff;text-decoration:none;
                   padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
            Ver Cotización
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#94a3b8;font-size:12px;">
      El PDF de la cotización se adjunta a este correo para su comodidad.
    </p>
  `;

  return baseLayout({
    titulo: `Cotización ${numero_cotizacion} — Autonort`,
    contenido,
  });
};
