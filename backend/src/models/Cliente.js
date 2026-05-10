const { pool } = require('../config/database');

const buscarPorNombreOApellido = async (termino) => {
    // Usamos LIKE para buscar coincidencias parciales mientras el usuario escribe
    const query = `
        SELECT cliente_id, nombres, apellidos, dni_ruc, telefono, email 
        FROM Cliente 
        WHERE nombres LIKE ? OR apellidos LIKE ? OR dni_ruc LIKE ?
        LIMIT 10;
    `;
    const busqueda = `%${termino}%`;
    const [rows] = await pool.query(query, [busqueda, busqueda, busqueda]);
    return rows;
};

const crearCliente = async (datosCliente) => {
    const query = `
        INSERT INTO Cliente (nombres, apellidos, dni_ruc, telefono, email, direccion)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const valores = [
        datosCliente.nombres,
        datosCliente.apellidos,
        datosCliente.dni_ruc || null,
        datosCliente.telefono || null,
        datosCliente.email || null,
        datosCliente.direccion || null
    ];

    const [result] = await pool.query(query, valores);
    return result;
};

module.exports = { buscarPorNombreOApellido, crearCliente };