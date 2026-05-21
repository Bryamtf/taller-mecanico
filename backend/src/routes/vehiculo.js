const express = require('express');
const router = express.Router();
const vehiculoController = require('../controllers/vehiculoController');
const { validateVehiculo } = require('../middleware/validationMiddleware');
const { authMiddleware, checkPermiso } = require('../middleware/authMiddleware');

// GET - Protegido por JWT y permiso de ver_citas
router.get('/', authMiddleware, checkPermiso('ver_citas'), vehiculoController.obtenerVehiculos);
router.get('/:id', authMiddleware, checkPermiso('ver_citas'), vehiculoController.obtenerVehiculo);

// POST y PUT - Protegidos, validados y con conexión a la API externa
router.post('/', authMiddleware, checkPermiso('crear_citas'), validateVehiculo, vehiculoController.crearVehiculo);
router.put('/:id', authMiddleware, checkPermiso('editar_citas'), vehiculoController.actualizarVehiculo);

// DELETE
router.delete('/:id', authMiddleware, checkPermiso('eliminar_citas'), vehiculoController.eliminarVehiculo);

module.exports = router;