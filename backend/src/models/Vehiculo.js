const pool = require('../config/database');

const obtenerTodos = async () => {
    const [rows] = await pool.query(`
        SELECT v.*, c.nombres, c.apellidos, c.dni_ruc 
        FROM Vehiculo v
        JOIN Cliente c ON v.cliente_id = c.cliente_id
        ORDER BY v.fecha_registro DESC
    `);
    return rows;
};

const obtenerPorId = async (id) => {
    const [rows] = await pool.query(`SELECT * FROM Vehiculo WHERE vehiculo_id = ?`, [id]);
    return rows[0];
};

const crear = async (datos) => {
    const query = `
        INSERT INTO Vehiculo (cliente_id, placa, marca, modelo, anio, color, vin, tipo_combustible, kilometraje_actual, observaciones)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const valores = [
        datos.cliente_id, datos.placa, datos.marca, datos.modelo, 
        datos.anio || null, datos.color || null, datos.vin || null, 
        datos.tipo_combustible || null, datos.kilometraje_actual || null, datos.observaciones || null
    ];
    const [result] = await pool.query(query, valores);
    return result.insertId;
};

const actualizar = async (id, datos) => {
    const query = `
        UPDATE Vehiculo SET 
            marca = ?, modelo = ?, anio = ?, color = ?, vin = ?, 
            tipo_combustible = ?, kilometraje_actual = ?, observaciones = ?
        WHERE vehiculo_id = ?
    `;
    const valores = [
        datos.marca, datos.modelo, datos.anio || null, datos.color || null, 
        datos.vin || null, datos.tipo_combustible || null, datos.kilometraje_actual || null, 
        datos.observaciones || null, id
    ];
    const [result] = await pool.query(query, valores);
    return result.affectedRows > 0;
};

const eliminar = async (id) => {
    const [result] = await pool.query(`DELETE FROM Vehiculo WHERE vehiculo_id = ?`, [id]);
    return result.affectedRows > 0;
};

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, eliminar };