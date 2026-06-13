const pool = require('../config/database');
const generarCodigoIncidencia = require('../utils/generarCodigoIncidencia');

// Matriz urgencia × impacto → prioridad
const calcularPrioridad = (urgencia, impacto) => {
  const matriz = {
    alta:  { alto: 'critica', medio: 'alta',  bajo: 'media' },
    media: { alto: 'alta',   medio: 'media', bajo: 'baja'  },
    baja:  { alto: 'media',  medio: 'baja',  bajo: 'baja'  },
  };
  return matriz[urgencia]?.[impacto] ?? 'media';
};

const listar = async ({ pagina = 1, limite = 10, busqueda = '', estado = '', prioridad = '', categoria = '' }) => {
  const offset = (pagina - 1) * limite;
  const params = [];

  let where = 'WHERE i.activo = 1';

  if (busqueda) {
    where += ' AND (i.titulo LIKE ? OR i.codigo LIKE ? OR i.descripcion LIKE ?)';
    params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
  }
  if (estado)     { where += ' AND i.estado = ?';    params.push(estado); }
  if (prioridad)  { where += ' AND i.prioridad = ?'; params.push(prioridad); }
  if (categoria)  { where += ' AND i.categoria = ?'; params.push(categoria); }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM Incidencia i ${where}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT
      i.incidencia_id, i.codigo, i.titulo, i.categoria, i.canal_entrada,
      i.urgencia, i.impacto, i.prioridad, i.estado,
      i.reportado_por, i.asignado_a,
      c.nombres AS cliente_nombres, c.apellidos AS cliente_apellidos,
      v.placa, v.marca AS vehiculo_marca, v.modelo AS vehiculo_modelo,
      i.fecha_registro, i.fecha_asignacion, i.fecha_resolucion, i.fecha_cierre
     FROM Incidencia i
     LEFT JOIN Cliente  c ON i.cliente_id  = c.cliente_id
     LEFT JOIN Vehiculo v ON i.vehiculo_id = v.vehiculo_id
     ${where}
     ORDER BY
       FIELD(i.prioridad, 'critica', 'alta', 'media', 'baja'),
       i.fecha_registro ASC
     LIMIT ? OFFSET ?`,
    [...params, limite, offset]
  );

  return {
    total: Number(total),
    totalPaginas: Math.ceil(Number(total) / limite),
    datos: rows,
  };
};

const obtenerPorId = async (id) => {
  const [[incidencia]] = await pool.query(
    `SELECT
      i.*,
      c.nombres AS cliente_nombres, c.apellidos AS cliente_apellidos, c.telefono AS cliente_telefono,
      v.placa, v.marca AS vehiculo_marca, v.modelo AS vehiculo_modelo,
      ci.tipo_servicio, ci.descripcion_problema,
      a.nombre AS articulo_nombre
     FROM Incidencia i
     LEFT JOIN Cliente   c  ON i.cliente_id  = c.cliente_id
     LEFT JOIN Vehiculo  v  ON i.vehiculo_id = v.vehiculo_id
     LEFT JOIN Cita      ci ON i.cita_id     = ci.cita_id
     LEFT JOIN Articulos a  ON i.articulo_id = a.articulo_id
     WHERE i.incidencia_id = ? AND i.activo = 1`,
    [id]
  );

  if (!incidencia) return null;

  const [historial] = await pool.query(
    `SELECT h.historial_id, h.tipo_accion, h.descripcion,
            h.estado_anterior, h.estado_nuevo, h.realizado_por,
            u.nombre_completo, h.fecha
     FROM Incidencia_Historial h
     LEFT JOIN Usuario u ON h.realizado_por = u.username
     WHERE h.incidencia_id = ?
     ORDER BY h.fecha DESC`,
    [id]
  );

  const [imagenes] = await pool.query(
    `SELECT imagen_id, ruta_archivo, descripcion, subido_por, fecha_subida
     FROM Imagenes
     WHERE incidencia_id = ?
     ORDER BY fecha_subida ASC`,
    [id]
  );

  return { ...incidencia, historial, imagenes };
};

const crear = async (datos, archivos = []) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const codigo     = await generarCodigoIncidencia(conn);
    const prioridad  = calcularPrioridad(datos.urgencia, datos.impacto);

    const [result] = await conn.query(
      `INSERT INTO Incidencia
         (codigo, titulo, descripcion, categoria, canal_entrada,
          urgencia, impacto, prioridad, estado,
          cliente_id, vehiculo_id, cita_id, articulo_id, token_id,
          reportado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'abierta', ?, ?, ?, ?, ?, ?)`,
      [
        codigo, datos.titulo, datos.descripcion, datos.categoria,
        datos.canal_entrada || 'interno',
        datos.urgencia, datos.impacto, prioridad,
        datos.cliente_id  || null,
        datos.vehiculo_id || null,
        datos.cita_id     || null,
        datos.articulo_id || null,
        datos.token_id    || null,
        datos.reportado_por || null,
      ]
    );

    const incidencia_id = result.insertId;

    // Primer entrada automática en historial
    await conn.query(
      `INSERT INTO Incidencia_Historial
         (incidencia_id, tipo_accion, descripcion, estado_nuevo, realizado_por)
       VALUES (?, 'nota', 'Incidencia registrada en el sistema', 'abierta', ?)`,
      [incidencia_id, datos.reportado_por || null]
    );

    // Imágenes adjuntas
    for (const archivo of archivos) {
      await conn.query(
        `INSERT INTO Imagenes (incidencia_id, ruta_archivo, tipo, subido_por)
         VALUES (?, ?, 'antes', ?)`,
        [incidencia_id, archivo.ruta, datos.reportado_por || null]
      );
    }

    await conn.commit();
    return { incidencia_id, codigo };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const actualizar = async (id, datos) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const prioridad = calcularPrioridad(datos.urgencia, datos.impacto);

    await conn.query(
      `UPDATE Incidencia SET
         titulo = ?, descripcion = ?, categoria = ?,
         urgencia = ?, impacto = ?, prioridad = ?,
         cliente_id = ?, vehiculo_id = ?, cita_id = ?, articulo_id = ?,
         asignado_a = ?, solucion = ?, categoria_cierre = ?
       WHERE incidencia_id = ? AND activo = 1`,
      [
        datos.titulo, datos.descripcion, datos.categoria,
        datos.urgencia, datos.impacto, prioridad,
        datos.cliente_id  || null,
        datos.vehiculo_id || null,
        datos.cita_id     || null,
        datos.articulo_id || null,
        datos.asignado_a      || null,
        datos.solucion        || null,
        datos.categoria_cierre || null,
        id,
      ]
    );

    await conn.query(
      `INSERT INTO Incidencia_Historial
         (incidencia_id, tipo_accion, descripcion, realizado_por)
       VALUES (?, 'nota', 'Incidencia actualizada', ?)`,
      [id, datos.realizado_por || null]
    );

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const cambiarEstado = async (id, nuevoEstado, realizado_por, descripcion = '') => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[inc]] = await conn.query(
      `SELECT estado, fecha_asignacion FROM Incidencia WHERE incidencia_id = ? AND activo = 1`,
      [id]
    );
    if (!inc) throw new Error('Incidencia no encontrada');

    const estadoAnterior = inc.estado;

    // Fechas automáticas según el nuevo estado
    let extraFields = '';
    if (nuevoEstado === 'en_proceso' && !inc.fecha_asignacion) {
      extraFields = ', fecha_asignacion = NOW()';
    }
    if (nuevoEstado === 'resuelta') extraFields += ', fecha_resolucion = NOW()';
    if (nuevoEstado === 'cerrada')  extraFields += ', fecha_cierre = NOW()';

    await conn.query(
      `UPDATE Incidencia SET estado = ? ${extraFields} WHERE incidencia_id = ?`,
      [nuevoEstado, id]
    );

    await conn.query(
      `INSERT INTO Incidencia_Historial
         (incidencia_id, tipo_accion, descripcion, estado_anterior, estado_nuevo, realizado_por)
       VALUES (?, 'cambio_estado', ?, ?, ?, ?)`,
      [
        id,
        descripcion || `Estado cambiado de "${estadoAnterior}" a "${nuevoEstado}"`,
        estadoAnterior,
        nuevoEstado,
        realizado_por || null,
      ]
    );

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const asignar = async (id, asignado_a, realizado_por) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE Incidencia
       SET asignado_a = ?,
           fecha_asignacion = COALESCE(fecha_asignacion, NOW())
       WHERE incidencia_id = ? AND activo = 1`,
      [asignado_a, id]
    );

    await conn.query(
      `INSERT INTO Incidencia_Historial
         (incidencia_id, tipo_accion, descripcion, realizado_por)
       VALUES (?, 'asignacion', ?, ?)`,
      [id, `Asignada a: ${asignado_a}`, realizado_por || null]
    );

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const agregarNota = async (id, descripcion, realizado_por) => {
  await pool.query(
    `INSERT INTO Incidencia_Historial
       (incidencia_id, tipo_accion, descripcion, realizado_por)
     VALUES (?, 'nota', ?, ?)`,
    [id, descripcion, realizado_por || null]
  );
};

const desactivar = async (id, realizado_por) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE Incidencia SET activo = 0 WHERE incidencia_id = ? AND activo = 1`,
      [id]
    );

    await conn.query(
      `INSERT INTO Incidencia_Historial
         (incidencia_id, tipo_accion, descripcion, realizado_por)
       VALUES (?, 'nota', 'Incidencia eliminada del sistema', ?)`,
      [id, realizado_por || null]
    );

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  cambiarEstado,
  asignar,
  agregarNota,
  desactivar,
};
