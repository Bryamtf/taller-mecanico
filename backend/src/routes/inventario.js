const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

// Ruta GET para el listado general
router.get('/', inventarioController.obtenerInventario);

module.exports = router;