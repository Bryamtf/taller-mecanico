const express = require('express');
const router = express.Router();
const marcaController = require('../controllers/marcaController');
const {validateMarca} = require('../middleware/validationMiddleware')
const {authMiddleware, checkPermiso} = require('../middleware/authMiddleware')

router.get('/', 
    authMiddleware, 
    checkPermiso('ver_inventario'), 
    marcaController.obtenerMarcas
);

router.get('/:id', 
    authMiddleware, 
    checkPermiso('ver_inventario'), 
    marcaController.obtenerMarca
);

router.post('/', 
    authMiddleware, 
    checkPermiso('editar_inventario'), 
    validateMarca, 
    marcaController.crearMarca
);

router.put('/:id', 
    authMiddleware, 
    checkPermiso('editar_inventario'), 
    validateMarca, 
    marcaController.actualizarMarca
);

router.delete('/:id', 
    authMiddleware, 
    checkPermiso('editar_inventario'), 
    marcaController.eliminarMarca
);

module.exports = router;