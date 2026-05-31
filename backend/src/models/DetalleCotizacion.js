const pool = require("../config/database");
const DetalleCotizacion = {
  async crear(data, conn = null) {
    const {
      cotizacion_id,
      articulo_id,
      marca_id,
      descripcion_custom,
      cantidad,
      precio_unitario,
      descuento,
      subtotal,
      es_servicio,
    } = data;

    const [result] = await (conn || pool).execute(
      `INSERT INTO Detalle_cotizacion (
                cotizacion_id, articulo_id, marca_id, descripcion_custom,
                cantidad, precio_unitario, descuento, subtotal, es_servicio
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cotizacion_id,
        articulo_id || null,
        marca_id || null,
        descripcion_custom || null,
        cantidad,
        precio_unitario,
        descuento || 0,
        subtotal,
        es_servicio || 0,
      ],
    );
    return result.insertId;
  },
  async eliminarPorCotizacionId(cotizacion_id) {
    const [result] = await pool.execute(
      `DELETE FROM Detalle_cotizacion WHERE cotizacion_id = ?`,
      [cotizacion_id],
    );
    return result.affectedRows;
  },
  async actualizarDetalle(id, data) {
    const fields = [];
    const values = [];

    const allowed = ["cantidad", "precio_unitario", "descuento", "subtotal"];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE Detalle_cotizacion SET ${fields.join(", ")} WHERE detalle_id = ?`,
      values,
    );

    return result.affectedRows > 0;
  },
};
module.exports = DetalleCotizacion;
