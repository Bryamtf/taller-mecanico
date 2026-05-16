const express = require('express');
const router = express.Router();
const articuloController = require('../controllers/articuloController');

// Crear
router.post('/', articuloController.crearNuevoArticulo);

// Actualizar (PUT)
router.put('/:id', articuloController.editarArticulo);

// Eliminar (DELETE)
router.delete('/:id', articuloController.eliminarArticulo);

// Reactivar (PATCH)
router.patch('/:id/reactivar', articuloController.reactivarArticulo);

module.exports = router;