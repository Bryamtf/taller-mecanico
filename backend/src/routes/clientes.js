const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Ruta de clientes funcionando" });
});

router.post("/", (req, res) => {
  res.json({ message: "Crear nuevo cliente", data: req.body });
});

module.exports = router;
