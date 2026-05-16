const { pool } = require('../config/database');

const obtenerInventarioCompleto = async () => {
    const query = `
        SELECT 
            a.articulo_id, a.codigo_interno, a.codigo_barras, a.nombre, a.tipo AS categoria,
            a.stock_minimo, 
            m.nombre AS marca_nombre, 
            amp.marca_id, amp.stock_actual, amp.precio_venta, amp.precio_costo
        FROM Articulos a
        LEFT JOIN Articulo_Marca_Precio amp ON a.articulo_id = amp.articulo_id
        LEFT JOIN Marca_Repuesto m ON amp.marca_id = m.marca_id
        WHERE a.activo = 1;
    `;
    const [rows] = await pool.query(query);
    return rows;
};

module.exports = { obtenerInventarioCompleto };