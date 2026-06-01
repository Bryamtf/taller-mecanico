const Inventario = require('../models/Inventario');

const obtenerInventario = async (req, res) => {
    try {
        const productos = await Inventario.obtenerInventarioCompleto();
        
        const totalItems = productos.length;
        const stockTotal = productos.reduce((acc, item) => acc + (Number(item.stock_actual) || 0), 0);

        res.json({
            success: true,
            resumen: { totalItems, stockTotal },
            productos: productos
        });
    } catch (error) {
        console.error("Error en obtenerInventario:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error del servidor al obtener existencias" 
        });
    }
};

const listarArticulos = async (req, res) => {
    try {
        const articulos = await Inventario.listarArticulos();
        
        res.json({
            success: true,
            data: articulos
        });
    } catch (error) {
        console.error("Error en listarArticulos:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al listar artículos" 
        });
    }
};

const buscarArticulos = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }
        
        const resultados = await Inventario.buscarArticulos(q);
        
        res.json({
            success: true,
            data: resultados
        });
    } catch (error) {
        console.error("Error en buscarArticulos:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al buscar artículos" 
        });
    }
};

const obtenerArticulo = async (req, res) => {
    try {
        const { id } = req.params;
        const articulo = await Inventario.obtenerPorId(id);
        
        if (!articulo) {
            return res.status(404).json({
                success: false,
                message: "Artículo no encontrado"
            });
        }
        
        res.json({
            success: true,
            data: articulo
        });
    } catch (error) {
        console.error("Error en obtenerArticulo:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error al obtener artículo" 
        });
    }
};

module.exports = { 
    obtenerInventario,
    listarArticulos,
    buscarArticulos,
    obtenerArticulo
};