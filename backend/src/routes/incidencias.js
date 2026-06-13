const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadIncidencias } = require('../middleware/uploadMiddleware');

const {
  listarIncidencias,
  obtenerIncidencia,
  crearIncidencia,
  editarIncidencia,
  cambiarEstado,
  asignarIncidencia,
  agregarNota,
  eliminarIncidencia,
} = require('../controllers/incidenciaController');

router.use(verifyToken);

router.get('/',           listarIncidencias);
router.get('/:id',        obtenerIncidencia);
router.post('/',          uploadIncidencias.array('imagenes', 5), crearIncidencia);
router.put('/:id',        editarIncidencia);
router.patch('/:id/estado',   cambiarEstado);
router.patch('/:id/asignar',  asignarIncidencia);
router.post('/:id/notas',     agregarNota);
router.delete('/:id',         eliminarIncidencia);

module.exports = router;
