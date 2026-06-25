const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");
const {
  authMiddleware,
  checkPermiso,
  checkRol,
  checkRolOrPermiso,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  authMiddleware,
  checkPermiso("ver_usuarios"),
  usuarioController.listarUsuarios,
);

router.post(
  "/",
  authMiddleware,
  checkRol(["admin", "super_admin"]),
  usuarioController.crearUsuario,
);

router.put(
  "/:username",
  authMiddleware,
  checkRolOrPermiso(["admin", "super_admin"], "editar_usuarios"),
  usuarioController.actualizarUsuario,
);

router.delete(
  "/:username",
  authMiddleware,
  checkRolOrPermiso(["admin", "super_admin"], "editar_usuarios"),
  usuarioController.eliminarUsuario,
);

router.patch(
  "/:username/estado",
  authMiddleware,
  checkPermiso("editar_usuarios"),
  usuarioController.cambiarEstado,
);

router.patch(
  "/:username/reset-password",
  authMiddleware,
  checkRol(["admin", "super_admin"]),
  usuarioController.resetPassword,
);

module.exports = router;
