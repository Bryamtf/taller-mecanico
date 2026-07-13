const express = require("express");
const router = express.Router();
const cotizacionController = require("../controllers/cotizacionController");
const imagenController = require("../controllers/imagenController");
const {
  authMiddleware,
  checkPermiso,
} = require("../middleware/authMiddleware");
const { uploadImagenesCotizacion } = require("../middleware/uploadMiddleware");

router.get("/public/:token", cotizacionController.obtenerPorToken);
router.get(
  "/public/:token/imagenes",
  cotizacionController.obtenerImagenesPorToken,
);
router.get("/:id/pdf", cotizacionController.descargarPDF);
router.post("/:id/compartir/whatsapp", cotizacionController.compartirWhatsApp);
router.post("/:id/compartir/email", cotizacionController.compartirEmail);

router.use(authMiddleware);

router.get(
  "/plantillas",
  checkPermiso("ver_cotizaciones"),
  cotizacionController.listarPlantillas,
);
router.get(
  "/plantillas/:id",
  checkPermiso("ver_cotizaciones"),
  cotizacionController.obtenerPlantilla,
);
router.post(
  "/plantillas",
  checkPermiso("crear_cotizaciones"),
  cotizacionController.guardarComoPlantilla,
);

// CRUD principal
router.get("/", checkPermiso("ver_cotizaciones"), cotizacionController.listar);
router.get(
  "/:id",
  checkPermiso("ver_cotizaciones"),
  cotizacionController.obtener,
);
router.post(
  "/",
  authMiddleware,
  checkPermiso("crear_cotizaciones"),
  uploadImagenesCotizacion.array("imagenes", 10),
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

// Imágenes
router.get(
  "/:id/imagenes",
  checkPermiso("ver_cotizaciones"),
  imagenController.listar,
);
router.post(
  "/:id/imagenes",
  checkPermiso("editar_cotizaciones"),
  uploadImagenesCotizacion.array("imagenes", 10),
  imagenController.agregar,
);

// Utilidades
router.get(
  "/:id/descargar-pdf",
  checkPermiso("ver_cotizaciones"),
  cotizacionController.descargarPDF,
);
router.post(
  "/:id/compartir",
  checkPermiso("ver_cotizaciones"),
  cotizacionController.compartir,
);

module.exports = router;
