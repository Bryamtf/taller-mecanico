const express = require('express');
const router  = express.Router();
const articuloController = require('../controllers/articuloController');
const loteController     = require('../controllers/loteController');
const { uploadArticulos } = require('../middleware/uploadMiddleware');
const { authMiddleware, checkPermiso } = require('../middleware/authMiddleware');
const { validateArticulo } = require('../middleware/validationMiddleware');

const auth    = authMiddleware;
const canView = checkPermiso('ver_inventario');
const canEdit = checkPermiso('editar_inventario');

// Rutas específicas ANTES de /:id para evitar conflictos
router.put('/imagenes/orden', auth, canEdit, articuloController.cambiarOrdenImagenes);

// CRUD artículo
router.post('/',    auth, canEdit, uploadArticulos.array('imagenes', 5), validateArticulo, articuloController.crearNuevoArticulo);
router.put('/:id',  auth, canEdit, uploadArticulos.array('imagenes', 5), articuloController.editarArticulo);
router.delete('/:id',         auth, canEdit, articuloController.eliminarArticulo);
router.patch('/:id/reactivar', auth, canEdit, articuloController.reactivarArticulo);

// Gestión de marcas por artículo
router.post('/:id/marcas',                        auth, canEdit, articuloController.agregarMarca);
router.put('/:id/marcas/:marca_id',               auth, canEdit, articuloController.actualizarMarca);
router.delete('/:id/marcas/:marca_id',            auth, canEdit, articuloController.eliminarMarca);
router.post('/:id/marcas/:marca_id/ajuste',       auth, canEdit, articuloController.ajustarStock);

// Gestión de lotes por artículo
router.get('/:id/lotes',              auth, canView, loteController.listar);
router.post('/:id/lotes',             auth, canEdit, loteController.crear);
router.patch('/:id/lotes/:loteId',    auth, canEdit, loteController.actualizar);
router.delete('/:id/lotes/:loteId',   auth, canEdit, loteController.desactivar);

module.exports = router;
