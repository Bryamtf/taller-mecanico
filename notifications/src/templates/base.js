export const baseLayout = ({ titulo, contenido }) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:#1a3a5c;padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                GRUPO AUTONORT PERU SAC
              </h1>
              <p style="margin:6px 0 0;color:#a8c4e0;font-size:13px;">Taller Mecánico · Chiclayo</p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px;">
              ${contenido}
            </td>
          </tr>

          <tr>
            <td style="background:#f0f4f8;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                Grupo Autonort Peru SAC · RUC 20612370932 · Chiclayo, Lambayeque
              </p>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;">
                Este correo fue generado automáticamente, por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
