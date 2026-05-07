const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Ruta de citas funcionando" });
});

router.post("/", (req, res) => {
  res.json({ message: "Crear nueva cita", data: req.body });
});

router.get("/:id", (req, res) => {
  res.json({ message: `Obtener cita ${req.params.id}` });
});

module.exports = router; 
