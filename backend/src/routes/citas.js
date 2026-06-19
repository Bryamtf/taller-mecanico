const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');

// Ruta GET: /api/citas
router.get('/', citaController.obtenerCitas);

// Ruta POST: /api/citas
router.post('/', citaController.crearNuevaCita); 

module.exports = router;