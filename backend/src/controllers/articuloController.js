const Articulo = require('../models/Articulo');

const crearNuevoArticulo = async (req, res) => {
    try {
        const datosArticulo = req.body;

        if (!datosArticulo.nombre || !datosArticulo.codigo_barras) {
            return res.status(400).json({ message: "El nombre y el código de barras son obligatorios." });
        }

        const resultado = await Articulo.crearArticulo(datosArticulo);

        res.status(201).json({
            message: "Artículo creado exitosamente con su marca y precio",
            id: resultado.insertId
        });

    } catch (error) {
        console.error("Error en crearNuevoArticulo:", error);
        res.status(500).json({ message: "Error interno al guardar el artículo" });
    }
};

const editarArticulo = async (req, res) => {
    try {
        const { id } = req.params; // Capturamos el ID de la URL
        const datosArticulo = req.body;

        if (!datosArticulo.nombre) {
            return res.status(400).json({ message: "El nombre del artículo es obligatorio para actualizar." });
        }

        await Articulo.actualizarArticulo(id, datosArticulo);
        res.json({ message: "Artículo actualizado correctamente" });

    } catch (error) {
        console.error("Error en editarArticulo:", error);
        res.status(500).json({ message: "Error al actualizar el artículo" });
    }
};

const eliminarArticulo = async (req, res) => {
    try {
        const { id } = req.params;
        const exito = await Articulo.eliminarLogicoArticulo(id);

        if (!exito) {
            return res.status(404).json({ message: "Artículo no encontrado" });
        }

        res.json({ message: "Artículo dado de baja (desactivado) exitosamente" });

    } catch (error) {
        console.error("Error en eliminarArticulo:", error);
        res.status(500).json({ message: "Error al eliminar el artículo" });
    }
};

const reactivarArticulo = async (req,res) => {
    try{
        const {id} = req.params;
        const exito = await Articulo.reactivarArticulo(id);

        if(!exito){
            return res.status(404).json({message:"Artículo no encontrado"});
        }

        res.json({message : "¡Artículo restaurado correcmente! Ya es visible en el inventario"});
    }catch (error){
        console.error("Error en reactivarArticulo:", error);
        res.status(500).json({ message: "Error al reactivar el artículo" });
    }  
}

module.exports = { crearNuevoArticulo, editarArticulo, eliminarArticulo, reactivarArticulo };