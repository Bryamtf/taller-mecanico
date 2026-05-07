const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  const { placa } = req.body;
  res.json({
    message: "Consulta de placa (implementar después con json.pe)",
    placa: placa,
  });
});

module.exports = router;
