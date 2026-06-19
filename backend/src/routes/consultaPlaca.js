const express = require('express');
const router  = express.Router();
const { consultarPlacaExterna } = require('../controllers/vehiculoController');

router.post('/', consultarPlacaExterna);

module.exports = router;
