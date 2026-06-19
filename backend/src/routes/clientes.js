const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Buscar debe ir antes de /:id para evitar conflicto de rutas
router.get('/buscar', clienteController.buscarClientes);

router.get('/',     clienteController.listarClientes);
router.get('/:id',  clienteController.obtenerCliente);
router.post('/',    clienteController.crearCliente);
router.put('/:id',  clienteController.actualizarCliente);
router.patch('/:id/estado', clienteController.cambiarEstadoCliente);

module.exports = router;
