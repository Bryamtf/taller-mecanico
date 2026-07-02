const Proveedor = require('../models/Proveedor');

const listar = async (req, res) => {
    try {
        const pagina   = parseInt(req.query.pagina) || 1;
        const limite   = parseInt(req.query.limite) || 10;
        const busqueda = req.query.busqueda || '';
        const activo   = req.query.activo !== undefined ? Number(req.query.activo) : null;

        const resultado = await Proveedor.listar({ pagina, limite, busqueda, activo });
        res.json({ success: true, ...resultado });
    } catch (error) {
        console.error('Error en listar proveedores:', error);
        res.status(500).json({ success: false, message: 'Error al obtener proveedores' });
    }
};

const obtener = async (req, res) => {
    try {
        const proveedor = await Proveedor.buscarPorId(req.params.id);
        if (!proveedor) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
        res.json({ success: true, data: proveedor });
    } catch (error) {
        console.error('Error en obtener proveedor:', error);
        res.status(500).json({ success: false, message: 'Error al obtener proveedor' });
    }
};

const crear = async (req, res) => {
    try {
        const { razon_social, ruc, telefono, email, direccion } = req.body;
        if (!razon_social?.trim()) {
            return res.status(400).json({ success: false, message: 'La razón social es requerida' });
        }

        const id = await Proveedor.crear({ razon_social: razon_social.trim(), ruc, telefono, email, direccion });
        res.status(201).json({ success: true, message: 'Proveedor registrado correctamente', proveedor_id: id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Ya existe un proveedor con ese RUC' });
        }
        console.error('Error en crear proveedor:', error);
        res.status(500).json({ success: false, message: 'Error al registrar proveedor' });
    }
};

const actualizar = async (req, res) => {
    try {
        const { razon_social, ruc, telefono, email, direccion } = req.body;
        if (!razon_social?.trim()) {
            return res.status(400).json({ success: false, message: 'La razón social es requerida' });
        }

        const ok = await Proveedor.actualizar(req.params.id, { razon_social: razon_social.trim(), ruc, telefono, email, direccion });
        if (!ok) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });

        res.json({ success: true, message: 'Proveedor actualizado correctamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Ya existe un proveedor con ese RUC' });
        }
        console.error('Error en actualizar proveedor:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar proveedor' });
    }
};

const cambiarEstado = async (req, res) => {
    try {
        const { activo } = req.body;
        const ok = await Proveedor.cambiarEstado(req.params.id, activo);
        if (!ok) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
        res.json({ success: true, message: `Proveedor ${activo ? 'activado' : 'desactivado'} correctamente` });
    } catch (error) {
        console.error('Error en cambiarEstado proveedor:', error);
        res.status(500).json({ success: false, message: 'Error al cambiar estado del proveedor' });
    }
};

module.exports = { listar, obtener, crear, actualizar, cambiarEstado };
