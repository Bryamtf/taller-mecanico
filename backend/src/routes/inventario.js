const express = require("express");
const router = express.Router();
const inventarioController = require("../controllers/inventarioController");
const {
  authMiddleware,
  checkPermiso,
} = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get(
  "/",
  checkPermiso("ver_inventario"),
  inventarioController.obtenerInventario,
);

router.get(
  "/articulos",
  checkPermiso("ver_inventario"),
  inventarioController.listarArticulos,
);

router.get(
  "/articulos/buscar",
  checkPermiso("ver_inventario"),
  inventarioController.buscarArticulos,
);

router.get(
  "/articulos/:id",
  checkPermiso("ver_inventario"),
  inventarioController.obtenerArticulo,
);

router.get(
  "/articulos/:id/movimientos",
  checkPermiso("ver_inventario"),
  inventarioController.obtenerMovimientos,
);

router.get(
  "/alertas",
  checkPermiso("ver_inventario"),
  inventarioController.obtenerArticulosEnAlerta,
);

module.exports = router;
