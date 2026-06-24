const Inventario = require('../models/Inventario');

const obtenerInventario = async (req, res) => {
    try {
        const pagina      = parseInt(req.query.pagina) || 1;
        const limite      = parseInt(req.query.limite) || 10;
        const busqueda    = req.query.busqueda    || '';
        const tipo        = req.query.tipo        || '';
        const filtroStock = req.query.filtroStock || '';
        const orden       = req.query.orden       || 'nombre_asc';

        const resultado = await Inventario.obtenerInventarioCompleto({ pagina, limite, busqueda, tipo, filtroStock, orden });
        res.json({ success: true, ...resultado });
    } catch (error) {
        console.error('Error en obtenerInventario:', error);
        res.status(500).json({ success: false, message: 'Error del servidor al obtener existencias' });
    }
};

const listarArticulos = async (req, res) => {
    try {
        const articulos = await Inventario.listarArticulos();
        res.json({ success: true, data: articulos });
    } catch (error) {
        console.error('Error en listarArticulos:', error);
        res.status(500).json({ success: false, message: 'Error al listar artículos' });
    }
};

const buscarArticulos = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json({ success: true, data: [] });

        const resultados = await Inventario.buscarArticulos(q);
        res.json({ success: true, data: resultados });
    } catch (error) {
        console.error('Error en buscarArticulos:', error);
        res.status(500).json({ success: false, message: 'Error al buscar artículos' });
    }
};

const obtenerArticulo = async (req, res) => {
    try {
        const articulo = await Inventario.obtenerArticuloConMarcas(req.params.id);
        if (!articulo) return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
        res.json({ success: true, data: articulo });
    } catch (error) {
        console.error('Error en obtenerArticulo:', error);
        res.status(500).json({ success: false, message: 'Error al obtener artículo' });
    }
};

const obtenerMovimientos = async (req, res) => {
    try {
        const { id }   = req.params;
        const pagina   = parseInt(req.query.pagina) || 1;
        const limite   = parseInt(req.query.limite) || 15;
        const tipo     = req.query.tipo || '';

        const resultado = await Inventario.obtenerMovimientos(id, { pagina, limite, tipo });
        res.json({ success: true, ...resultado });
    } catch (error) {
        console.error('Error en obtenerMovimientos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener movimientos' });
    }
};

const obtenerArticulosEnAlerta = async (req, res) => {
    try {
        const articulos = await Inventario.obtenerArticulosEnAlerta();
        res.json({ success: true, data: articulos });
    } catch (error) {
        console.error('Error en obtenerArticulosEnAlerta:', error);
        res.status(500).json({ success: false, message: 'Error al obtener alertas de stock' });
    }
};

const exportarInventario = async (req, res) => {
    try {
        const busqueda    = req.query.busqueda    || '';
        const tipo        = req.query.tipo        || '';
        const filtroStock = req.query.filtroStock || '';
        const orden       = req.query.orden       || 'nombre_asc';

        const productos = await Inventario.exportarInventario({ busqueda, tipo, filtroStock, orden });
        res.json({ success: true, data: productos });
    } catch (error) {
        console.error('Error en exportarInventario:', error);
        res.status(500).json({ success: false, message: 'Error al exportar inventario' });
    }
};

module.exports = { obtenerInventario, listarArticulos, buscarArticulos, obtenerArticulo, obtenerMovimientos, obtenerArticulosEnAlerta, exportarInventario };
