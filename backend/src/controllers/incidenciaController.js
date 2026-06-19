const path = require('path');
const fs   = require('fs');
const Incidencia = require('../models/Incidencia');

const listarIncidencias = async (req, res) => {
  try {
    const { pagina = 1, busqueda = '', estado = '', prioridad = '', categoria = '' } = req.query;
    const result = await Incidencia.listar({
      pagina:    Number(pagina),
      limite:    10,
      busqueda,
      estado,
      prioridad,
      categoria,
    });
    res.json(result);
  } catch (error) {
    console.error('Error al listar incidencias:', error);
    res.status(500).json({ message: 'Error al obtener las incidencias' });
  }
};

const obtenerIncidencia = async (req, res) => {
  try {
    const incidencia = await Incidencia.obtenerPorId(req.params.id);
    if (!incidencia) return res.status(404).json({ message: 'Incidencia no encontrada' });
    res.json(incidencia);
  } catch (error) {
    console.error('Error al obtener incidencia:', error);
    res.status(500).json({ message: 'Error al obtener la incidencia' });
  }
};

const crearIncidencia = async (req, res) => {
  try {
    const datos = req.body;
    const username = req.user?.username || null;

    const archivos = (req.files || []).map((f) => ({
      ruta: `/uploads/incidencias/${f.filename}`,
    }));

    const result = await Incidencia.crear(
      { ...datos, reportado_por: datos.reportado_por || username },
      archivos
    );

    res.status(201).json({ message: 'Incidencia registrada', ...result });
  } catch (error) {
    console.error('Error al crear incidencia:', error);
    res.status(500).json({ message: 'Error al registrar la incidencia' });
  }
};

// FormData manda todo como string y convierte '' y 'null' en un null de verdad
const nullify = (v) => (v === '' || v === 'null' || v === undefined ? null : v);

const editarIncidencia = async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.user?.username || null;

    const datos = {
      titulo:           req.body.titulo,
      descripcion:      req.body.descripcion,
      categoria:        req.body.categoria,
      urgencia:         req.body.urgencia,
      impacto:          req.body.impacto,
      asignado_a:       nullify(req.body.asignado_a),
      solucion:         nullify(req.body.solucion),
      categoria_cierre: nullify(req.body.categoria_cierre),
      cliente_id:       nullify(req.body.cliente_id),
      vehiculo_id:      nullify(req.body.vehiculo_id),
      realizado_por:    username,
    };

    const archivos = (req.files || []).map((f) => ({
      ruta: `/uploads/incidencias/${f.filename}`,
    }));

    await Incidencia.actualizar(id, datos, archivos);
    res.json({ message: 'Incidencia actualizada' });
  } catch (error) {
    console.error('Error al editar incidencia:', error);
    res.status(500).json({ message: 'Error al actualizar la incidencia' });
  }
};

const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, descripcion } = req.body;
    const username = req.user?.username || null;

    const estadosValidos = ['abierta', 'en_proceso', 'escalada', 'resuelta', 'cerrada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ message: 'Estado no válido' });
    }

    await Incidencia.cambiarEstado(id, estado, username, descripcion);
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    if (error.message === 'Incidencia no encontrada') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al cambiar el estado' });
  }
};

const asignarIncidencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { asignado_a } = req.body;
    const username = req.user?.username || null;

    if (!asignado_a) return res.status(400).json({ message: 'El campo asignado_a es requerido' });

    await Incidencia.asignar(id, asignado_a, username);
    res.json({ message: 'Incidencia asignada' });
  } catch (error) {
    console.error('Error al asignar incidencia:', error);
    res.status(500).json({ message: 'Error al asignar la incidencia' });
  }
};

const agregarNota = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion } = req.body;
    const username = req.user?.username || null;

    if (!descripcion?.trim()) {
      return res.status(400).json({ message: 'La descripción de la nota es requerida' });
    }

    await Incidencia.agregarNota(id, descripcion, username);
    res.status(201).json({ message: 'Nota agregada' });
  } catch (error) {
    console.error('Error al agregar nota:', error);
    res.status(500).json({ message: 'Error al agregar la nota' });
  }
};

const eliminarIncidencia = async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.user?.username || null;

    await Incidencia.desactivar(id, username);
    res.json({ message: 'Incidencia eliminada' });
  } catch (error) {
    console.error('Error al eliminar incidencia:', error);
    res.status(500).json({ message: 'Error al eliminar la incidencia' });
  }
};

module.exports = {
  listarIncidencias,
  obtenerIncidencia,
  crearIncidencia,
  editarIncidencia,
  cambiarEstado,
  asignarIncidencia,
  agregarNota,
  eliminarIncidencia,
};
