const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');
const { authMiddleware, checkPermiso } = require('../middleware/authMiddleware');

router.get('/',             authMiddleware, checkPermiso('ver_citas'),      citaController.obtenerCitas);
router.get('/:id',          authMiddleware, checkPermiso('ver_citas'),      citaController.obtenerCitaPorId);
router.post('/',            authMiddleware, checkPermiso('crear_citas'),    citaController.crearNuevaCita);
router.put('/:id',          authMiddleware, checkPermiso('editar_citas'),   citaController.actualizarCita);
router.patch('/:id/estado', authMiddleware, checkPermiso('editar_citas'),   citaController.cambiarEstadoCita);
router.delete('/:id',       authMiddleware, checkPermiso('eliminar_citas'), citaController.eliminarCita);

module.exports = router;
