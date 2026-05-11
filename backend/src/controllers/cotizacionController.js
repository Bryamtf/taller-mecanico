const Cotizacion = require("../models/Cotizacion");
const DetalleCotizacion = require("../models/DetalleCotizacion");
const pdfService = require("../services/pdfService");
const sharingService = require("../services/sharingService");

const cotizacionController = {
  async crear(req, res) {
    try {
      const {
        cliente_id,
        vehiculo_id,
        cita_id,
        es_modelo,
        nombre_modelo,
        kilometraje_momento,
        detalles,
        fecha_vencimiento,
        observaciones,
      } = req.body;

      if (!cliente_id) {
        return res.status(400).json({
          success: false,
          message: "Elegir cliente es obligatorio",
        });
      }

      if (!vehiculo_id) {
        return res.status(400).json({
          success: false,
          message: "Elegir vehiculo es obligatorio",
        });
      }

      if (!detalles || detalles.length === 0) {
        return res.status(400).json({
          success: false,
          message: "La cotizacion debe tener al menos un detalle",
        });
      }

      let subtotal = 0;
      const detallesCalc = detalles.map((d) => {
        const subtotalItem =
          d.cantidad * d.precio_unitario - (d.descuento || 0);
        subtotal += subtotalItem;
        return { ...d, subtotal: subtotalItem };
      });

      const igv = subtotal * 0.18;
      const total = subtotal + igv;
      const cotizacionId = await Cotizacion.crear({
        cliente_id,
        vehiculo_id,
        cita_id: cita_id || null,
        creado_por: req.user.username,
        es_modelo: es_modelo || 0,
        nombre_modelo: nombre_modelo || null,
        kilometraje_momento,
        subtotal,
        descuento: 0,
        igv,
        total,
        fecha_emision: new Date().toISOString().split("T")[0],
        fecha_vencimiento,
        observaciones,
      });
      for (const detalle of detallesCalc) {
        await DetalleCotizacion.crear({
          cotizacion_id: cotizacionId,
          articulo_id: detalle.articulo_id || null,
          marca_id: detalle.marca_id || null,
          descripcion_custom: detalle.descripcion_custom || null,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          descuento: detalle.descuento || 0,
          subtotal: detalle.subtotal,
          es_servicio: detalle.es_servicio || 0,
        });
      }
      const nuevaCotizacion = await Cotizacion.encontrarPorId(cotizacionId);
      res.status(201).json({
        success: true,
        message: "Cotización creada exitosamente",
        data: nuevaCotizacion,
      });
    } catch (error) {
      console.error("Error al crear cotización:", error);
      res.status(500).json({
        success: false,
        message: "Error al crear la cotización",
        error: error.message,
      });
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

      const cotizacionExistente = await Cotizacion.encontrarPorId(id);
      if (!cotizacionExistente) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada",
        });
      }

      // No permitir editar si está aprobada (opcional según reglas de negocio)
      if (cotizacionExistente.estado === "aprobada") {
        return res.status(400).json({
          success: false,
          message: "No se puede editar una cotización ya aprobada",
        });
      }

      const {
        cliente_id,
        vehiculo_id,
        cita_id,
        es_modelo,
        nombre_modelo,
        kilometraje_momento,
        detalles,
        fecha_vencimiento,
        observaciones,
        descuento_adicional,
      } = req.body;

      // Validar campos obligatorios
      if (!cliente_id || !vehiculo_id) {
        return res.status(400).json({
          success: false,
          message: "Cliente y vehículo son obligatorios",
        });
      }

      if (!detalles || detalles.length === 0) {
        return res.status(400).json({
          success: false,
          message: "La cotización debe tener al menos un detalle",
        });
      }

      // Recalcular totales
      let subtotal = 0;
      const detallesCalculados = detalles.map((d) => {
        const subtotalItem =
          d.cantidad * d.precio_unitario - (d.descuento || 0);
        subtotal += subtotalItem;
        return {
          ...d,
          subtotal: subtotalItem,
        };
      });

      // Aplicar descuento adicional si existe
      const descuento = descuento_adicional || 0;
      const subtotalConDescuento = subtotal - descuento;
      const igv = subtotalConDescuento * 0.18;
      const total = subtotalConDescuento + igv;

      // Actualizar encabezado de la cotización
      const actualizado = await Cotizacion.actualizarCotizacion(id, {
        cliente_id,
        vehiculo_id,
        cita_id: cita_id || null,
        es_modelo: es_modelo || 0,
        nombre_modelo: nombre_modelo || null,
        kilometraje_momento: kilometraje_momento || null,
        subtotal,
        descuento,
        igv,
        total,
        fecha_vencimiento: fecha_vencimiento || null,
        observaciones: observaciones || null,
      });

      if (!actualizado) {
        return res.status(500).json({
          success: false,
          message: "Error al actualizar la cotización",
        });
      }

      // Eliminar detalles antiguos
      await DetalleCotizacion.eliminarPorCotizacionId(id);

      // Insertar nuevos detalles
      for (const detalle of detallesCalculados) {
        await DetalleCotizacion.crear({
          cotizacion_id: id,
          articulo_id: detalle.articulo_id || null,
          marca_id: detalle.marca_id || null,
          descripcion_custom: detalle.descripcion_custom || null,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          descuento: detalle.descuento || 0,
          subtotal: detalle.subtotal,
          es_servicio: detalle.es_servicio || 0,
        });
      }

      const cotizacionActualizada = await Cotizacion.encontrarPorId(id);

      res.json({
        success: true,
        message: "Cotización actualizada exitosamente",
        data: cotizacionActualizada,
      });
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
      const filename = `cotizacion_${id}_${Date.now()}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=${filename}`);
      res.send(pdfBuffer);
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
  async generarYGuardarPDF(req, res) {
    try {
      const { id } = req.params;

      const cotizacion = await Cotizacion.encontrarPorId(id);

      if (!cotizacion) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada",
        });
      }

      const rutaPDF = await pdfService.guardarArchivo(cotizacion);

      await Cotizacion.actualizarCotizacion(id, { pdf_path: rutaPDF });

      res.json({
        success: true,
        message: "PDF generado exitosamente",
        data: { ruta: rutaPDF },
      });
    } catch (error) {
      console.error("Error al generar PDF:", error);
      res.status(500).json({
        success: false,
        message: "Error al generar el PDF",
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

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=cotizacion_${id}.pdf`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error al descargar PDF:", error);
      res.status(500).json({
        success: false,
        message: "Error al descargar el PDF",
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

      // Generar token si no existe
      if (!cotizacion.token_publico) {
        await Cotizacion.generarTokenPublico(id);
        cotizacion = await Cotizacion.encontrarPorId(id);
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
      });
    }
  },
};
module.exports = cotizacionController;
