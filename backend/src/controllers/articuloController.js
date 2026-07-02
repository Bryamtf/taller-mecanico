const fs   = require('fs');
const path = require('path');
const Articulo = require('../models/Articulo');
const pool     = require('../config/database');

const crearNuevoArticulo = async (req, res) => {
    try {
        const datosArticulo = req.body;

        if (!datosArticulo.nombre || !datosArticulo.codigo_barras) {
            return res.status(400).json({ message: "El nombre y el código de barras son obligatorios." });
        }

        if (req.files && req.files.length > 0) {
            const codigoCarpeta = datosArticulo.codigo_interno || datosArticulo.codigo_barras || 'sin_codigo';
            
            const rutaDefinitiva = path.join(__dirname, '../../uploads/articulos', codigoCarpeta);
            if (!fs.existsSync(rutaDefinitiva)) {
                fs.mkdirSync(rutaDefinitiva, { recursive: true });
            }

            datosArticulo.imagenes = req.files.map((file, index) => {
                const extension = path.extname(file.originalname);
                const nuevoNombre = `${codigoCarpeta}-${index}${extension}`; // Ej: LDR-005-0.png
                
                const rutaFisicaNueva = path.join(rutaDefinitiva, nuevoNombre);
                fs.renameSync(file.path, rutaFisicaNueva);

                return {
                    ruta_archivo: `/uploads/articulos/${codigoCarpeta}/${nuevoNombre}`,
                    orden: index
                };
            });
        }

        const resultado = await Articulo.crearArticulo(datosArticulo);

        res.status(201).json({
            message: "Artículo creado exitosamente con su marca y precio",
            id: resultado.insertId,
            imagenesGuardadas: datosArticulo.imagenes ? datosArticulo.imagenes.length : 0
        });

    } catch (error) {
        console.error("Error en crearNuevoArticulo:", error);
        res.status(500).json({ message: "Error interno al guardar el artículo" });
    }
};

const editarArticulo = async (req, res) => {
    try {
        const { id } = req.params;
        const datosArticulo = req.body;

        // 1. Capturar IDs de imágenes a eliminar (El frontend enviará un texto como "[1, 5]")
        let imagenes_a_eliminar = [];
        if (datosArticulo.imagenes_a_eliminar) {
            try {
                imagenes_a_eliminar = JSON.parse(datosArticulo.imagenes_a_eliminar);
            } catch {
                return res.status(400).json({ message: 'Formato inválido en imagenes_a_eliminar' });
            }
        }

        // 2. Procesar las imágenes NUEVAS que entraron por Multer
        let nuevas_imagenes = [];
        if (req.files && req.files.length > 0) {
            const codigoCarpeta = datosArticulo.codigo_interno || datosArticulo.codigo_barras || 'sin_codigo';
            
            // 1. Aseguramos que la carpeta exista (por si el artículo no tenía fotos antes)
            const rutaDefinitiva = path.join(__dirname, '../../uploads/articulos', codigoCarpeta);
            if (!fs.existsSync(rutaDefinitiva)) {
                fs.mkdirSync(rutaDefinitiva, { recursive: true });
            }

            let maxOrdenActual = await Articulo.obtenerMaxOrden(id);
            let siguienteOrden = maxOrdenActual + 1;

            nuevas_imagenes = req.files.map((file) => {
                const extension = path.extname(file.originalname);
                const nuevoNombre = `${codigoCarpeta}-${siguienteOrden}${extension}`;
                
                const rutaFisicaNueva = path.join(rutaDefinitiva, nuevoNombre);
                fs.renameSync(file.path, rutaFisicaNueva);

                const objImagen = {
                    ruta_archivo: `/uploads/articulos/${codigoCarpeta}/${nuevoNombre}`,
                    orden: siguienteOrden
                };
                
                siguienteOrden++;
                return objImagen;
            });
        }

        // 3. Enviamos todo al modelo: textos, fotos nuevas y fotos a borrar
        await Articulo.actualizarArticulo(id, datosArticulo, nuevas_imagenes, imagenes_a_eliminar);

        res.json({ 
            message: "Artículo actualizado exitosamente.",
            fotosNuevasAgregadas: nuevas_imagenes.length,
            fotosViejasBorradas: imagenes_a_eliminar.length
        });

    } catch (error) {
        console.error("Error en editarArticulo:", error);
        res.status(500).json({ message: "Error interno al actualizar el artículo." });
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

const cambiarOrdenImagenes = async (req, res) => {
    try {
        const { imagenes } = req.body;

        if (!imagenes || !Array.isArray(imagenes)) {
            return res.status(400).json({ message: "Se requiere un arreglo de imágenes con su nuevo orden." });
        }

        const ids = imagenes.map(img => img.imagen_id);
        
        // 1. Obtener detalles de la Base de Datos
        const detallesImagenes = await Articulo.obtenerDetallesImagenes(ids);

        const mapaDetalles = {};
        detallesImagenes.forEach(det => {
            mapaDetalles[det.imagen_id] = det;
        });

        // FASE 1: Renombrar físicamente a un archivo temporal
        detallesImagenes.forEach(img => {
            // TRUCO: Le quitamos el "/" del inicio a la ruta de BD para que Node.js no se confunda al unir las carpetas
            const rutaLimpia = img.ruta_archivo.startsWith('/') ? img.ruta_archivo.substring(1) : img.ruta_archivo;
            const rutaFisicaOriginal = path.join(__dirname, '../../', rutaLimpia);
            
            const extension = path.extname(img.ruta_archivo);
            const codigoCarpeta = img.codigo_interno || img.codigo_barras || 'sin_codigo';
            
            const nombreTemp = `temp-swap-${img.imagen_id}${extension}`;
            const rutaFisicaTemp = path.join(__dirname, '../../uploads/articulos', codigoCarpeta, nombreTemp);

            // Verificamos si existe. Si no, le gritamos a la consola para saber por qué
            if (fs.existsSync(rutaFisicaOriginal)) {
                fs.renameSync(rutaFisicaOriginal, rutaFisicaTemp);
                img.rutaFisicaTemp = rutaFisicaTemp;
            } else {
                console.log(`⚠️ ALERTA: No encontré la foto en esta ruta: ${rutaFisicaOriginal}`);
            }
            
            img.extension = extension;
            img.codigoCarpeta = codigoCarpeta;
        });

        // FASE 2: Renombrar al definitivo y armar el paquete de actualización
        const datosParaBD = [];

        for (const imgNueva of imagenes) {
            const imgActual = mapaDetalles[imgNueva.imagen_id];
            
            if (!imgActual) continue;

            const nuevoNombre = `${imgActual.codigoCarpeta}-${imgNueva.orden}${imgActual.extension}`;
            const rutaFisicaFinal = path.join(__dirname, '../../uploads/articulos', imgActual.codigoCarpeta, nuevoNombre);
            const nuevaRutaRelativa = `/uploads/articulos/${imgActual.codigoCarpeta}/${nuevoNombre}`;

            // Si el archivo físico sí se logró renombrar en la fase 1, lo pasamos al nombre final
            if (imgActual.rutaFisicaTemp && fs.existsSync(imgActual.rutaFisicaTemp)) {
                fs.renameSync(imgActual.rutaFisicaTemp, rutaFisicaFinal);
            }

            // SÍ O SÍ armamos el paquete para actualizar la base de datos (exista físicamente la foto o no)
            datosParaBD.push({
                imagen_id: imgNueva.imagen_id,
                orden: imgNueva.orden,
                ruta_archivo: nuevaRutaRelativa
            });
        }

        // 3. Forzamos la actualización en la BD
        if (datosParaBD.length > 0) {
            await Articulo.actualizarOrdenImagenes(datosParaBD);
        }

        res.json({ message: "Orden de imágenes y nombres de archivos sincronizados correctamente." });
        
    } catch (error) {
        console.error("Error en cambiarOrdenImagenes:", error);
        res.status(500).json({ message: "Error al reordenar y renombrar los archivos físicos." });
    }
};

const agregarMarca = async (req, res) => {
    try {
        const { id } = req.params;
        const { marca_id, precio_venta, precio_costo, stock_actual } = req.body;

        if (!marca_id) return res.status(400).json({ message: 'La marca es requerida' });

        await Articulo.agregarMarca(id, { marca_id, precio_venta, precio_costo, stock_actual });
        res.status(201).json({ message: 'Marca agregada al artículo correctamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Esta marca ya está registrada para este artículo' });
        }
        console.error('Error en agregarMarca:', error);
        res.status(500).json({ message: 'Error al agregar la marca' });
    }
};

const actualizarMarca = async (req, res) => {
    const { id, marca_id } = req.params;
    const { precio_venta, precio_costo, stock_actual } = req.body;

    const pvNuevo = parseFloat(precio_venta || 0);
    const pcNuevo = parseFloat(precio_costo || 0);

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            `SELECT amp.precio_venta, amp.precio_costo, m.nombre AS marca_nombre
             FROM Articulo_Marca_Precio amp
             JOIN Marca_Repuesto m ON m.marca_id = amp.marca_id
             WHERE amp.articulo_id = ? AND amp.marca_id = ?`,
            [id, marca_id]
        );
        if (!rows.length) {
            await connection.rollback();
            return res.status(404).json({ message: 'Combinación artículo-marca no encontrada' });
        }

        const { precio_venta: pvAnterior, precio_costo: pcAnterior, marca_nombre } = rows[0];

        await connection.query(
            `UPDATE Articulo_Marca_Precio SET precio_venta = ?, precio_costo = ?, stock_actual = ?
             WHERE articulo_id = ? AND marca_id = ?`,
            [pvNuevo, pcNuevo, parseInt(stock_actual || 0), id, marca_id]
        );

        const pvCambio = parseFloat(pvAnterior) !== pvNuevo;
        const pcCambio = parseFloat(pcAnterior) !== pcNuevo;

        if (pvCambio || pcCambio) {
            await connection.query(
                `INSERT INTO Historial_precio
                 (articulo_id, marca_id, marca_nombre,
                  precio_venta_anterior, precio_venta_nuevo,
                  precio_costo_anterior, precio_costo_nuevo,
                  registrado_por)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id, marca_id, marca_nombre,
                    pvCambio ? parseFloat(pvAnterior) : null, pvCambio ? pvNuevo : null,
                    pcCambio ? parseFloat(pcAnterior) : null, pcCambio ? pcNuevo : null,
                    req.user?.username || null,
                ]
            );
        }

        await connection.commit();
        res.json({ message: 'Marca actualizada correctamente' });

    } catch (error) {
        await connection.rollback();
        console.error('Error en actualizarMarca:', error);
        res.status(500).json({ message: 'Error al actualizar la marca' });
    } finally {
        connection.release();
    }
};

const eliminarMarca = async (req, res) => {
    try {
        const { id, marca_id } = req.params;

        const eliminado = await Articulo.eliminarMarca(id, marca_id);
        if (!eliminado) return res.status(404).json({ message: 'Combinación artículo-marca no encontrada' });

        res.json({ message: 'Marca eliminada del artículo correctamente' });
    } catch (error) {
        console.error('Error en eliminarMarca:', error);
        res.status(500).json({ message: 'Error al eliminar la marca' });
    }
};

const ajustarStock = async (req, res) => {
    const { id, marca_id } = req.params;
    const { tipo_movimiento, cantidad, motivo } = req.body;

    const cantidadNum = parseInt(cantidad, 10);
    if (!tipo_movimiento || !cantidadNum || cantidadNum <= 0) {
        return res.status(400).json({ message: 'tipo_movimiento y cantidad (> 0) son requeridos' });
    }
    if (!['entrada', 'salida', 'ajuste'].includes(tipo_movimiento)) {
        return res.status(400).json({ message: 'tipo_movimiento debe ser entrada, salida o ajuste' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            `SELECT stock_actual FROM Articulo_Marca_Precio WHERE articulo_id = ? AND marca_id = ?`,
            [id, marca_id]
        );
        if (!rows.length) {
            await connection.rollback();
            return res.status(404).json({ message: 'Combinación artículo-marca no encontrada' });
        }

        const stockAnterior = rows[0].stock_actual;
        let nuevoStock;

        if (tipo_movimiento === 'entrada') {
            nuevoStock = stockAnterior + cantidadNum;
        } else if (tipo_movimiento === 'salida') {
            if (stockAnterior < cantidadNum) {
                await connection.rollback();
                return res.status(400).json({ message: `Stock insuficiente. Stock actual: ${stockAnterior}` });
            }
            nuevoStock = stockAnterior - cantidadNum;
        } else {
            // ajuste: cantidad es el nuevo valor absoluto
            nuevoStock = cantidadNum;
        }

        await connection.query(
            `UPDATE Articulo_Marca_Precio SET stock_actual = ? WHERE articulo_id = ? AND marca_id = ?`,
            [nuevoStock, id, marca_id]
        );

        await connection.query(
            `INSERT INTO Movimiento_inventario (articulo_id, marca_id, tipo_movimiento, cantidad, stock_anterior, stock_resultante, motivo, registrado_por)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, marca_id, tipo_movimiento, cantidadNum, stockAnterior, nuevoStock, motivo || null, req.user?.username || null]
        );

        // Actualiza alerta_stock automáticamente según si alguna marca está por debajo del mínimo
        await connection.query(
            `UPDATE Articulos SET alerta_stock = (
                SELECT CASE WHEN MIN(amp.stock_actual) <= stock_minimo THEN 1 ELSE 0 END
                FROM Articulo_Marca_Precio amp WHERE amp.articulo_id = ?
             ) WHERE articulo_id = ?`,
            [id, id]
        );

        await connection.commit();
        res.json({ message: 'Stock ajustado correctamente', stock_anterior: stockAnterior, stock_nuevo: nuevoStock });

    } catch (error) {
        await connection.rollback();
        console.error('Error en ajustarStock:', error);
        res.status(500).json({ message: 'Error al ajustar el stock' });
    } finally {
        connection.release();
    }
};

module.exports = { crearNuevoArticulo, editarArticulo, eliminarArticulo, reactivarArticulo, cambiarOrdenImagenes, agregarMarca, actualizarMarca, eliminarMarca, ajustarStock };