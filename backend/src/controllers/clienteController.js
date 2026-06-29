const Cliente = require('../models/Cliente');
const Vehiculo = require('../models/Vehiculo');

const listarClientes = async (req, res) => {
    try {
        const pagina  = parseInt(req.query.pagina)  || 1;
        const limite  = parseInt(req.query.limite)  || 10;
        const busqueda = req.query.busqueda || '';
        const activo  = req.query.activo !== undefined ? parseInt(req.query.activo) : null;

        const resultado = await Cliente.listar({ pagina, limite, busqueda, activo });
        res.json(resultado);
    } catch (error) {
        console.error('Error al listar clientes:', error);
        res.status(500).json({ message: 'Error al obtener los clientes' });
    }
};

const obtenerCliente = async (req, res) => {
    try {
        const cliente = await Cliente.buscarPorId(req.params.id);
        if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

        cliente.vehiculos = await Vehiculo.buscarPorCliente(cliente.cliente_id);
        res.json(cliente);
    } catch (error) {
        console.error('Error al obtener cliente:', error);
        res.status(500).json({ message: 'Error al obtener el cliente' });
    }
};

const buscarClientes = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json({ resultados: [] });

        const clientes = await Cliente.buscarPorNombreOApellido(q);
        for (const cliente of clientes) {
            cliente.vehiculos = await Vehiculo.buscarPorCliente(cliente.cliente_id);
        }

        res.json({ resultados: clientes });
    } catch (error) {
        console.error('Error al buscar clientes:', error);
        res.status(500).json({ message: 'Error en el servidor al buscar clientes' });
    }
};

const crearCliente = async (req, res) => {
    try {
        const { nombres, apellidos, dni_ruc, telefono, email, direccion, vehiculo } = req.body;

        if (!nombres || !apellidos) {
            return res.status(400).json({ message: 'Nombres y apellidos son obligatorios' });
        }

        const resultado = await Cliente.crearCliente({ nombres, apellidos, dni_ruc, telefono, email, direccion });
        const nuevoClienteId = resultado.insertId;

        let nuevoVehiculoId = null;
        if (vehiculo && vehiculo.placa) {
            vehiculo.cliente_id = nuevoClienteId;
            nuevoVehiculoId = await Vehiculo.crear(vehiculo);
        }

        res.status(201).json({
            message: 'Cliente registrado exitosamente',
            cliente_id: nuevoClienteId,
            vehiculo_id: nuevoVehiculoId,
        });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ message: 'Error al registrar el cliente' });
    }
};

const obtenerClienteVarios = async (req, res) => {
    try {
        const [rows] = await require('../config/database').query(
            `SELECT cliente_id, nombres, apellidos, dni_ruc, telefono FROM Cliente WHERE dni_ruc = '00000000' LIMIT 1`
        );
        if (!rows.length) return res.status(404).json({ message: 'Cliente Varios no configurado.' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener cliente varios:', error);
        res.status(500).json({ message: 'Error al obtener cliente varios.' });
    }
};

const actualizarCliente = async (req, res) => {
    try {
        const { nombres, apellidos, dni_ruc, telefono, email, direccion } = req.body;

        if (!nombres || !apellidos) {
            return res.status(400).json({ message: 'Nombres y apellidos son obligatorios' });
        }

        const existente = await Cliente.buscarPorId(req.params.id);
        if (!existente) return res.status(404).json({ message: 'Cliente no encontrado' });

        const dniAGuardar = existente.dni_ruc === '00000000' ? '00000000' : dni_ruc;

        const actualizado = await Cliente.actualizar(req.params.id, { nombres, apellidos, dni_ruc: dniAGuardar, telefono, email, direccion });
        if (!actualizado) return res.status(404).json({ message: 'Cliente no encontrado' });

        res.json({ message: 'Cliente actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({ message: 'Error al actualizar el cliente' });
    }
};

const cambiarEstadoCliente = async (req, res) => {
    try {
        const { activo } = req.body;
        if (activo === undefined) {
            return res.status(400).json({ message: 'El campo activo es requerido' });
        }

        const existente = await Cliente.buscarPorId(req.params.id);
        if (!existente) return res.status(404).json({ message: 'Cliente no encontrado' });

        if (existente.dni_ruc === '00000000' && !activo) {
            return res.status(400).json({ message: 'El cliente "Clientes Varios" no puede ser desactivado.' });
        }

        const actualizado = await Cliente.cambiarEstado(req.params.id, activo ? 1 : 0);
        if (!actualizado) return res.status(404).json({ message: 'Cliente no encontrado' });

        res.json({ message: `Cliente ${activo ? 'activado' : 'desactivado'} correctamente` });
    } catch (error) {
        console.error('Error al cambiar estado del cliente:', error);
        res.status(500).json({ message: 'Error al cambiar el estado del cliente' });
    }
};

module.exports = {
    listarClientes,
    obtenerCliente,
    buscarClientes,
    crearCliente,
    actualizarCliente,
    cambiarEstadoCliente,
    obtenerClienteVarios,
};
