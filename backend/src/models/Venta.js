const pool = require('../config/database');

pool.query(`CREATE TABLE IF NOT EXISTS Numeracion_venta (
  anio               YEAR NOT NULL,
  correlativo_actual INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (anio)
) ENGINE=InnoDB`).catch(() => {});

pool.query(`CREATE TABLE IF NOT EXISTS Pago_venta (
  pago_id  INT           NOT NULL AUTO_INCREMENT,
  venta_id INT           NOT NULL,
  metodo   VARCHAR(30)   NOT NULL,
  monto    DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (pago_id),
  CONSTRAINT fk_pv_venta FOREIGN KEY (venta_id) REFERENCES Venta(venta_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB`).catch(() => {});

pool.query(`ALTER TABLE Venta ADD COLUMN numero_venta VARCHAR(20) NULL`).catch(() => {});
pool.query(`ALTER TABLE Detalle_venta MODIFY COLUMN articulo_id INT NULL`).catch(() => {});
pool.query(`ALTER TABLE Detalle_venta ADD COLUMN descripcion_custom VARCHAR(255) NULL`).catch(() => {});
pool.query(`ALTER TABLE Detalle_venta ADD COLUMN es_servicio TINYINT(1) NOT NULL DEFAULT 0`).catch(() => {});

async function generarNumeroVenta(conn) {
  const anio = new Date().getFullYear();
  await conn.query(
    `INSERT INTO Numeracion_venta (anio, correlativo_actual) VALUES (?, 1)
     ON DUPLICATE KEY UPDATE correlativo_actual = LAST_INSERT_ID(correlativo_actual + 1)`,
    [anio]
  );
  const [[{ correlativo }]] = await conn.query(`SELECT LAST_INSERT_ID() AS correlativo`);
  return `V${anio}-${String(correlativo).padStart(8, '0')}`;
}

const Venta = {
  async crear({ cotizacion_id, tipo_comprobante_id, pagos, observaciones, username }, cotizacion, conn) {
    const numero_venta = await generarNumeroVenta(conn);
    const pagosArr = pagos || [];
    const tipo_pago = pagosArr.length === 1 ? pagosArr[0].metodo : 'mixto';

    const [ventaRes] = await conn.query(
      `INSERT INTO Venta
         (numero_venta, cliente_id, vehiculo_id, cotizacion_id, atendido_por, estado,
          tipo_pago, subtotal, descuento, igv, total, observaciones)
       VALUES (?, ?, ?, ?, ?, 'completada', ?, ?, ?, ?, ?, ?)`,
      [
        numero_venta, cotizacion.cliente_id, cotizacion.vehiculo_id, cotizacion_id,
        username, tipo_pago, cotizacion.subtotal, cotizacion.descuento,
        cotizacion.igv, cotizacion.total, observaciones || null,
      ]
    );
    const venta_id = ventaRes.insertId;

    for (const d of cotizacion.detalles) {
      await conn.query(
        `INSERT INTO Detalle_venta
           (venta_id, articulo_id, marca_id, descripcion_custom, es_servicio,
            cantidad, precio_unitario, descuento, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          venta_id, d.articulo_id || null, d.marca_id || null,
          d.descripcion_custom || null, d.es_servicio || 0,
          d.cantidad, d.precio_unitario, d.descuento || 0, d.subtotal,
        ]
      );
    }

    for (const p of pagosArr) {
      await conn.query(
        `INSERT INTO Pago_venta (venta_id, metodo, monto) VALUES (?, ?, ?)`,
        [venta_id, p.metodo, p.monto]
      );
    }

    let numero_comprobante = null;
    if (tipo_comprobante_id) {
      const [[serie]] = await conn.query(
        `SELECT s.serie_id, s.numero FROM Serie s
         WHERE s.tipo_comprobante_id = ? AND s.activo = 1 LIMIT 1`,
        [tipo_comprobante_id]
      );
      if (serie) {
        const [[sc]] = await conn.query(
          `SELECT correlativo_actual FROM Serie_correlativo WHERE serie_id = ? FOR UPDATE`,
          [serie.serie_id]
        );
        const nuevo = (sc?.correlativo_actual || 0) + 1;
        await conn.query(
          `UPDATE Serie_correlativo SET correlativo_actual = ? WHERE serie_id = ?`,
          [nuevo, serie.serie_id]
        );
        numero_comprobante = `${serie.numero}-${String(nuevo).padStart(8, '0')}`;
        const [compRes] = await conn.query(
          `INSERT INTO Comprobante
             (venta_id, serie_id, tipo_comprobante_id, correlativo, numero_completo, generado_por)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [venta_id, serie.serie_id, tipo_comprobante_id, nuevo, numero_comprobante, username]
        );
        for (const d of cotizacion.detalles) {
          await conn.query(
            `INSERT INTO Detalle_comprobante (comprobante_id, descripcion, cantidad, precio_unitario, igv, subtotal)
             VALUES (?, ?, ?, ?, 0, ?)`,
            [compRes.insertId, d.descripcion_custom || d.articulo_nombre || 'Ítem', d.cantidad, d.precio_unitario, d.subtotal]
          );
        }
      }
    }

    await conn.query(
      `INSERT INTO Ingresos (venta_id, registrado_por, concepto, categoria, tipo_pago, monto, fecha)
       VALUES (?, ?, ?, 'pago_servicio', ?, ?, CURDATE())`,
      [
        venta_id, username,
        `Venta ${numero_venta}${numero_comprobante ? ' · ' + numero_comprobante : ''}`,
        tipo_pago, cotizacion.total,
      ]
    );

    await conn.query(
      `UPDATE Cotizacion SET estado = 'pagada' WHERE cotizacion_id = ?`,
      [cotizacion_id]
    );

    return { venta_id, numero_venta, numero_comprobante };
  },

  async listarPendientes({ pagina = 1, limite = 20, busqueda = '' } = {}) {
    const offset = (pagina - 1) * limite;
    const like   = `%${busqueda}%`;
    const [rows] = await pool.query(
      `SELECT
          c.cotizacion_id, c.numero_cotizacion, c.total, c.subtotal, c.descuento, c.igv,
          c.fecha_emision, c.fecha_registro,
          CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre, cl.telefono,
          ve.placa, ve.marca AS vehiculo_marca, ve.modelo AS vehiculo_modelo,
          COUNT(dc.detalle_id) AS total_items
       FROM Cotizacion c
       JOIN Cliente cl  ON cl.cliente_id  = c.cliente_id
       JOIN Vehiculo ve ON ve.vehiculo_id = c.vehiculo_id
       LEFT JOIN Detalle_cotizacion dc ON dc.cotizacion_id = c.cotizacion_id
       LEFT JOIN Venta v ON v.cotizacion_id = c.cotizacion_id AND v.estado != 'anulada'
       WHERE c.estado = 'aprobada' AND v.venta_id IS NULL AND c.es_modelo = 0
         AND (cl.nombres LIKE ? OR cl.apellidos LIKE ? OR c.numero_cotizacion LIKE ? OR ve.placa LIKE ?)
       GROUP BY c.cotizacion_id
       ORDER BY c.fecha_registro DESC
       LIMIT ? OFFSET ?`,
      [like, like, like, like, limite, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM (
         SELECT c.cotizacion_id FROM Cotizacion c
         JOIN Cliente cl  ON cl.cliente_id  = c.cliente_id
         JOIN Vehiculo ve ON ve.vehiculo_id = c.vehiculo_id
         LEFT JOIN Venta v ON v.cotizacion_id = c.cotizacion_id AND v.estado != 'anulada'
         WHERE c.estado = 'aprobada' AND v.venta_id IS NULL AND c.es_modelo = 0
           AND (cl.nombres LIKE ? OR cl.apellidos LIKE ? OR c.numero_cotizacion LIKE ? OR ve.placa LIKE ?)
         GROUP BY c.cotizacion_id
       ) sub`,
      [like, like, like, like]
    );
    return { pendientes: rows, total: Number(total), pagina, totalPaginas: Math.ceil(Number(total) / limite) };
  },

  async listarHistorial({ pagina = 1, limite = 20, busqueda = '' } = {}) {
    const offset = (pagina - 1) * limite;
    const like   = `%${busqueda}%`;
    const [rows] = await pool.query(
      `SELECT
          v.venta_id, v.numero_venta, v.estado, v.tipo_pago,
          v.subtotal, v.descuento, v.igv, v.total, v.fecha_venta,
          CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre,
          ve.placa, ve.marca AS vehiculo_marca, ve.modelo AS vehiculo_modelo,
          c.numero_cotizacion,
          comp.numero_completo AS comprobante,
          tc.nombre AS tipo_comprobante_nombre
       FROM Venta v
       JOIN Cliente cl ON cl.cliente_id = v.cliente_id
       LEFT JOIN Vehiculo ve  ON ve.vehiculo_id  = v.vehiculo_id
       LEFT JOIN Cotizacion c ON c.cotizacion_id = v.cotizacion_id
       LEFT JOIN Comprobante comp ON comp.venta_id = v.venta_id AND comp.estado = 'emitido'
       LEFT JOIN Tipo_comprobante tc ON tc.tipo_comprobante_id = comp.tipo_comprobante_id
       WHERE v.estado != 'anulada'
         AND (cl.nombres LIKE ? OR cl.apellidos LIKE ? OR v.numero_venta LIKE ? OR ve.placa LIKE ?)
       ORDER BY v.fecha_venta DESC
       LIMIT ? OFFSET ?`,
      [like, like, like, like, limite, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM Venta v
       JOIN Cliente cl ON cl.cliente_id = v.cliente_id
       LEFT JOIN Vehiculo ve ON ve.vehiculo_id = v.vehiculo_id
       WHERE v.estado != 'anulada'
         AND (cl.nombres LIKE ? OR cl.apellidos LIKE ? OR v.numero_venta LIKE ? OR ve.placa LIKE ?)`,
      [like, like, like, like]
    );
    return { ventas: rows, total: Number(total), pagina, totalPaginas: Math.ceil(Number(total) / limite) };
  },

  async encontrarPorId(id) {
    const [[venta]] = await pool.query(
      `SELECT
          v.venta_id, v.numero_venta, v.estado, v.tipo_pago,
          v.subtotal, v.descuento, v.igv, v.total, v.fecha_venta, v.observaciones,
          CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre,
          cl.dni_ruc, cl.telefono,
          ve.placa, ve.marca AS vehiculo_marca, ve.modelo AS vehiculo_modelo,
          c.numero_cotizacion,
          comp.numero_completo AS comprobante_numero, comp.comprobante_id,
          tc.nombre AS comprobante_tipo
       FROM Venta v
       JOIN Cliente cl ON cl.cliente_id = v.cliente_id
       LEFT JOIN Vehiculo ve  ON ve.vehiculo_id  = v.vehiculo_id
       LEFT JOIN Cotizacion c ON c.cotizacion_id = v.cotizacion_id
       LEFT JOIN Comprobante comp ON comp.venta_id = v.venta_id AND comp.estado = 'emitido'
       LEFT JOIN Tipo_comprobante tc ON tc.tipo_comprobante_id = comp.tipo_comprobante_id
       WHERE v.venta_id = ?`,
      [id]
    );
    if (!venta) return null;
    const [detalles] = await pool.query(
      `SELECT dv.*, a.nombre AS articulo_nombre, m.nombre AS marca_nombre
       FROM Detalle_venta dv
       LEFT JOIN Articulos a ON a.articulo_id = dv.articulo_id
       LEFT JOIN Marca_Repuesto m ON m.marca_id = dv.marca_id
       WHERE dv.venta_id = ?`,
      [id]
    );
    const [pagos] = await pool.query(
      `SELECT pago_id, metodo, monto FROM Pago_venta WHERE venta_id = ?`,
      [id]
    );
    return { ...venta, detalles, pagos };
  },

  async obtenerResumen() {
    const [[hoy]] = await pool.query(
      `SELECT COUNT(*) AS ventasHoy, COALESCE(SUM(total), 0) AS totalHoy
       FROM Venta WHERE DATE(fecha_venta) = CURDATE() AND estado != 'anulada'`
    );
    const [[{ pendientes }]] = await pool.query(
      `SELECT COUNT(*) AS pendientes FROM (
         SELECT c.cotizacion_id FROM Cotizacion c
         LEFT JOIN Venta v ON v.cotizacion_id = c.cotizacion_id AND v.estado != 'anulada'
         WHERE c.estado = 'aprobada' AND v.venta_id IS NULL AND c.es_modelo = 0
         GROUP BY c.cotizacion_id
       ) sub`
    );
    return { ventasHoy: Number(hoy.ventasHoy), totalHoy: Number(hoy.totalHoy), pendientes: Number(pendientes) };
  },

  async anular(id, username, conn) {
    const [detalles] = await conn.query(
      `SELECT articulo_id, marca_id, cantidad FROM Detalle_venta
       WHERE venta_id = ? AND articulo_id IS NOT NULL AND es_servicio = 0`,
      [id]
    );
    for (const d of detalles) {
      const [[amp]] = await conn.query(
        `SELECT stock_actual FROM Articulo_Marca_Precio
         WHERE articulo_id = ? AND marca_id = ? FOR UPDATE`,
        [d.articulo_id, d.marca_id]
      );
      if (!amp) continue;
      const nuevoStock = amp.stock_actual + d.cantidad;
      await conn.query(
        `UPDATE Articulo_Marca_Precio SET stock_actual = ? WHERE articulo_id = ? AND marca_id = ?`,
        [nuevoStock, d.articulo_id, d.marca_id]
      );
      await conn.query(
        `INSERT INTO Movimiento_inventario
           (articulo_id, marca_id, tipo_movimiento, cantidad, stock_anterior, stock_resultante, motivo, referencia_id, registrado_por)
         VALUES (?, ?, 'entrada', ?, ?, ?, 'devolucion_venta', ?, ?)`,
        [d.articulo_id, d.marca_id, d.cantidad, amp.stock_actual, nuevoStock, parseInt(id), username]
      );
      await conn.query(
        `UPDATE Articulos SET alerta_stock = (
           SELECT CASE WHEN MIN(a2.stock_actual) <= stock_minimo THEN 1 ELSE 0 END
           FROM Articulo_Marca_Precio a2 WHERE a2.articulo_id = ?
         ) WHERE articulo_id = ?`,
        [d.articulo_id, d.articulo_id]
      );
    }
    await conn.query(
      `UPDATE Comprobante SET estado = 'anulado' WHERE venta_id = ? AND estado = 'emitido'`,
      [id]
    );
    await conn.query(`UPDATE Venta SET estado = 'anulada' WHERE venta_id = ?`, [id]);
    const [[v]] = await conn.query(`SELECT cotizacion_id FROM Venta WHERE venta_id = ?`, [id]);
    if (v?.cotizacion_id) {
      await conn.query(
        `UPDATE Cotizacion SET estado = 'rechazada' WHERE cotizacion_id = ?`,
        [v.cotizacion_id]
      );
    }
  },
};

module.exports = Venta;
