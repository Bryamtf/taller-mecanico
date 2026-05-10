// Agregamos las llaves { pool } para extraer solo la conexión
const { pool } = require('../config/database');

const obtenerInventarioCompleto = async () => {
    const query = `
        SELECT 
            a.articulo_id, a.codigo_interno, a.nombre, a.tipo AS categoria,
            a.stock_minimo, amp.stock_actual, amp.precio_venta
        FROM Articulos a
        LEFT JOIN Articulo_Marca_Precio amp ON a.articulo_id = amp.articulo_id
        WHERE a.activo = 1;
    `;
    // Ahora usamos pool.query en lugar de db.query
    const [rows] = await pool.query(query);
    return rows;
};

const crearArticulo = async (datosArticulo) => {
    const query = `
        INSERT INTO Articulos (nombre, descripcion, codigo_barras, codigo_interno, tipo, unidad_medida, stock_minimo, alerta_stock, ingreso_codigo_barras, activo, fecha_registro)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Mapeamos los datos del objeto a un arreglo en el mismo orden que los '?'
    // Convertir strings vacíos a null para campos integer
    const valores = [
        datosArticulo.nombre,
        datosArticulo.descripcion || null,
        datosArticulo.codigo_barras,
        datosArticulo.codigo_interno || null,
        datosArticulo.tipo || null,
        datosArticulo.unidad_medida || null,
        datosArticulo.stock_minimo ? parseInt(datosArticulo.stock_minimo, 10) : 0,
        datosArticulo.alerta_stock ? parseInt(datosArticulo.alerta_stock, 10) : 0,
        datosArticulo.ingreso_codigo_barras ? parseInt(datosArticulo.ingreso_codigo_barras, 10) : 0,
        datosArticulo.activo !== undefined ? (datosArticulo.activo ? 1 : 0) : 1,
        datosArticulo.fecha_registro || new Date() // Usa la fecha actual si no se proporciona una
    ];

    try {
        // Pasamos el arreglo 'valores' como segundo parámetro a pool.query
        const [result] = await pool.query(query, valores);
        
        // En un INSERT, result contiene información de la operación (ej. insertId, affectedRows)
        return result; 
    } catch (error) {
        console.error("Error al insertar en articulo:", error);
        throw error; // Lanzamos el error para manejarlo en el controlador
    }
}
module.exports = { obtenerInventarioCompleto, crearArticulo };