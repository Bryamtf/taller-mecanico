const express = require("express");
const router = express.Router();
const imagenController = require("../controllers/imagenController");
const {
  authMiddleware,
  checkPermiso,
} = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.delete(
  "/:imagenId",
  checkPermiso("editar_cotizaciones"),
  imagenController.eliminar,
);

module.exports = router;
