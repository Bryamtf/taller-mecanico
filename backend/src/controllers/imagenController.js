const pool = require("../config/database");
const Cotizacion = require("../models/Cotizacion");
const imagenService = require("../services/imagenService");
const fs = require("fs");
const path = require("path");

const ESTADOS_BLOQUEADOS = ["aprobada", "rechazada"];

const imagenController = {
  async listar(req, res) {
    try {
      const { id } = req.params; // cotizacion_id

      const [rows] = await pool.execute(
        `SELECT * FROM Imagenes WHERE cotizacion_id = ? ORDER BY orden ASC`,
        [id],
      );

      res.json({ success: true, data: rows });
    } catch (error) {
      console.error("Error al listar imágenes:", error);
      res.status(500).json({
        success: false,
        message: "Error al listar las imágenes",
      });
    }
  },

  async agregar(req, res) {
    const { id } = req.params; // cotizacion_id
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se enviaron imágenes",
      });
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

    try {
      const cotizacion = await Cotizacion.encontrarPorId(id);
      if (!cotizacion) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada",
        });
      }

      if (ESTADOS_BLOQUEADOS.includes(cotizacion.estado)) {
        return res.status(400).json({
          success: false,
          message: `No se pueden agregar imágenes a una cotización ${cotizacion.estado}`,
        });
      }

      const [countRows] = await pool.query(
        `SELECT COUNT(*) as total FROM Imagenes WHERE cotizacion_id = ?`,
        [id],
      );
      const total = countRows[0].total;

      if (total + files.length > 10) {
        return res.status(400).json({
          success: false,
          message: `Máximo 10 imágenes por cotización (ya tiene ${total})`,
        });
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await imagenService.procesarImagenes(
          files,
          id,
          req.user.username,
          conn,
          total,
          descripcionesImagenes,
        );
        await conn.commit();
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }

      const [imagenesActualizadas] = await pool.execute(
        `SELECT * FROM Imagenes WHERE cotizacion_id = ? ORDER BY orden ASC`,
        [id],
      );

      res.status(201).json({
        success: true,
        message: "Imágenes agregadas exitosamente",
        data: imagenesActualizadas,
      });
    } catch (error) {
      console.error("Error al agregar imágenes:", error);
      res.status(500).json({
        success: false,
        message: "Error al agregar las imágenes",
        error: error.message,
      });
    }
  },

  async eliminar(req, res) {
    const { imagenId } = req.params;

    try {
      const [rows] = await pool.execute(
        `SELECT * FROM Imagenes WHERE imagen_id = ?`,
        [imagenId],
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Imagen no encontrada",
        });
      }

      const imagen = rows[0];

      if (imagen.cotizacion_id) {
        const cotizacion = await Cotizacion.encontrarPorId(
          imagen.cotizacion_id,
        );
        if (cotizacion && ESTADOS_BLOQUEADOS.includes(cotizacion.estado)) {
          return res.status(400).json({
            success: false,
            message: `No se pueden eliminar imágenes de una cotización ${cotizacion.estado}`,
          });
        }
      }

       await imagenService.eliminarDeCloudinary(imagen.ruta_archivo);

       await pool.execute(`DELETE FROM Imagenes WHERE imagen_id = ?`, [
         imagenId,
       ]);

      res.json({
        success: true,
        message: "Imagen eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error al eliminar imagen:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar la imagen",
      });
    }
  },
};

module.exports = imagenController;
