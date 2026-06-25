import api from '@/lib/axios';

export const getRoles = (params) =>
  api.get('/roles', { params }).then((res) => res.data.data);

export const createRol = (data) =>
  api.post('/roles', data).then((res) => res.data);

export const updateRol = (rolId, data) =>
  api.put(`/roles/${rolId}`, data).then((res) => res.data);

export const deleteRol = (rolId) =>
  api.delete(`/roles/${rolId}`).then((res) => res.data);

export const cambiarEstadoRol = (rolId, activo) =>
  api.patch(`/roles/${rolId}/estado`, { activo }).then((res) => res.data);
