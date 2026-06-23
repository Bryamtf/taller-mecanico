import { Router } from "express";
import { emailService } from "../services/emailService.js";

const router = Router();

router.post("/cotizacion", async (req, res) => {
  try {
    const {
      to,
      cliente_nombre,
      numero_cotizacion,
      fecha_emision,
      marca,
      modelo,
      placa,
      total,
      estado,
      link_publico,
      pdf_base64,
    } = req.body;

    if (!to || !numero_cotizacion) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: to, numero_cotizacion",
      });
    }

    const pdf_buffer = pdf_base64 ? Buffer.from(pdf_base64, "base64") : null;

    const resultado = await emailService.enviarCotizacion({
      to,
      cliente_nombre,
      numero_cotizacion,
      fecha_emision,
      marca,
      modelo,
      placa,
      total,
      estado,
      link_publico,
      pdf_buffer,
    });

    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error("Error al enviar email de cotización:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error al enviar el correo",
    });
  }
});

export default router;
