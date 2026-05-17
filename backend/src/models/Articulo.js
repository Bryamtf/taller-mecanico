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

        if (datosArticulo.imagenes && Array.isArray(datosArticulo.imagenes)) {
            const queryImagen = `
                INSERT INTO Imagenes (articulo_id, ruta_archivo, tipo, orden, visible_cliente)
                VALUES (?, ?, 'articulo', ?, 1)
            `;
            
            for (const img of datosArticulo.imagenes) {
                await connection.query(queryImagen, [
                    nuevoArticuloId, 
                    img.ruta_archivo, 
                    img.orden
                ]);
            }
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

const obtenerMaxOrden = async (articulo_id) => {
    const [rows] = await pool.query(`SELECT MAX(orden) as max_orden FROM Imagenes WHERE articulo_id = ?`, [articulo_id]);
    return rows[0].max_orden !== null ? rows[0].max_orden : -1;
};

const actualizarArticulo = async (id, datosArticulo, nuevas_imagenes = [], imagenes_a_eliminar = []) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Actualizar los datos base de texto
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

        // 2. Actualizar precio y stock
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

        // 3. ELIMINAR fotos viejas (Si el frontend nos mandó IDs para borrar)
        if (imagenes_a_eliminar.length > 0) {
            // El IN (?) permite pasarle un arreglo entero y MySQL borra todos de golpe
            const queryEliminarImg = `DELETE FROM Imagenes WHERE imagen_id IN (?)`;
            await connection.query(queryEliminarImg, [imagenes_a_eliminar]);
        }

        // 4. INSERTAR fotos nuevas (calculando el orden correcto)
        if (nuevas_imagenes.length > 0) {
            const queryInsertarImg = `
                INSERT INTO Imagenes (articulo_id, ruta_archivo, tipo, orden, visible_cliente)
                VALUES (?, ?, 'articulo', ?, 1)
            `;
            for (const img of nuevas_imagenes) {
                await connection.query(queryInsertarImg, [id, img.ruta_archivo, img.orden]);
            }
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

const obtenerDetallesImagenes = async (ids) => {
    const query = `
        SELECT i.imagen_id, i.ruta_archivo, a.codigo_interno, a.codigo_barras 
        FROM Imagenes i 
        JOIN Articulos a ON i.articulo_id = a.articulo_id 
        WHERE i.imagen_id IN (?)
    `;
    const [rows] = await pool.query(query, [ids]);
    return rows;
};

const actualizarOrdenImagenes = async (imagenesActualizadas) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Ahora actualizamos tanto el orden como la nueva ruta del archivo renombrado
        const query = `UPDATE Imagenes SET orden = ?, ruta_archivo = ? WHERE imagen_id = ?`;
        
        // Recorremos el arreglo que nos manda el controlador
        for (const img of imagenesActualizadas) {
            await connection.query(query, [img.orden, img.ruta_archivo, img.imagen_id]);
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

module.exports = { crearArticulo, actualizarArticulo, eliminarLogicoArticulo, reactivarArticulo, actualizarOrdenImagenes, obtenerMaxOrden, obtenerDetallesImagenes };