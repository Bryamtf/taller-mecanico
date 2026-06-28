const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/tipos", async (req, res) => {
  try {
    const [tipos] = await pool.query(
      `SELECT tipo_comprobante_id, nombre, codigo FROM Tipo_comprobante WHERE activo = 1 ORDER BY nombre`
    );
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener tipos de comprobante." });
  }
});

router.get("/", (req, res) => {
  res.json({ message: "Ruta de comprobantes funcionando" });
});

module.exports = router;
