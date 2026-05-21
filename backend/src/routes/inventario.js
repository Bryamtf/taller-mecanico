const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');
const { authMiddleware, checkPermiso } = require('../middleware/authMiddleware');

// 1. Ruta GET para el listado general (Protegida)
router.get('/', 
    authMiddleware, 
    checkPermiso('ver_inventario'), 
    inventarioController.obtenerInventario
);

module.exports = router;