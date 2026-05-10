const Cliente = require('../models/Cliente');
const Vehiculo = require('../models/Vehiculo');

// Para el Autocompletado del Frontend
const buscarClientes = async (req, res) => {
    try {
        const { q } = req.query; // Ejemplo de URL: /api/clientes/buscar?q=Juan
        
        if (!q || q.length < 2) {
            return res.json({ resultados: [] }); // No buscar si hay menos de 2 letras
        }

        const clientes = await Cliente.buscarPorNombreOApellido(q);
        
        // Opcional: Si quieres enviar los vehículos de cada cliente encontrado
        for (let cliente of clientes) {
            cliente.vehiculos = await Vehiculo.buscarVehiculosPorCliente(cliente.cliente_id);
        }

        res.json({ resultados: clientes });
    } catch (error) {
        console.error("Error al buscar clientes:", error);
        res.status(500).json({ message: "Error en el servidor al buscar clientes" });
    }
};

// Guardar un Cliente Nuevo (Y su vehículo si viene en la petición)
const crearCliente = async (req, res) => {
    try {
        const { nombres, apellidos, telefono, vehiculo } = req.body;

        if (!nombres || !apellidos) {
            return res.status(400).json({ message: "Nombres y apellidos son obligatorios." });
        }

        // 1. Guardamos el cliente
        const resultadoCliente = await Cliente.crearCliente({ nombres, apellidos, telefono });
        const nuevoClienteId = resultadoCliente.insertId;
        
        let nuevoVehiculoId = null;

        // 2. Si el frontend nos mandó datos del vehículo, lo creamos de una vez
        if (vehiculo && vehiculo.placa) {
            vehiculo.cliente_id = nuevoClienteId; // Le asignamos el ID del cliente recién creado
            const resultadoVehiculo = await Vehiculo.crearVehiculo(vehiculo);
            nuevoVehiculoId = resultadoVehiculo.insertId;
        }

        res.status(201).json({
            message: "Cliente registrado exitosamente",
            cliente_id: nuevoClienteId,
            vehiculo_id: nuevoVehiculoId
        });

    } catch (error) {
        console.error("Error al crear cliente:", error);
        res.status(500).json({ message: "Error al registrar el cliente" });
    }
};

module.exports = { buscarClientes, crearCliente };