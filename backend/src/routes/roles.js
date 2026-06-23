const express = require("express");
const router = express.Router();
const rolController = require("../controllers/rolController");
const { authMiddleware, checkPermiso, checkRol, checkRolOrPermiso } = require("../middleware/authMiddleware");

router.get(
  "/",
  authMiddleware,
  checkPermiso("ver_usuarios"),
  rolController.listarRoles,
);

router.post(
  "/",
  authMiddleware,
  checkRol(["admin", "super_admin"]),
  rolController.crearRol,
);

router.put(
  "/:id",
  authMiddleware,
  checkRolOrPermiso(["admin", "super_admin"], "editar_usuarios"),
  rolController.actualizarRol,
);

router.delete(
  "/:id",
  authMiddleware,
  checkRol(["admin", "super_admin"]),
  rolController.eliminarRol,
);

router.patch(
  "/:id/estado",
  authMiddleware,
  checkRol(["super_admin"]),
  rolController.cambiarEstado,
);

module.exports = router;
