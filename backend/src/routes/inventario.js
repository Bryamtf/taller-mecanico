const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController'); // Ajusta la ruta a tu archivo

// Ruta GET para obtener los datos (la que ya tenías)
router.get('/', inventarioController.obtenerInventario);

// NUEVA Ruta POST para guardar los datos
router.post('/', inventarioController.crearNuevoArticulo); 

module.exports = router;