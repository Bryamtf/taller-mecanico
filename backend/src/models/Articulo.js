const { pool } = require('../config/database');

const crearArticulo = async (datosArticulo) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const queryArticulo = `
            INSERT INTO Articulos (nombre, descripcion, codigo_barras, codigo_interno, tipo, unidad_medida, stock_minimo, alerta_stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const valoresArticulo = [
            datosArticulo.nombre,
            datosArticulo.descripcion || null,
            datosArticulo.codigo_barras,
            datosArticulo.codigo_interno || null,
            datosArticulo.tipo || 'repuesto',
            datosArticulo.unidad_medida || 'unidad',
            datosArticulo.stock_minimo ? parseInt(datosArticulo.stock_minimo, 10) : 0,
            datosArticulo.alerta_stock ? parseInt(datosArticulo.alerta_stock, 10) : 0
        ];
        
        const [resArticulo] = await connection.query(queryArticulo, valoresArticulo);
        const nuevoArticuloId = resArticulo.insertId;

        if (datosArticulo.marca_id) {
            const queryPrecio = `
                INSERT INTO Articulo_Marca_Precio (articulo_id, marca_id, precio_venta, precio_costo, stock_actual)
                VALUES (?, ?, ?, ?, ?)
            `;
            const valoresPrecio = [
                nuevoArticuloId,
                parseInt(datosArticulo.marca_id, 10),
                parseFloat(datosArticulo.precio_venta || 0),
                parseFloat(datosArticulo.precio_costo || 0),
                parseInt(datosArticulo.stock_actual || 0, 10)
            ];
            await connection.query(queryPrecio, valoresPrecio);
        }

        await connection.commit();
        return { insertId: nuevoArticuloId };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const actualizarArticulo = async (id, datosArticulo) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Actualizar los datos base del artículo
        const queryArticulo = `
            UPDATE Articulos SET 
                nombre = ?, descripcion = ?, codigo_barras = ?, 
                codigo_interno = ?, tipo = ?, unidad_medida = ?
            WHERE articulo_id = ?
        `;
        const valoresArticulo = [
            datosArticulo.nombre, datosArticulo.descripcion || null, 
            datosArticulo.codigo_barras, datosArticulo.codigo_interno || null, 
            datosArticulo.tipo, datosArticulo.unidad_medida, id
        ];
        await connection.query(queryArticulo, valoresArticulo);

        // 2. Si nos envían datos de precio/marca, los actualizamos
        if (datosArticulo.marca_id) {
            const queryPrecio = `
                INSERT INTO Articulo_Marca_Precio (articulo_id, marca_id, precio_venta, precio_costo, stock_actual)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    precio_venta = VALUES(precio_venta), 
                    precio_costo = VALUES(precio_costo), 
                    stock_actual = VALUES(stock_actual)
            `;
            await connection.query(queryPrecio, [
                id, datosArticulo.marca_id, datosArticulo.precio_venta || 0, 
                datosArticulo.precio_costo || 0, datosArticulo.stock_actual || 0
            ]);
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const eliminarLogicoArticulo = async (id) => {
    // Lo desactivamos (activo = 0) para no romper el historial de ventas o cotizaciones
    const query = `UPDATE Articulos SET activo = 0 WHERE articulo_id = ?`;
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
};

const reactivarArticulo = async (id) => {
    const query = `UPDATE Articulos SET activo = 1 WHERE articulo_id = ?`;
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
}

module.exports = { crearArticulo, actualizarArticulo, eliminarLogicoArticulo, reactivarArticulo };