const fs   = require('fs');
const path = require('path');
const Articulo = require('../models/Articulo');
const pool = require('../config/database');
const cloudinary = require("cloudinary").v2;

const subirImagenArticuloACloudinary = (buffer, articuloId, orden) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `autonort/articulos/${articuloId}`,
        public_id: `img_${orden}`,
        overwrite: true,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    stream.end(buffer);
  });
};

const crearNuevoArticulo = async (req, res) => {
  try {
    const datosArticulo = req.body;

    if (!datosArticulo.nombre || !datosArticulo.codigo_barras) {
      return res.status(400).json({
        message: "El nombre y el código de barras son obligatorios.",
      });
    }

    const resultado = await Articulo.crearArticulo(datosArticulo);
    const nuevoArticuloId = resultado.insertId;

    if (req.files && req.files.length > 0) {
      const imagenesGuardadas = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const resultadoCloudinary = await subirImagenArticuloACloudinary(
          file.buffer,
          nuevoArticuloId,
          i,
        );
        imagenesGuardadas.push({
          ruta_archivo: resultadoCloudinary.secure_url,
          orden: i,
        });
      }

      await Articulo.actualizarArticulo(
        nuevoArticuloId,
        datosArticulo,
        imagenesGuardadas,
        [],
      );
    }

    res.status(201).json({
      message: "Artículo creado exitosamente con su marca y precio",
      id: nuevoArticuloId,
      imagenesGuardadas: req.files ? req.files.length : 0,
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

    let imagenes_a_eliminar = [];
    if (datosArticulo.imagenes_a_eliminar) {
      try {
        imagenes_a_eliminar = JSON.parse(datosArticulo.imagenes_a_eliminar);
      } catch {
        return res
          .status(400)
          .json({ message: "Formato inválido en imagenes_a_eliminar" });
      }
    }

    // Eliminar de Cloudinary las imágenes marcadas para borrar
    if (imagenes_a_eliminar.length > 0) {
      const [imagenesABorrar] = await pool.query(
        `SELECT ruta_archivo FROM Imagenes WHERE imagen_id IN (?)`,
        [imagenes_a_eliminar],
      );
      for (const img of imagenesABorrar) {
        try {
          const matches = img.ruta_archivo.match(
            /autonort\/articulos\/\d+\/img_\d+/,
          );
          if (matches) {
            await cloudinary.uploader.destroy(matches[0]);
          }
        } catch (err) {
          console.error("Error al eliminar imagen de Cloudinary:", err);
        }
      }
    }

    let nuevas_imagenes = [];
    if (req.files && req.files.length > 0) {
      const maxOrden = await Articulo.obtenerMaxOrden(id);
      let siguienteOrden = maxOrden + 1;

      for (const file of req.files) {
        const resultadoCloudinary = await subirImagenArticuloACloudinary(
          file.buffer,
          id,
          siguienteOrden,
        );
        nuevas_imagenes.push({
          ruta_archivo: resultadoCloudinary.secure_url,
          orden: siguienteOrden,
        });
        siguienteOrden++;
      }
    }

    await Articulo.actualizarArticulo(
      id,
      datosArticulo,
      nuevas_imagenes,
      imagenes_a_eliminar,
    );

    res.json({
      message: "Artículo actualizado exitosamente.",
      fotosNuevasAgregadas: nuevas_imagenes.length,
      fotosViejasBorradas: imagenes_a_eliminar.length,
    });
  } catch (error) {
    console.error("Error en editarArticulo:", error);
    res
      .status(500)
      .json({ message: "Error interno al actualizar el artículo." });
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
      return res.status(400).json({
        message: "Se requiere un arreglo de imágenes con su nuevo orden.",
      });
    }

    const datosParaBD = imagenes.map((img) => ({
      imagen_id: img.imagen_id,
      orden: img.orden,
      ruta_archivo: img.ruta_archivo, // se mantiene igual, no se renombra
    }));

    if (datosParaBD.length > 0) {
      await Articulo.actualizarOrdenImagenes(datosParaBD);
    }

    res.json({
      message: "Orden de imágenes actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error en cambiarOrdenImagenes:", error);
    res.status(500).json({ message: "Error al reordenar las imágenes." });
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