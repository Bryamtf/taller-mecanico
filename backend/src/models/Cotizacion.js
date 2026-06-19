const pool = require("../config/database");
const DetalleCotizacion = require("../models/DetalleCotizacion");

const Cotizacion = {
  async crear(data, conn = null) {
    const {
      cliente_id,
      vehiculo_id,
      cita_id,
      creado_por,
      es_modelo,
      nombre_modelo,
      cotizacion_origen_id,
      kilometraje_momento,
      subtotal,
      descuento,
      igv,
      total,
      fecha_emision,
      fecha_vencimiento,
      fecha_entrega,
      observaciones,
      numero_cotizacion,
    } = data;
    console.log("Datos recibidos para creación:", data);
    const [result] = await (conn || pool).execute(
      `INSERT INTO Cotizacion (
            cliente_id, vehiculo_id, cita_id, creado_por,
            es_modelo, nombre_modelo, cotizacion_origen_id,
            estado, kilometraje_momento, subtotal, descuento, igv, total,
            fecha_emision, fecha_vencimiento, fecha_entrega, observaciones,
            numero_cotizacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'borrador', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente_id,
        vehiculo_id,
        cita_id || null,
        creado_por,
        es_modelo || 0,
        nombre_modelo || null,
        cotizacion_origen_id || null,
        kilometraje_momento || null,
        subtotal,
        descuento,
        igv,
        total,
        fecha_emision,
        fecha_vencimiento || null,
        fecha_entrega || null,
        observaciones || null,
        numero_cotizacion || null,
      ],
    );
    return result.insertId;
  },

  async encontrarPorId(id, conn = null) {
    const db = conn || pool;
    const [rows] = await db.execute(
      `SELECT c.*, 
                c.numero_cotizacion,
                CONCAT(cli.nombres, ' ', cli.apellidos) as cliente_nombre,
                cli.dni_ruc, cli.telefono, cli.email,
                v.placa, v.marca, v.modelo, v.color, v.anio, v.vin
         FROM Cotizacion c
         JOIN Cliente cli ON c.cliente_id = cli.cliente_id
         JOIN Vehiculo v ON c.vehiculo_id = v.vehiculo_id
         WHERE c.cotizacion_id = ? AND (c.deleted_at IS NULL OR c.deleted_at IS NULL)`,
      [id],
    );

    if (rows.length === 0) return null;

    const [detalles] = await pool.execute(
      `SELECT dc.*, 
                a.nombre as articulo_nombre, a.codigo_interno,
                m.nombre as marca
         FROM Detalle_cotizacion dc
         LEFT JOIN Articulos a ON dc.articulo_id = a.articulo_id
         LEFT JOIN Marca_Repuesto m ON dc.marca_id = m.marca_id
         WHERE dc.cotizacion_id = ?`,
      [id],
    );

    return { ...rows[0], detalles };
  },

  async listarCotizaciones(filtros = {}) {
    let sql = `SELECT c.cotizacion_id, 
                      c.numero_cotizacion,
                      c.estado,
                      c.fecha_emision,
                      c.total,
                      CONCAT(cli.nombres, ' ', cli.apellidos) as cliente_nombre,
                      v.placa
               FROM Cotizacion c
               JOIN Cliente cli ON c.cliente_id = cli.cliente_id
               JOIN Vehiculo v ON c.vehiculo_id = v.vehiculo_id
               WHERE (c.deleted_at IS NULL OR c.deleted_at IS NULL)`;
    const params = [];

    if (filtros.estado) {
      sql += ` AND c.estado = ?`;
      params.push(filtros.estado);
    }

    if (filtros.cliente_id) {
      sql += ` AND c.cliente_id = ?`;
      params.push(filtros.cliente_id);
    }

    if (filtros.es_modelo !== undefined) {
      sql += ` AND c.es_modelo = ?`;
      params.push(filtros.es_modelo);
    }

    sql += ` ORDER BY c.cotizacion_id DESC`;

    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  async actualizarEstado(id, estado) {
    const estadosValidos = [
      "borrador",
      "pendiente",
      "aprobada",
      "rechazada",
      "vencida",
      "cancelada",
    ];
    if (!estadosValidos.includes(estado)) {
      throw new Error("Estado no válido");
    }

    const [result] = await pool.execute(
      `UPDATE Cotizacion SET estado = ? WHERE cotizacion_id = ?`,
      [estado, id],
    );
    return result.affectedRows > 0;
  },

  async actualizarCotizacion(id, data, conn = null) {
    const db = conn || pool;
    const fields = [];
    const values = [];
    const allowed = [
      "cliente_id",
      "vehiculo_id",
      "cita_id",
      "creado_por",
      "es_modelo",
      "nombre_modelo",
      "cotizacion_origen_id",
      "estado",
      "kilometraje_momento",
      "subtotal",
      "descuento",
      "igv",
      "total",
      "fecha_emision",
      "fecha_vencimiento",
      "fecha_entrega",
      "observaciones",
      "pdf_path",
      "token_publico",
      "token_expira",
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return false;
    values.push(id);
    const [result] = await db.execute(
      `UPDATE Cotizacion SET ${fields.join(", ")} WHERE cotizacion_id = ?`,
      values,
    );

    return result.affectedRows > 0;
  },

  async eliminar(id) {
    const [result] = await pool.execute(
      `UPDATE Cotizacion SET deleted_at = NOW(), estado = 'cancelada' 
         WHERE cotizacion_id = ? AND deleted_at IS NULL`,
      [id],
    );
    return result.affectedRows > 0;
  },

  async clonar(fromId, nuevoCreadoPor, nuevasFechas = true) {
    const original = await this.encontrarPorId(fromId);
    if (!original) return null;
    const nuevaCotizacion = {
      cliente_id: original.cliente_id,
      vehiculo_id: original.vehiculo_id,
      creado_por: nuevoCreadoPor,
      es_modelo: 0,
      cotizacion_origen_id: fromId,
      subtotal: original.subtotal,
      descuento: original.descuento,
      igv: original.igv,
      total: original.total,
      fecha_emision: nuevasFechas
        ? new Date().toISOString().split("T")[0]
        : original.fecha_emision,
      fecha_entrega: original.fecha_entrega,
      observaciones: original.observaciones,
    };

    const nuevoId = await this.crear(nuevaCotizacion);

    for (const detalle of original.detalles) {
      await DetalleCotizacion.crear({
        cotizacion_id: nuevoId,
        articulo_id: detalle.articulo_id,
        marca_id: detalle.marca_id,
        descripcion_custom: detalle.descripcion_custom,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        descuento: detalle.descuento,
        subtotal: detalle.subtotal,
        es_servicio: detalle.es_servicio,
      });
    }
    return nuevoId;
  },

  async generarTokenPublico(id) {
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    await pool.execute(
      `UPDATE Cotizacion SET token_publico = ?, token_expira = DATE_ADD(NOW(), INTERVAL 30 DAY) 
             WHERE cotizacion_id = ?`,
      [token, id],
    );
    return token;
  },

  async encontrarToken(token) {
    const [rows] = await pool.execute(
      `SELECT c.*, 
                    CONCAT(cli.nombres, ' ', cli.apellidos) as cliente_nombre,
                    v.placa, v.marca, v.modelo
             FROM Cotizacion c
             JOIN Cliente cli ON c.cliente_id = cli.cliente_id
             JOIN Vehiculo v ON c.vehiculo_id = v.vehiculo_id
             WHERE c.token_publico = ? AND c.token_expira > NOW()`,
      [token],
    );
    if (rows.length === 0) return null;
    const [detalles] = await pool.execute(
      `SELECT * FROM Detalle_cotizacion WHERE cotizacion_id = ?`,
      [rows[0].cotizacion_id],
    );
    return { ...rows[0], detalles };
  },
};
module.exports = Cotizacion;
