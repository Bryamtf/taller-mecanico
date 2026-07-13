const Cotizacion = require("../models/Cotizacion");
const DetalleCotizacion = require("../models/DetalleCotizacion");
const ReservaStock = require("../models/ReservaStock");
const pdfService = require("../services/pdfService");
const sharingService = require("../services/sharingService");
const generarNumeroCotizacion = require("../utils/generarNumeroCotizacion");
const pool = require("../config/database");
const imagenService = require("../services/imagenService");
const { uploadImagenesCotizacion } = require("../middleware/uploadMiddleware");

async function notificarCambioEstado(cotizacion, nuevoEstado) {
  const estadosQueNotifican = ["aprobada", "rechazada", "vencida"];
  if (!estadosQueNotifican.includes(nuevoEstado)) return;
  if (nuevoEstado === cotizacion.estado) return;

  try {
    const total = parseFloat(cotizacion.total) || 0;

    let tokenPublico = cotizacion.token_publico;
    if (!tokenPublico) {
      tokenPublico = await Cotizacion.generarTokenPublico(
        cotizacion.cotizacion_id,
      );
    }

    const linkPublico = `${process.env.FRONTEND_URL}/cotizacion/${tokenPublico}`;

    fetch(`${process.env.NOTIFICATIONS_URL}/api/email/estado-cotizacion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.NOTIFICATIONS_SECRET,
      },
      body: JSON.stringify({
        to: cotizacion.email,
        cliente_nombre: cotizacion.cliente_nombre,
        numero_cotizacion: cotizacion.numero_cotizacion,
        fecha_emision: cotizacion.fecha_emision,
        marca: cotizacion.marca,
        modelo: cotizacion.modelo,
        placa: cotizacion.placa,
        total: total.toFixed(2),
        estado: nuevoEstado,
        link_publico: linkPublico,
      }),
    }).catch((err) =>
      console.error("Error al enviar notificación de estado:", err),
    );
  } catch (err) {
    console.error("Error al preparar notificación de estado:", err);
  }
}

const cotizacionController = {
  async crear(req, res) {
    const {
      cliente_id,
      vehiculo_id,
      cita_id,
      es_modelo,
      nombre_modelo,
      kilometraje_momento,
      fecha_vencimiento,
      fecha_entrega,
      observaciones,
      descuento,
    } = req.body;
    console.log("Datos recibidos para creación:", req.body);

    let detalles = req.body.detalles;
    if (typeof detalles === "string") {
      try {
        detalles = JSON.parse(detalles);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Formato de detalles inválido",
        });
      }
    }
    let descripcionesImagenes = req.body.descripciones_imagenes;
    if (typeof descripcionesImagenes === "string") {
      try {
        descripcionesImagenes = JSON.parse(descripcionesImagenes);
      } catch {
        descripcionesImagenes = [];
      }
    } else if (!Array.isArray(descripcionesImagenes)) {
      descripcionesImagenes = [];
    }
    // Validaciones iniciales
    if (!cliente_id) {
      return res
        .status(400)
        .json({ success: false, message: "Elegir cliente es obligatorio" });
    }
    if (!vehiculo_id) {
      return res
        .status(400)
        .json({ success: false, message: "Elegir vehiculo es obligatorio" });
    }
    if (!detalles || detalles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "La cotizacion debe tener al menos un detalle",
      });
    }

    // Validar imágenes
    const imagenes = req.files || [];
    if (imagenes.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Máximo 10 imágenes por cotización",
      });
    }

    let subtotal = 0;

    const detallesCalc = detalles.map((d) => {
      const subtotalItem = d.cantidad * d.precio_unitario - (d.descuento || 0);
      subtotal += subtotalItem;
      return { ...d, subtotal: subtotalItem };
    });

    const descuentoGlobal = parseFloat(descuento) || 0;
    if (descuentoGlobal > subtotal) {
      return res.status(400).json({
        success: false,
        message: "El descuento no puede ser mayor al subtotal",
      });
    }

    const igv = (subtotal - descuentoGlobal) * 0.18;
    const total = subtotal - descuentoGlobal + igv;

    let numeroCotizacion;
    try {
      numeroCotizacion = await generarNumeroCotizacion();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error al generar el número de cotización",
        error: error.message,
      });
    }

    let cotizacionId = null;
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      cotizacionId = await Cotizacion.crear(
        {
          cliente_id,
          vehiculo_id,
          cita_id: cita_id || null,
          creado_por: req.user.username,
          es_modelo: es_modelo || 0,
          nombre_modelo: nombre_modelo || null,
          kilometraje_momento,
          subtotal,
          descuento: descuentoGlobal,
          igv,
          total,
          fecha_emision: new Date().toISOString().split("T")[0],
          fecha_vencimiento: fecha_vencimiento || null,
          fecha_entrega,
          observaciones,
          numero_cotizacion: numeroCotizacion,
        },
        conn,
      );

      for (const detalle of detallesCalc) {
        await DetalleCotizacion.crear(
          {
            cotizacion_id: cotizacionId,
            articulo_id: detalle.articulo_id || null,
            marca_id: detalle.marca_id || null,
            descripcion_custom: detalle.descripcion_custom || null,
            cantidad: detalle.cantidad,
            precio_unitario: detalle.precio_unitario,
            descuento: detalle.descuento || 0,
            subtotal: detalle.subtotal,
            es_servicio: detalle.es_servicio || 0,
          },
          conn,
        );
      }

      // Procesar imágenes (si hay)
      let imagenesGuardadas = [];
      if (imagenes.length > 0) {
        imagenesGuardadas = await imagenService.procesarImagenes(
          imagenes,
          cotizacionId,
          req.user.username,
          conn,
          0,
          descripcionesImagenes,
        );
      }

      await conn.commit();

      const nuevaCotizacion = await Cotizacion.encontrarPorId(cotizacionId);
      res.status(201).json({
        success: true,
        message: "Cotización creada exitosamente",
        data: {
          ...nuevaCotizacion,
          imagenes: imagenesGuardadas,
        },
      });
    } catch (error) {
      await conn.rollback();

      if (cotizacionId) {
        imagenService.eliminarCarpetaImagenes(cotizacionId);
      }

      console.error("Error al crear cotización:", error);
      res.status(500).json({
        success: false,
        message: "Error al crear la cotización",
        error: error.message,
      });
    } finally {
      conn.release();
    }
  },

  async listar(req, res) {
    try {
      const { estado, cliente_id, es_modelo, busqueda, page, pageSize } =
        req.query;

      const resultado = await Cotizacion.listarCotizaciones({
        estado,
        cliente_id,
        es_modelo,
        busqueda,
        page: page ? parseInt(page) : 1,
        pageSize: pageSize ? parseInt(pageSize) : 20,
      });
      res.json({
        success: true,
        data: resultado.data,
        pagination: {
          total: resultado.total,
          page: resultado.page,
          pageSize: resultado.pageSize,
          totalPages: resultado.totalPages,
        },
      });
    } catch (error) {
      console.error("Error al listar cotizaciones:", error);
      res.status(500).json({
        success: false,
        message: "Error al listar cotizaciones",
      });
    }
  },

  async obtener(req, res) {
    try {
      const { id } = req.params;
      const cotizacion = await Cotizacion.encontrarPorId(id);
      if (!cotizacion) {
        return res.status(404).json({
          success: false,
          message: "Cotizacion no encontrada",
        });
      }
      res.json({
        success: true,
        data: cotizacion,
      });
    } catch (error) {
      console.error("Error al obtener cotización:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener la cotización",
      });
    }
  },
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const {
        cliente_id,
        vehiculo_id,
        observaciones,
        estado,
        fecha_entrega,
        fecha_vencimiento,
        detalles,
      } = req.body;
      console.log("Datos recibidos para actualización:", req.body);

      const cotizacionExistente = await Cotizacion.encontrarPorId(id);
      if (!cotizacionExistente) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada",
        });
      }

      const estadosBloqueados = ["aprobada", "rechazada", "vencida"];
      if (estadosBloqueados.includes(cotizacionExistente.estado)) {
        return res.status(400).json({
          success: false,
          message: `No se puede editar una cotización ${cotizacionExistente.estado}`,
        });
      }

      if (estado === "aprobada") {
        return res.status(400).json({
          success: false,
          message: "Para aprobar una cotización usa el botón de aprobación. Esta acción descuenta el stock automáticamente.",
        });
      }

      let subtotal = 0;
      const detallesCalc = (detalles || []).map((d) => {
        const subtotalItem =
          d.cantidad * d.precio_unitario - (d.descuento || 0);
        subtotal += subtotalItem;
        return { ...d, subtotal: subtotalItem };
      });

      const descuentoGlobal = parseFloat(cotizacionExistente.descuento) || 0;
      if (descuentoGlobal > subtotal) {
        return res.status(400).json({
          success: false,
          message:
            "El descuento ya no puede aplicarse: supera el nuevo subtotal de la cotización",
        });
      }

      const igv = (subtotal - descuentoGlobal) * 0.18;
      const total = subtotal - descuentoGlobal + igv;

      const conn = await pool.getConnection();

      try {
        await conn.beginTransaction();
        await Cotizacion.actualizarCotizacion(
          id,
          {
            cliente_id,
            vehiculo_id,
            observaciones,
            estado,
            fecha_entrega: fecha_entrega || null,
            fecha_vencimiento: fecha_vencimiento || null,
            subtotal,
            descuento: descuentoGlobal,
            igv,
            total,
          },
          conn,
        );
        await DetalleCotizacion.eliminarPorCotizacionId(id, conn);
        for (const detalle of detallesCalc) {
          await DetalleCotizacion.crear(
            {
              cotizacion_id: id,
              articulo_id: detalle.articulo_id || null,
              marca_id: detalle.marca_id || null,
              descripcion_custom: detalle.descripcion_custom,
              cantidad: detalle.cantidad,
              precio_unitario: detalle.precio_unitario,
              descuento: detalle.descuento || 0,
              subtotal: detalle.subtotal,
              es_servicio: detalle.es_servicio || 0,
            },
            conn,
          );
        }

        await conn.commit();
notificarCambioEstado(cotizacionExistente, estado);

        res.json({
          success: true,
          message: "Cotización actualizada exitosamente",
        });
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error("Error al actualizar cotización:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar la cotización",
        error: error.message,
      });
    }
  },
  async eliminar(req, res) {
    try {
      const { id } = req.params;

      const cotizacionExistente = await Cotizacion.encontrarPorId(id);
      if (!cotizacionExistente) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada",
        });
      }

      if (cotizacionExistente.estado === "aprobada") {
        return res.status(400).json({
          success: false,
          message:
            'No se puede eliminar una cotización aprobada. Considere cambiarla a estado "rechazada" o "vencida"',
        });
      }

      const eliminado = await Cotizacion.eliminar(id);
      if (!eliminado) {
        return res.status(500).json({
          success: false,
          message: "Error al eliminar la cotización",
        });
      }

      if (cotizacionExistente.pdf_path) {
        const fs = require("fs");
        const path = require("path");
        const pdfPath = path.join(
          __dirname,
          "../../",
          cotizacionExistente.pdf_path,
        );
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
      }

      res.json({
        success: true,
        message: "Cotización eliminada exitosamente",
        data: {
          id: parseInt(id),
          eliminada: true,
        },
      });
    } catch (error) {
      console.error("Error al eliminar cotización:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar la cotización",
        error: error.message,
      });
    }
  },

  async cambiarEstado(req, res) {
    const ESTADOS_VALIDOS    = ["borrador", "pendiente", "aprobada", "rechazada", "vencida"];
    const DESDE_APROBADA_OK  = ["rechazada", "vencida"];
    const HACIA_APROBADA_OK  = ["borrador", "pendiente"];

    try {
      const { id }    = req.params;
      const { estado } = req.body;

      if (!ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({ success: false, message: "Estado no válido" });
      }

      const cotizacion = await Cotizacion.encontrarPorId(id);
      if (!cotizacion) {
        return res.status(404).json({ success: false, message: "Cotización no encontrada" });
      }

      if (cotizacion.estado === estado) {
        return res.status(400).json({ success: false, message: `La cotización ya está en estado "${estado}"` });
      }

      if (estado === "aprobada" && !HACIA_APROBADA_OK.includes(cotizacion.estado)) {
        return res.status(400).json({
          success: false,
          message: `No se puede aprobar una cotización en estado "${cotizacion.estado}"`,
        });
      }

      if (cotizacion.estado === "aprobada" && !DESDE_APROBADA_OK.includes(estado)) {
        return res.status(400).json({
          success: false,
          message: `Una cotización aprobada solo puede pasar a "rechazada" o "vencida"`,
        });
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        if (estado === "aprobada") {
          const detallesRepuesto = cotizacion.detalles.filter(
            (d) => d.articulo_id && d.marca_id && !d.es_servicio
          );

          for (const detalle of detallesRepuesto) {
            const cant = parseInt(detalle.cantidad, 10);

            const [rows] = await conn.query(
              `SELECT amp.stock_actual,
                      COALESCE(amp.cantidad_reservada, 0) AS cantidad_reservada,
                      a.nombre AS nombre
               FROM Articulo_Marca_Precio amp
               JOIN Articulos a ON a.articulo_id = amp.articulo_id
               WHERE amp.articulo_id = ? AND amp.marca_id = ?
               FOR UPDATE`,
              [detalle.articulo_id, detalle.marca_id]
            );

            if (!rows.length) continue;

            const { stock_actual, cantidad_reservada, nombre } = rows[0];
            const stockDisponible = stock_actual - cantidad_reservada;

            if (stockDisponible < cant) {
              await conn.rollback();
              return res.status(409).json({
                success: false,
                message: `Stock insuficiente para "${nombre}". Disponible: ${stockDisponible}, requerido: ${cant}`,
                articulo: nombre,
              });
            }

            await conn.query(
              `UPDATE Articulo_Marca_Precio
               SET cantidad_reservada = cantidad_reservada + ?
               WHERE articulo_id = ? AND marca_id = ?`,
              [cant, detalle.articulo_id, detalle.marca_id]
            );

            await conn.query(
              `INSERT INTO Reserva_Stock (cotizacion_id, articulo_id, marca_id, cantidad)
               VALUES (?, ?, ?, ?)`,
              [parseInt(id), detalle.articulo_id, detalle.marca_id, cant]
            );
          }
        }

        if (cotizacion.estado === "aprobada") {
          const [reservas] = await conn.query(
            `SELECT reserva_id FROM Reserva_Stock WHERE cotizacion_id = ? AND estado = 'activa' LIMIT 1`,
            [parseInt(id)]
          );

          if (reservas.length > 0) {
            await ReservaStock.liberarPorCotizacion(parseInt(id), conn);
          } else {
            const [movimientos] = await conn.query(
              `SELECT articulo_id, marca_id, cantidad
               FROM Movimiento_inventario
               WHERE referencia_id = ? AND motivo = 'cotizacion' AND tipo_movimiento = 'salida'`,
              [parseInt(id)]
            );
            for (const mov of movimientos) {
              const [rows] = await conn.query(
                `SELECT stock_actual FROM Articulo_Marca_Precio
                 WHERE articulo_id = ? AND marca_id = ? FOR UPDATE`,
                [mov.articulo_id, mov.marca_id]
              );
              if (!rows.length) continue;
              const stockAnterior = rows[0].stock_actual;
              const nuevoStock    = stockAnterior + mov.cantidad;
              await conn.query(
                `UPDATE Articulo_Marca_Precio SET stock_actual = ? WHERE articulo_id = ? AND marca_id = ?`,
                [nuevoStock, mov.articulo_id, mov.marca_id]
              );
              await conn.query(
                `INSERT INTO Movimiento_inventario
                   (articulo_id, marca_id, tipo_movimiento, cantidad, stock_anterior, stock_resultante, motivo, referencia_id, registrado_por)
                 VALUES (?, ?, 'entrada', ?, ?, ?, 'devolucion_cotizacion', ?, ?)`,
                [mov.articulo_id, mov.marca_id, mov.cantidad, stockAnterior, nuevoStock, parseInt(id), req.user?.username || null]
              );
              await conn.query(
                `UPDATE Articulos
                 SET alerta_stock = (
                   SELECT CASE WHEN MIN(amp.stock_actual) <= stock_minimo THEN 1 ELSE 0 END
                   FROM Articulo_Marca_Precio amp WHERE amp.articulo_id = ?
                 )
                 WHERE articulo_id = ?`,
                [mov.articulo_id, mov.articulo_id]
              );
            }
          }
        }

        await conn.query(
          `UPDATE Cotizacion SET estado = ? WHERE cotizacion_id = ?`,
          [estado, id]
        );

        await conn.commit();
        notificarCambioEstado(cotizacion, estado);

        res.json({
          success: true,
          message: `Estado actualizado a ${estado}`,
          data: { id, estado },
        });
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      res.status(500).json({ success: false, message: "Error al cambiar el estado" });
    }
  },
  async descargarPDF(req, res) {
    try {
      const { id } = req.params;
      const cotizacion = await Cotizacion.encontrarPorId(id);

      if (!cotizacion) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada",
        });
      }

      const pdfBuffer = await pdfService.generar(cotizacion);
      const buffer = Buffer.from(pdfBuffer); // ← convierte Uint8Array → Buffer

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=cotizacion_${id}.pdf`,
      );
      res.end(buffer); // ← res.end en vez de res.send, sin interferencia de Express
    } catch (error) {
      console.error("Error al descargar PDF:", error);
      res.status(500).json({
        success: false,
        message: "Error al descargar el PDF",
      });
    }
  },

  async generarPDF(req, res) {
    try {
      const { id } = req.params;
      const cotizacion = await Cotizacion.encontrarPorId(id);

      if (!cotizacion) {
        return res.status(404).json({
          success: false,
          message: "Cotizacion no encontrada",
        });
      }

      const pdfBuffer = await pdfService.generar(cotizacion);
      const buffer = Buffer.from(pdfBuffer); // ← mismo fix
      const filename = `cotizacion_${id}_${Date.now()}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=${filename}`);
      res.end(buffer);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      res.status(500).json({
        success: false,
        message: "Error al generar el PDF",
      });
    }
  },
  async compartir(req, res) {
    try {
      const { id } = req.params;
      const { via, destino } = req.body; // via: 'whatsapp', 'email', destino: número o email

      // Generar token público si no existe
      let cotizacion = await Cotizacion.encontrarPorId(id);
      if (!cotizacion.token_publico) {
        await Cotizacion.generarTokenPublico(id);
        cotizacion = await Cotizacion.encontrarPorId(id);
      }

      const linkPublico = `${process.env.FRONTEND_URL}/cotizacion/${cotizacion.token_publico}`;

      let resultado;
      if (via === "whatsapp") {
        resultado = await sharingService.enviarWhatsApp(
          destino,
          linkPublico,
          cotizacion,
        );
      } else if (via === "email") {
        resultado = await sharingService.enviarEmail(
          destino,
          linkPublico,
          cotizacion,
        );
      } else {
        return res.status(400).json({
          success: false,
          message: "Método de envío no soportado",
        });
      }

      res.json({
        success: true,
        message: `Cotización compartida por ${via}`,
        data: { link: linkPublico, resultado },
      });
    } catch (error) {
      console.error("Error al compartir:", error);
      res.status(500).json({
        success: false,
        message: "Error al compartir la cotización",
      });
    }
  },
  async obtenerPorToken(req, res) {
    try {
      const { token } = req.params;

      const cotizacion = await Cotizacion.encontrarToken(token);

      if (!cotizacion) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada o link expirado",
        });
      }

      res.json({
        success: true,
        data: {
          numero:
            cotizacion.numero_cotizacion || `#${cotizacion.cotizacion_id}`,
          fecha_emision: cotizacion.fecha_emision,
          cliente_nombre: cotizacion.cliente_nombre,
          vehiculo: `${cotizacion.marca} ${cotizacion.modelo} - ${cotizacion.placa}`,
          detalles: cotizacion.detalles.map((d) => ({
            descripcion: d.descripcion_custom || d.articulo_nombre,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            subtotal: d.subtotal,
          })),
          subtotal: cotizacion.subtotal,
          igv: cotizacion.igv,
          total: cotizacion.total,
          observaciones: cotizacion.observaciones,
          estado: cotizacion.estado, // Solo lectura
        },
      });
    } catch (error) {
      console.error("Error al obtener por token:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener la cotización",
      });
    }
  },
  async obtenerImagenesPorToken(req, res) {
    try {
      const { token } = req.params;

      const cotizacion = await Cotizacion.encontrarToken(token);
      if (!cotizacion) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada o link expirado",
        });
      }

      const [imagenes] = await pool.execute(
        `SELECT imagen_id, ruta_archivo, descripcion, orden
       FROM Imagenes
       WHERE cotizacion_id = ? AND visible_cliente = 1
       ORDER BY orden ASC`,
        [cotizacion.cotizacion_id],
      );

      res.json({ success: true, data: imagenes });
    } catch (error) {
      console.error("Error al obtener imágenes públicas:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener las imágenes",
      });
    }
  },

  async compartirWhatsApp(req, res) {
    try {
      const { id } = req.params;
      const { telefono } = req.body;

      if (!telefono) {
        return res.status(400).json({
          success: false,
          message: "Número de teléfono requerido",
        });
      }

      let cotizacion = await Cotizacion.encontrarPorId(id);
      cotizacion.total = parseFloat(cotizacion.total) || 0;
      cotizacion.subtotal = parseFloat(cotizacion.subtotal) || 0;
      cotizacion.igv = parseFloat(cotizacion.igv) || 0;
      cotizacion.descuento = parseFloat(cotizacion.descuento) || 0;

      if (!cotizacion) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada",
        });
      }

      // Generar token si no existe
      if (!cotizacion.token_publico) {
        await Cotizacion.generarTokenPublico(id);
        cotizacion = await Cotizacion.encontrarPorId(id);
      }

      const linkPublico = sharingService.generarLinkPublico(
        cotizacion.token_publico,
      );
      const resultado = await sharingService.enviarWhatsApp(
        telefono,
        linkPublico,
        cotizacion,
      );

      res.json({
        success: true,
        message: "Cotización compartida por WhatsApp",
        data: resultado,
      });
    } catch (error) {
      console.error("Error al compartir por WhatsApp:", error);
      res.status(500).json({
        success: false,
        message: "Error al compartir la cotización",
      });
    }
  },
  async compartirEmail(req, res) {
    try {
      const { id } = req.params;
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Correo electrónico requerido",
        });
      }

      let cotizacion = await Cotizacion.encontrarPorId(id);

      if (!cotizacion) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada",
        });
      }

      cotizacion.total = parseFloat(cotizacion.total) || 0;
      cotizacion.subtotal = parseFloat(cotizacion.subtotal) || 0;
      cotizacion.igv = parseFloat(cotizacion.igv) || 0;
      cotizacion.descuento = parseFloat(cotizacion.descuento) || 0;

      // Generar token si no existe
      if (!cotizacion.token_publico) {
        await Cotizacion.generarTokenPublico(id);
        cotizacion = await Cotizacion.encontrarPorId(id);
        cotizacion.total = parseFloat(cotizacion.total) || 0;
        cotizacion.subtotal = parseFloat(cotizacion.subtotal) || 0;
        cotizacion.igv = parseFloat(cotizacion.igv) || 0;
        cotizacion.descuento = parseFloat(cotizacion.descuento) || 0;
      }

      const linkPublico = sharingService.generarLinkPublico(
        cotizacion.token_publico,
      );
      const resultado = await sharingService.enviarEmail(
        email,
        linkPublico,
        cotizacion,
      );

      res.json({
        success: true,
        message: "Cotización enviada por email",
        data: resultado,
      });
    } catch (error) {
      console.error("Error al enviar email:", error);
      res.status(500).json({
        success: false,
        message: "Error al enviar el email",
        error: error.message,
      });
    }
  },
  async  obtenerPlantilla(req, res) {
  try {
    const { id } = req.params;

    const plantilla = await Cotizacion.encontrarPorId(id);

    if (!plantilla) {
      return res.status(404).json({
        success: false,
        message: "Plantilla no encontrada",
      });
    }

    if (!plantilla.es_modelo) {
      return res.status(400).json({
        success: false,
        message: "Esta cotización no es una plantilla",
      });
    }

    // Enriquecer ítems con precios actuales
    const detallesEnriquecidos = await Promise.all(
      plantilla.detalles.map(async (detalle) => {
        // Ítem con artículo y marca — buscar precio actual
        if (detalle.articulo_id && detalle.marca_id) {
          const [rows] = await pool.execute(
            `SELECT amp.precio_venta, amp.stock_actual, m.nombre as marca_nombre
             FROM Articulo_Marca_Precio amp
             JOIN Marca_Repuesto m ON m.marca_id = amp.marca_id
             WHERE amp.articulo_id = ? AND amp.marca_id = ?`,
            [detalle.articulo_id, detalle.marca_id],
          );

          if (rows.length > 0) {
            return {
              articulo_id: detalle.articulo_id,
              marca_id: detalle.marca_id,
              descripcion_custom: detalle.descripcion_custom,
              cantidad: detalle.cantidad,
              precio_unitario: Number(rows[0].precio_venta) || 0,
              descuento: 0, // siempre en 0
              es_servicio: detalle.es_servicio,
              subtotal:
                detalle.cantidad * (Number(rows[0].precio_venta) || 0),
            };
          }
        }

        // Ítem sin artículo (custom/servicio) — precio de la plantilla, descuento en 0
        return {
          articulo_id: detalle.articulo_id || null,
          marca_id: detalle.marca_id || null,
          descripcion_custom: detalle.descripcion_custom,
          cantidad: detalle.cantidad,
          precio_unitario: Number(detalle.precio_unitario) || 0,
          descuento: 0,
          es_servicio: detalle.es_servicio,
          subtotal:
            detalle.cantidad * (Number(detalle.precio_unitario) || 0),
        };
      }),
    );

    res.json({
      success: true,
      data: {
        plantilla_id: plantilla.cotizacion_id,
        nombre_modelo: plantilla.nombre_modelo,
        detalles: detallesEnriquecidos,
      },
    });
  } catch (error) {
    console.error("Error al obtener plantilla:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la plantilla",
    });
  }
},
async  listarPlantillas(req, res) {
  try {
    const { busqueda } = req.query;

    let sql = `
      SELECT
        c.cotizacion_id,
        c.nombre_modelo,
        c.fecha_emision,
        c.subtotal,
        c.total,
        COUNT(dc.detalle_id) as total_items
      FROM Cotizacion c
      LEFT JOIN Detalle_cotizacion dc ON dc.cotizacion_id = c.cotizacion_id
      WHERE c.es_modelo = 1
        AND c.deleted_at IS NULL
    `;
    const params = [];

    if (busqueda && busqueda.trim()) {
      sql += ` AND c.nombre_modelo LIKE ?`;
      params.push(`%${busqueda.trim()}%`);
    }

    sql += ` GROUP BY c.cotizacion_id ORDER BY c.cotizacion_id DESC`;

    const [rows] = await pool.execute(sql, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error al listar plantillas:", error);
    res.status(500).json({
      success: false,
      message: "Error al listar plantillas",
    });
  }
},

async  guardarComoPlantilla(req, res) {
  try {
    const { nombre_modelo, detalles } = req.body;

    if (!nombre_modelo || !nombre_modelo.trim()) {
      return res.status(400).json({
        success: false,
        message: "El nombre de la plantilla es obligatorio",
      });
    }

    if (!detalles || detalles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "La plantilla debe tener al menos un ítem",
      });
    }

    let subtotal = 0;
    const detallesCalc = detalles.map((d) => {
      const subtotalItem = d.cantidad * d.precio_unitario - (d.descuento || 0);
      subtotal += subtotalItem;
      return { ...d, subtotal: subtotalItem };
    });

    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    const numeroCotizacion = await generarNumeroCotizacion();

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const plantillaId = await Cotizacion.crear(
        {
          cliente_id: null,
          vehiculo_id: null,
          cita_id: null,
          creado_por: req.user.username,
          es_modelo: 1,
          nombre_modelo: nombre_modelo.trim(),
          kilometraje_momento: null,
          subtotal,
          descuento: 0,
          igv,
          total,
          fecha_emision: new Date().toISOString().split("T")[0],
          fecha_vencimiento: null,
          fecha_entrega: null,
          observaciones: null,
          numero_cotizacion: numeroCotizacion,
        },
        conn,
      );

      for (const detalle of detallesCalc) {
        await DetalleCotizacion.crear(
          {
            cotizacion_id: plantillaId,
            articulo_id: detalle.articulo_id || null,
            marca_id: detalle.marca_id || null,
            descripcion_custom: detalle.descripcion_custom || null,
            cantidad: detalle.cantidad,
            precio_unitario: detalle.precio_unitario,
            descuento: detalle.descuento || 0,
            subtotal: detalle.subtotal,
            es_servicio: detalle.es_servicio || 0,
          },
          conn,
        );
      }

      await conn.commit();

      res.status(201).json({
        success: true,
        message: "Plantilla guardada exitosamente",
        data: { plantilla_id: plantillaId, nombre_modelo },
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Error al guardar plantilla:", error);
    res.status(500).json({
      success: false,
      message: "Error al guardar la plantilla",
      error: error.message,
    });
  }
}
  
};

module.exports = cotizacionController;
