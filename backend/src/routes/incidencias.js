const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
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

router.use(authMiddleware);

router.get('/',           listarIncidencias);
router.get('/:id',        obtenerIncidencia);
router.post('/',          uploadIncidencias.array('imagenes', 5), crearIncidencia);
router.put('/:id',        uploadIncidencias.array('imagenes', 5), editarIncidencia);
router.patch('/:id/estado',   cambiarEstado);
router.patch('/:id/asignar',  asignarIncidencia);
router.post('/:id/notas',     agregarNota);
router.delete('/:id',         eliminarIncidencia);

module.exports = router;
