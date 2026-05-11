const  pool  = require('../config/database');

const buscarVehiculosPorCliente = async (cliente_id) => {
    const query = `
        SELECT vehiculo_id, placa, marca, modelo, anio, color 
        FROM Vehiculo 
        WHERE cliente_id = ?
    `;
    const [rows] = await pool.query(query, [cliente_id]);
    return rows;
};

const crearVehiculo = async (datosVehiculo) => {
    const query = `
        INSERT INTO Vehiculo (cliente_id, placa, marca, modelo, anio, color)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const valores = [
        datosVehiculo.cliente_id,
        datosVehiculo.placa,
        datosVehiculo.marca || 'Por definir', // Valores por defecto si en tu form aún no los pides
        datosVehiculo.modelo || 'Por definir',
        datosVehiculo.anio || null,
        datosVehiculo.color || null
    ];

    const [result] = await pool.query(query, valores);
    return result;
};

module.exports = { buscarVehiculosPorCliente, crearVehiculo };