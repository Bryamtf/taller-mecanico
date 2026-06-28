const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const authMiddleware = require('../middleware/authMiddleware');
const checkPermiso = require('../middleware/checkPermiso');

router.use(authMiddleware);

router.get('/resumen', checkPermiso('ver_ventas'), ventaController.obtenerResumen);
router.get('/pendientes', checkPermiso('ver_ventas'), ventaController.listarPendientes);
router.get('/historial', checkPermiso('ver_ventas'), ventaController.listarHistorial);
router.get('/:id', checkPermiso('ver_ventas'), ventaController.obtenerPorId);

router.post('/', checkPermiso('crear_ventas'), ventaController.generarVenta);
router.patch('/:id/anular', checkPermiso('crear_ventas'), ventaController.anularVenta);

module.exports = router;
