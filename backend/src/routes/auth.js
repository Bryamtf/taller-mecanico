const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/login", authController.login);

router.get("/verificar", authMiddleware, authController.verificarToken);
router.post(
  "/cambiar-password",
  authMiddleware,
  authController.cambiarPassword,
);

module.exports = router;
