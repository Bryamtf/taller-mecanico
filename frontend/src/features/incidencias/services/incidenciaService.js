import api from '@/lib/axios';

export const getIncidencias = (params) =>
  api.get('/incidencias', { params }).then((r) => r.data);

export const getIncidencia = (id) =>
  api.get(`/incidencias/${id}`).then((r) => r.data);

export const createIncidencia = (formData) =>
  api.post('/incidencias', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const updateIncidencia = (id, formData) =>
  api.put(`/incidencias/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const cambiarEstadoSvc = (id, data) =>
  api.patch(`/incidencias/${id}/estado`, data).then((r) => r.data);

export const asignarIncidenciaSvc = (id, data) =>
  api.patch(`/incidencias/${id}/asignar`, data).then((r) => r.data);

export const agregarNotaSvc = (id, data) =>
  api.post(`/incidencias/${id}/notas`, data).then((r) => r.data);

export const deleteIncidencia = (id) =>
  api.delete(`/incidencias/${id}`).then((r) => r.data);

export const getUsuariosActivos = () =>
  api.get('/usuarios').then((r) => {
    const lista = Array.isArray(r.data) ? r.data : r.data.usuarios ?? [];
    return lista.filter((u) => u.activo !== 0);
  });

export const buscarClientePorDni = (dni) =>
  api.get('/clientes', { params: { busqueda: dni, limite: 1 } }).then((r) => {
    const lista = r.data.clientes ?? r.data.datos ?? [];
    return lista[0] ?? null;
  });

export const buscarVehiculoPorPlaca = (placa) =>
  api.get(`/vehiculos/placa/${placa.toUpperCase()}`).then((r) => r.data);
