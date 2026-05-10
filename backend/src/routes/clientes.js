const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Ruta para el autocompletado mientras el admin escribe (Debe ir primero)
// Endpoint: GET /api/clientes/buscar?q=termino
router.get('/buscar', clienteController.buscarClientes);

// Ruta para guardar un nuevo cliente (y su carro) desde el formulario
// Endpoint: POST /api/clientes
router.post('/', clienteController.crearCliente);

module.exports = router;