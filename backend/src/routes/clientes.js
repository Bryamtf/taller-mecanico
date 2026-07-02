const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Rutas especiales antes de /:id para evitar conflictos
router.get('/buscar', clienteController.buscarClientes);
router.get('/varios', clienteController.obtenerClienteVarios);

router.get('/',     clienteController.listarClientes);
router.get('/:id',  clienteController.obtenerCliente);
router.post('/',    clienteController.crearCliente);
router.put('/:id',  clienteController.actualizarCliente);
router.patch('/:id/estado', clienteController.cambiarEstadoCliente);

module.exports = router;
