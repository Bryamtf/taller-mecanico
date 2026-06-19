const pool = require('../config/database');

const obtenerTodas = async () => {
    const [rows] = await pool.query(`SELECT * FROM Marca_Repuesto ORDER BY nombre ASC`);
    return rows;
};

const obtenerPorId = async (id) => {
    const [rows] = await pool.query(`SELECT * FROM Marca_Repuesto WHERE marca_id = ?`, [id]);
    return rows[0];
};

const crear = async (nombre) => {
    const [result] = await pool.query(`INSERT INTO Marca_Repuesto (nombre) VALUES (?)`, [nombre]);
    return result.insertId; 
};

const actualizar = async (id, nombre) => {
    const [result] = await pool.query(`UPDATE Marca_Repuesto SET nombre = ? WHERE marca_id = ?`, [nombre, id]);
    return result.affectedRows > 0;
};

const eliminar = async (id) => {
    const [result] = await pool.query(`DELETE FROM Marca_Repuesto WHERE marca_id = ?`, [id]);
    return result.affectedRows > 0;
};

module.exports = { obtenerTodas, obtenerPorId, crear, actualizar, eliminar };