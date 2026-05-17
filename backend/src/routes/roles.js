const express = require("express");
const router = express.Router();
const rolController = require("../controllers/rolController");
const { authMiddleware, checkPermiso } = require("../middleware/authMiddleware");

router.get(
  "/",
  authMiddleware,
  checkPermiso("ver_usuarios"),
  rolController.listarRoles,
);

router.post(
  "/",
  authMiddleware,
  checkPermiso("editar_usuarios"),
  rolController.crearRol,
);

router.put(
  "/:id",
  authMiddleware,
  checkPermiso("editar_usuarios"),
  rolController.actualizarRol,
);

router.delete(
  "/:id",
  authMiddleware,
  checkPermiso("editar_usuarios"),
  rolController.eliminarRol,
);

module.exports = router;
