const Cita = require('../models/Cita');

const obtenerCitas = async (req, res) => {
    try {
        const citas = await Cita.obtenerCitasCompletas();
        
        // Podemos enviar un resumen igual que en inventario si quieres mostrar tarjetitas
        const totalCitas = citas.length;
        const citasPendientes = citas.filter(c => c.estado === 'pendiente').length;

        res.json({
            resumen: { totalCitas, citasPendientes },
            citas: citas
        });
    } catch (error) {
        console.error("Error en obtenerCitas:", error);
        res.status(500).json({ message: "Error del servidor al obtener citas" });
    }
};

const crearNuevaCita = async (req, res) => {
    try {
        const datosCita = req.body;

        // Validación básica: Para una cita, mínimo necesitamos saber quién, qué carro y cuándo
        if (!datosCita.cliente_id || !datosCita.vehiculo_id || !datosCita.fecha_hora) {
            return res.status(400).json({ 
                message: "El cliente, el vehículo y la fecha/hora son obligatorios." 
            });
        }

        const resultado = await Cita.crearCita(datosCita);

        res.status(201).json({
            message: "Cita agendada exitosamente",
            id: resultado.insertId
        });

    } catch (error) {
        console.error("Error en crearNuevaCita (controlador):", error);
        res.status(500).json({ message: "Error interno al agendar la cita" });
    }
};

module.exports = { 
    obtenerCitas, 
    crearNuevaCita 
};