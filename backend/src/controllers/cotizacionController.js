const Cotizacion = require("../models/Cotizacion");
const DetalleCotizacion = require("../models/DetalleCotizacion");
const pdfService = require("../services/pdfService");
const sharingService = require("../services/sharingService");
const generarNumeroCotizacion = require("../utils/generarNumeroCotizacion");
const pool = require("../config/database");
const imagenService = require("../services/imagenService");
const { uploadImagenesCotizacion } = require("../middleware/uploadMiddleware");

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
          fecha_vencimiento,
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
      const { estado, cliente_id, es_modelo } = req.query;

      const cotizaciones = await Cotizacion.listarCotizaciones({
        estado,
        cliente_id,
        es_modelo,
      });
      res.json({
        success: true,
        data: cotizaciones,
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

      const estadosBloqueados = ["aprobada", "rechazada"];
      if (estadosBloqueados.includes(cotizacionExistente.estado)) {
        return res.status(400).json({
          success: false,
          message: `No se puede editar una cotización ${cotizacionExistente.estado}`,
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
    try {
      const { id } = req.params;
      const { estado } = req.body;
      const estadosValidos = [
        "borrador",
        "pendiente",
        "aprobada",
        "rechazada",
        "vencida",
      ];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
          success: false,
          message: "Estado no valido",
        });
      }

      const actualizado = await Cotizacion.actualizarEstado(id, estado);
      if (!actualizado) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada",
        });
      }

      res.json({
        success: true,
        message: `Estado actualizado a ${estado}`,
        data: { id, estado },
      });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      res.status(500).json({
        success: false,
        message: "Error al cambiar el estado",
      });
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
          numero: cotizacion.cotizacion_id,
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
};
module.exports = cotizacionController;
