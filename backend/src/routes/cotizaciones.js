const express = require("express");
const router = express.Router();
const cotizacionController = require("../controllers/cotizacionController");
const {
  authMiddleware,
  checkPermiso,
} = require("../middleware/authMiddleware");

// Todas requieren autenticación
router.use(authMiddleware);

// CRUD principal
router.get("/", checkPermiso("ver_cotizaciones"), cotizacionController.listar);
router.get(
  "/:id",
  checkPermiso("ver_cotizaciones"),
  cotizacionController.obtener,
);
router.post(
  "/",
  checkPermiso("crear_cotizaciones"),
  cotizacionController.crear,
);
router.put(
  "/:id",
  checkPermiso("editar_cotizaciones"),
  cotizacionController.actualizar,
);
router.delete(
  "/:id",
  checkPermiso("eliminar_cotizaciones"),
  cotizacionController.eliminar,
);

// Estados
router.patch(
  "/:id/estado",
  checkPermiso("editar_cotizaciones"),
  cotizacionController.cambiarEstado,
);
/*
router.post(
  "/:id/aprobar",
  checkPermiso("editar_cotizaciones"),
  cotizacionController.aprobar,
);
// Detalles
router.post(
  "/:id/detalles",
  checkPermiso("editar_cotizaciones"),
  cotizacionController.agregarDetalle,
);
router.put(
  "/detalles/:detalleId",
  checkPermiso("editar_cotizaciones"),
  cotizacionController.actualizarDetalle,
);
router.delete(
  "/detalles/:detalleId",
  checkPermiso("editar_cotizaciones"),
  cotizacionController.eliminarDetalle,
);
*/
// Utilidades
/*
router.post(
  "/:id/clonar",
  checkPermiso("crear_cotizaciones"),
  cotizacionController.clonar,
);*/
router.post(
  "/:id/generar-pdf",
  checkPermiso("ver_cotizaciones"),
  cotizacionController.generarPDF,
);
router.post(
  "/:id/compartir",
  checkPermiso("ver_cotizaciones"),
  cotizacionController.compartir,
);

// Público (con token, sin auth)
router.get("/public/:token", cotizacionController.obtenerPorToken);
router.get("/:id/pdf", cotizacionController.descargarPDF);
router.post("/:id/pdf", cotizacionController.generarYGuardarPDF);
router.post("/:id/compartir/whatsapp", cotizacionController.compartirWhatsApp);
router.post("/:id/compartir/email", cotizacionController.compartirEmail);
module.exports = router;
