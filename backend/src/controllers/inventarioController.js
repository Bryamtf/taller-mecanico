const Articulo = require('../models/Articulo');

// Tu función existente...
const obtenerInventario = async (req, res) => {
    try {
        const productos = await Articulo.obtenerInventarioCompleto();
        
        const totalItems = productos.length;
        const stockTotal = productos.reduce((acc, item) => acc + (Number(item.stock_actual) || 0), 0);

        res.json({
            resumen: { totalItems, stockTotal },
            productos: productos
        });
    } catch (error) {
        console.error("Error en obtenerInventario:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
};

// NUEVA FUNCIÓN: Controlador para crear un artículo
const crearNuevoArticulo = async (req, res) => {
    try {
        const datosArticulo = req.body;

        // Opcional: Validación básica (asegurarnos de que envíen lo mínimo requerido)
        if (!datosArticulo.nombre || !datosArticulo.codigo_barras) {
            return res.status(400).json({ message: "El nombre y el código de barras son obligatorios." });
        }

        // 2. Enviamos los datos a la función del modelo que corregimos antes
        const resultado = await Articulo.crearArticulo(datosArticulo);

        // 3. Si todo sale bien, respondemos al frontend con estado 201 (Creado)
        res.status(201).json({
            message: "Artículo creado exitosamente",
            id: resultado.insertId // Enviamos de vuelta el ID generado en la base de datos
        });

    } catch (error) {
        console.error("Error en crearNuevoArticulo (controlador):", error);
        res.status(500).json({ message: "Error interno al guardar el artículo" });
    }
};

// No olvides exportar la nueva función
module.exports = { 
    obtenerInventario, 
    crearNuevoArticulo // <--- Añadido aquí
};