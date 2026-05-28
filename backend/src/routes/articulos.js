const express = require('express');
const router = express.Router();
const articuloController = require('../controllers/articuloController');
const {uploadArticulos} = require('../middleware/uploadMiddleware');
const { authMiddleware, checkPermiso } = require('../middleware/authMiddleware');
const { validateArticulo } = require('../middleware/validationMiddleware');

// IMAGENES DE ARTÍCULOS
router.post('/', 
    authMiddleware, 
    checkPermiso('editar_inventario'), 
    uploadArticulos.array('imagenes', 5), 
    validateArticulo, 
    articuloController.crearNuevoArticulo
);

// PUT: Editar artículo (textos e imágenes nuevas)
router.put('/:id', 
    authMiddleware, 
    checkPermiso('editar_inventario'), 
    uploadArticulos.array('imagenes', 5), 
    validateArticulo, 
    articuloController.editarArticulo
);

// PUT: Cambiar el orden numérico de las imágenes (Solo recibe un JSON, no usa Multer)
router.put('/imagenes/orden', 
    authMiddleware, 
    checkPermiso('editar_inventario'), 
    articuloController.cambiarOrdenImagenes
);

// DELETE: Eliminar (Borrado lógico)
router.delete('/:id', 
    authMiddleware, 
    checkPermiso('editar_inventario'), 
    articuloController.eliminarArticulo
);

// PATCH: Reactivar artículo eliminado
router.patch('/:id/reactivar', 
    authMiddleware, 
    checkPermiso('editar_inventario'), 
    articuloController.reactivarArticulo
);

module.exports = router;