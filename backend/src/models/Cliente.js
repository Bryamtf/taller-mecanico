const pool = require('../config/database');

const listar = async ({ pagina = 1, limite = 10, busqueda = '', activo = null } = {}) => {
    const offset = (pagina - 1) * limite;
    const filtro = `%${busqueda}%`;

    let whereClause = 'WHERE (c.nombres LIKE ? OR c.apellidos LIKE ? OR c.dni_ruc LIKE ?)';
    const params = [filtro, filtro, filtro];

    if (activo !== null) {
        whereClause += ' AND c.activo = ?';
        params.push(activo);
    }

    const [clientes] = await pool.query(
        `SELECT c.cliente_id, c.nombres, c.apellidos, c.dni_ruc, c.telefono, c.email,
                c.direccion, c.activo, c.fecha_registro,
                COUNT(v.vehiculo_id) AS total_vehiculos
         FROM Cliente c
         LEFT JOIN Vehiculo v ON v.cliente_id = c.cliente_id
         ${whereClause}
         GROUP BY c.cliente_id
         ORDER BY c.fecha_registro DESC
         LIMIT ? OFFSET ?`,
        [...params, limite, offset]
    );

    const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) AS total FROM Cliente c ${whereClause}`,
        params
    );

    return { clientes, total, pagina, totalPaginas: Math.ceil(total / limite) };
};

const buscarPorNombreOApellido = async (termino) => {
    const busqueda = `%${termino}%`;
    const [rows] = await pool.query(
        `SELECT cliente_id, nombres, apellidos, dni_ruc, telefono, email
         FROM Cliente
         WHERE nombres LIKE ? OR apellidos LIKE ? OR dni_ruc LIKE ?
         LIMIT 10`,
        [busqueda, busqueda, busqueda]
    );
    return rows;
};

const buscarPorId = async (cliente_id) => {
    const [rows] = await pool.query(
        `SELECT cliente_id, nombres, apellidos, dni_ruc, telefono, email, direccion, activo, fecha_registro
         FROM Cliente
         WHERE cliente_id = ?
         LIMIT 1`,
        [cliente_id]
    );
    return rows[0] || null;
};

const crearCliente = async (datos) => {
    const [result] = await pool.query(
        `INSERT INTO Cliente (nombres, apellidos, dni_ruc, telefono, email, direccion)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            datos.nombres,
            datos.apellidos,
            datos.dni_ruc    || null,
            datos.telefono   || null,
            datos.email      || null,
            datos.direccion  || null,
        ]
    );
    return result;
};

const actualizar = async (id, datos) => {
    const [result] = await pool.query(
        `UPDATE Cliente
         SET nombres = ?, apellidos = ?, dni_ruc = ?, telefono = ?, email = ?, direccion = ?
         WHERE cliente_id = ?`,
        [
            datos.nombres,
            datos.apellidos,
            datos.dni_ruc   || null,
            datos.telefono  || null,
            datos.email     || null,
            datos.direccion || null,
            id,
        ]
    );
    return result.affectedRows > 0;
};

const cambiarEstado = async (id, activo) => {
    const [result] = await pool.query(
        `UPDATE Cliente SET activo = ? WHERE cliente_id = ?`,
        [activo, id]
    );
    return result.affectedRows > 0;
};

module.exports = {
    listar,
    buscarPorNombreOApellido,
    buscarPorId,
    crearCliente,
    actualizar,
    cambiarEstado,
};
