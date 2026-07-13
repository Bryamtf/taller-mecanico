const pool = require('../config/database');

const listar = async ({ pagina = 1, limite = 10, busqueda = '', estado = '', fechaDesde = '', fechaHasta = '' }) => {
  const offset = (pagina - 1) * limite;
  const params = [];

  let where = 'WHERE 1 = 1';

  if (busqueda) {
    where += ' AND (cli.nombres LIKE ? OR cli.apellidos LIKE ? OR v.placa LIKE ?)';
    params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
  }
  if (estado)     { where += ' AND c.estado = ?';     params.push(estado); }
  if (fechaDesde) { where += ' AND c.fecha_hora >= ?'; params.push(`${fechaDesde} 00:00:00`); }
  if (fechaHasta) { where += ' AND c.fecha_hora <= ?'; params.push(`${fechaHasta} 23:59:59`); }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM Cita c
     INNER JOIN Cliente cli ON c.cliente_id = cli.cliente_id
     INNER JOIN Vehiculo v ON c.vehiculo_id = v.vehiculo_id
     ${where}`,
    params
  );

  const [[resumen]] = await pool.query(
    `SELECT
      COUNT(*) AS totalCitas,
      SUM(estado = 'pendiente')  AS citasPendientes,
      SUM(estado = 'en_proceso') AS enProceso
     FROM Cita`
  );

  const [rows] = await pool.query(
    `SELECT
      c.cita_id, c.fecha_hora, c.estado, c.tipo_servicio, c.descripcion_problema,
      c.atendido_por, c.observaciones_tecnico, c.fecha_estimada_entrega, c.fecha_registro,
      cli.cliente_id, cli.nombres, cli.apellidos, cli.telefono,
      v.vehiculo_id, v.placa, v.marca, v.modelo,
      u.nombre_completo AS tecnico_nombre
     FROM Cita c
     INNER JOIN Cliente cli ON c.cliente_id = cli.cliente_id
     INNER JOIN Vehiculo v ON c.vehiculo_id = v.vehiculo_id
     LEFT JOIN Usuario u ON c.atendido_por = u.username
     ${where}
     ORDER BY c.fecha_hora DESC
     LIMIT ? OFFSET ?`,
    [...params, limite, offset]
  );

  return {
    total: Number(total),
    totalPaginas: Math.ceil(Number(total) / limite),
    citas: rows,
    resumen: {
      totalCitas: Number(resumen.totalCitas ?? 0),
      citasPendientes: Number(resumen.citasPendientes ?? 0),
      enProceso: Number(resumen.enProceso ?? 0),
    },
  };
};

const obtenerPorId = async (id) => {
  const [[cita]] = await pool.query(
    `SELECT
      c.cita_id, c.cliente_id, c.vehiculo_id, c.fecha_hora, c.estado, c.tipo_servicio,
      c.descripcion_problema, c.atendido_por, c.observaciones_tecnico,
      c.fecha_estimada_entrega, c.fecha_registro,
      cli.nombres, cli.apellidos, cli.telefono, cli.email,
      v.placa, v.marca, v.modelo, v.anio,
      u.nombre_completo AS tecnico_nombre
     FROM Cita c
     INNER JOIN Cliente cli ON c.cliente_id = cli.cliente_id
     INNER JOIN Vehiculo v ON c.vehiculo_id = v.vehiculo_id
     LEFT JOIN Usuario u ON c.atendido_por = u.username
     WHERE c.cita_id = ?`,
    [id]
  );
  return cita || null;
};

const crearCita = async (datosCita) => {
    const query = `
        INSERT INTO Cita
          (cliente_id, vehiculo_id, fecha_hora, tipo_servicio, descripcion_problema,
           estado, atendido_por, fecha_estimada_entrega)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valores = [
        datosCita.cliente_id,
        datosCita.vehiculo_id,
        datosCita.fecha_hora,
        datosCita.tipo_servicio || null,
        datosCita.descripcion_problema || null,
        datosCita.estado || 'pendiente',
        datosCita.atendido_por || null,
        datosCita.fecha_estimada_entrega || null,
    ];

    try {
        const [result] = await pool.query(query, valores);
        return result;
    } catch (error) {
        console.error("Error al insertar en cita:", error);
        throw error;
    }
};

const actualizar = async (id, datos) => {
  await pool.query(
    `UPDATE Cita SET
       cliente_id = ?, vehiculo_id = ?, fecha_hora = ?, tipo_servicio = ?,
       descripcion_problema = ?, atendido_por = ?, observaciones_tecnico = ?,
       fecha_estimada_entrega = ?
     WHERE cita_id = ?`,
    [
      datos.cliente_id,
      datos.vehiculo_id,
      datos.fecha_hora,
      datos.tipo_servicio || null,
      datos.descripcion_problema || null,
      datos.atendido_por || null,
      datos.observaciones_tecnico || null,
      datos.fecha_estimada_entrega || null,
      id,
    ]
  );
};

const cambiarEstado = async (id, estado) => {
  const [[cita]] = await pool.query('SELECT cita_id FROM Cita WHERE cita_id = ?', [id]);
  if (!cita) throw new Error('Cita no encontrada');

  await pool.query('UPDATE Cita SET estado = ? WHERE cita_id = ?', [estado, id]);
};

const eliminar = async (id) => {
  await pool.query('DELETE FROM Cita WHERE cita_id = ?', [id]);
};

module.exports = {
  listar,
  obtenerPorId,
  crearCita,
  actualizar,
  cambiarEstado,
  eliminar,
};
