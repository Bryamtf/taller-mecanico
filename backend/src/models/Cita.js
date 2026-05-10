const { pool } = require('../config/database');

const obtenerCitasCompletas = async () => {
    const query = `
        SELECT 
            c.cita_id, 
            c.fecha_hora, 
            c.estado, 
            c.tipo_servicio, 
            c.descripcion_problema,
            cli.nombres, 
            cli.apellidos, 
            cli.telefono,
            v.placa, 
            v.marca, 
            v.modelo
        FROM Cita c
        INNER JOIN Cliente cli ON c.cliente_id = cli.cliente_id
        INNER JOIN Vehiculo v ON c.vehiculo_id = v.vehiculo_id
        ORDER BY c.fecha_hora DESC;
    `;
    const [rows] = await pool.query(query);
    return rows;
};

const crearCita = async (datosCita) => {
    const query = `
        INSERT INTO Cita (cliente_id, vehiculo_id, fecha_hora, tipo_servicio, descripcion_problema, estado)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const valores = [
        datosCita.cliente_id,
        datosCita.vehiculo_id,
        datosCita.fecha_hora,
        datosCita.tipo_servicio || null,
        datosCita.descripcion_problema || null,
        datosCita.estado || 'pendiente' 
    ];

    try {
        const [result] = await pool.query(query, valores);
        return result; 
    } catch (error) {
        console.error("Error al insertar en cita:", error);
        throw error; 
    }
};

module.exports = { obtenerCitasCompletas, crearCita };