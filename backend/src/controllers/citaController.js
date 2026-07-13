const Cita = require('../models/Cita');

const ESTADOS_VALIDOS = ['pendiente', 'confirmada', 'en_proceso', 'en_espera_repuesto', 'finalizada', 'cancelada'];

const obtenerCitas = async (req, res) => {
    try {
        const { pagina = 1, busqueda = '', estado = '', fechaDesde = '', fechaHasta = '' } = req.query;
        const resultado = await Cita.listar({
            pagina: Number(pagina),
            limite: 10,
            busqueda,
            estado,
            fechaDesde,
            fechaHasta,
        });
        res.json(resultado);
    } catch (error) {
        console.error("Error en obtenerCitas:", error);
        res.status(500).json({ message: "Error del servidor al obtener citas" });
    }
};

const obtenerCitaPorId = async (req, res) => {
    try {
        const cita = await Cita.obtenerPorId(req.params.id);
        if (!cita) return res.status(404).json({ message: "Cita no encontrada" });
        res.json(cita);
    } catch (error) {
        console.error("Error en obtenerCitaPorId:", error);
        res.status(500).json({ message: "Error del servidor al obtener la cita" });
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

const actualizarCita = async (req, res) => {
    try {
        const { id } = req.params;
        const datosCita = req.body;

        if (!datosCita.cliente_id || !datosCita.vehiculo_id || !datosCita.fecha_hora) {
            return res.status(400).json({
                message: "El cliente, el vehículo y la fecha/hora son obligatorios."
            });
        }

        await Cita.actualizar(id, datosCita);
        res.json({ message: "Cita actualizada exitosamente" });
    } catch (error) {
        console.error("Error en actualizarCita:", error);
        res.status(500).json({ message: "Error interno al actualizar la cita" });
    }
};

const cambiarEstadoCita = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!ESTADOS_VALIDOS.includes(estado)) {
            return res.status(400).json({ message: "Estado no válido" });
        }

        await Cita.cambiarEstado(id, estado);
        res.json({ message: "Estado de la cita actualizado" });
    } catch (error) {
        console.error("Error en cambiarEstadoCita:", error);
        if (error.message === 'Cita no encontrada') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Error interno al cambiar el estado de la cita" });
    }
};

const eliminarCita = async (req, res) => {
    try {
        const { id } = req.params;
        await Cita.eliminar(id);
        res.json({ message: "Cita eliminada exitosamente" });
    } catch (error) {
        console.error("Error en eliminarCita:", error);
        res.status(500).json({ message: "Error interno al eliminar la cita" });
    }
};

module.exports = {
    obtenerCitas,
    obtenerCitaPorId,
    crearNuevaCita,
    actualizarCita,
    cambiarEstadoCita,
    eliminarCita,
};
