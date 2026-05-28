const Marca = require('../models/Marca');

const obtenerMarcas = async (req, res) => {
    try {
        const marcas = await Marca.obtenerTodas();
        res.json(marcas);
    } catch (error) {
        console.error("Error en obtenerMarcas:", error);
        res.status(500).json({ message: "Error al obtener las marcas." });
    }
};

const obtenerMarca = async (req, res) => {
    try {
        const marca = await Marca.obtenerPorId(req.params.id);
        if (!marca) {
            return res.status(404).json({ message: "Marca no encontrada." });
        }
        res.json(marca);
    } catch (error) {
        console.error("Error en obtenerMarca:", error);
        res.status(500).json({ message: "Error al obtener la marca." });
    }
};

const crearMarca = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) {
            return res.status(400).json({ message: "El nombre de la marca es obligatorio." });
        }

        const nuevaMarcaId = await Marca.crear(nombre);
        res.status(201).json({ message: "Marca creada exitosamente.", marca_id: nuevaMarcaId });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Ya existe una marca con ese nombre." });
        }
        console.error("Error en crearMarca:", error);
        res.status(500).json({ message: "Error interno al crear la marca." });
    }
};

const actualizarMarca = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({ message: "El nombre de la marca es obligatorio." });
        }

        const actualizado = await Marca.actualizar(id, nombre);
        if (!actualizado) {
            return res.status(404).json({ message: "Marca no encontrada." });
        }

        res.json({ message: "Marca actualizada exitosamente." });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Ya existe otra marca con ese nombre." });
        }
        console.error("Error en actualizarMarca:", error);
        res.status(500).json({ message: "Error interno al actualizar la marca." });
    }
};

const eliminarMarca = async (req, res) => {
    try {
        const eliminado = await Marca.eliminar(req.params.id);
        if (!eliminado) {
            return res.status(404).json({ message: "Marca no encontrada." });
        }
        res.json({ message: "Marca eliminada exitosamente." });

    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ 
                message: "No puedes eliminar esta marca porque ya está asociada a uno o más repuestos en tu inventario." 
            });
        }
        console.error("Error en eliminarMarca:", error);
        res.status(500).json({ message: "Error interno al eliminar la marca." });
    }
};

module.exports = { obtenerMarcas, obtenerMarca, crearMarca, actualizarMarca, eliminarMarca };