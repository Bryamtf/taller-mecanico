const express = require("express");
const router = express.Router();
const permisoController = require("../controllers/permisoController");
const { authMiddleware, checkPermiso } = require("../middleware/authMiddleware");

router.get(
  "/",
  authMiddleware,
  checkPermiso("ver_usuarios"),
  permisoController.listarPermisos,
);

module.exports = router;
