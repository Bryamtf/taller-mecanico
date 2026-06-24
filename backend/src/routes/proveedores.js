const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/proveedorController');
const { authMiddleware, checkPermiso } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/',     checkPermiso('ver_inventario'),    ctrl.listar);
router.get('/:id',  checkPermiso('ver_inventario'),    ctrl.obtener);
router.post('/',    checkPermiso('editar_inventario'), ctrl.crear);
router.put('/:id',  checkPermiso('editar_inventario'), ctrl.actualizar);
router.patch('/:id/estado', checkPermiso('editar_inventario'), ctrl.cambiarEstado);

module.exports = router;
