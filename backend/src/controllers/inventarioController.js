const Inventario = require('../models/Inventario');

const obtenerInventario = async (req, res) => {
    try {
        const productos = await Inventario.obtenerInventarioCompleto();
        
        const totalItems = productos.length;
        const stockTotal = productos.reduce((acc, item) => acc + (Number(item.stock_actual) || 0), 0);

        res.json({
            resumen: { totalItems, stockTotal },
            productos: productos
        });
    } catch (error) {
        console.error("Error en obtenerInventario:", error);
        res.status(500).json({ message: "Error del servidor al obtener existencias" });
    }
};

module.exports = { obtenerInventario };