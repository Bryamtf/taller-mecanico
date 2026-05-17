const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");
const {
  authMiddleware,
  checkPermiso,
  checkRol,
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
  checkPermiso("editar_usuarios"),
  usuarioController.crearUsuario,
);

router.put(
  "/:username",
  authMiddleware,
  checkPermiso("editar_usuarios"),
  usuarioController.actualizarUsuario,
);

router.delete(
  "/:username",
  authMiddleware,
  checkPermiso("editar_usuarios"),
  usuarioController.eliminarUsuario,
);

router.patch(
  "/:username/reset-password",
  authMiddleware,
  checkRol(["gerente", "socio"]),
  usuarioController.resetPassword,
);

module.exports = router;
