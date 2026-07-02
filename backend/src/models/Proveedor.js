const pool = require('../config/database');

const Proveedor = {
  async listar({ pagina = 1, limite = 10, busqueda = '', activo = null } = {}) {
    const offset = (pagina - 1) * limite;
    const filtro = `%${busqueda}%`;

    const condiciones = ['(p.razon_social LIKE ? OR p.ruc LIKE ?)'];
    const params      = [filtro, filtro];

    if (activo !== null) {
      condiciones.push('p.activo = ?');
      params.push(activo);
    }

    const where = 'WHERE ' + condiciones.join(' AND ');

    const [rows] = await pool.query(
      `SELECT proveedor_id, razon_social, ruc, telefono, email, direccion, activo, fecha_registro
       FROM Proveedor p
       ${where}
       ORDER BY p.razon_social ASC
       LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM Proveedor p ${where}`,
      params
    );

    return {
      proveedores:  rows,
      total:        Number(total),
      pagina,
      totalPaginas: Math.ceil(Number(total) / limite),
    };
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT proveedor_id, razon_social, ruc, telefono, email, direccion, activo
       FROM Proveedor WHERE proveedor_id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async crear(datos) {
    const [result] = await pool.query(
      `INSERT INTO Proveedor (razon_social, ruc, telefono, email, direccion)
       VALUES (?, ?, ?, ?, ?)`,
      [
        datos.razon_social,
        datos.ruc       || null,
        datos.telefono  || null,
        datos.email     || null,
        datos.direccion || null,
      ]
    );
    return result.insertId;
  },

  async actualizar(id, datos) {
    const [result] = await pool.query(
      `UPDATE Proveedor
       SET razon_social = ?, ruc = ?, telefono = ?, email = ?, direccion = ?
       WHERE proveedor_id = ?`,
      [
        datos.razon_social,
        datos.ruc       || null,
        datos.telefono  || null,
        datos.email     || null,
        datos.direccion || null,
        id,
      ]
    );
    return result.affectedRows > 0;
  },

  async cambiarEstado(id, activo) {
    const [result] = await pool.query(
      `UPDATE Proveedor SET activo = ? WHERE proveedor_id = ?`,
      [activo, id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = Proveedor;
