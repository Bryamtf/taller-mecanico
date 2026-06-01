import api from '@/lib/axios';

export const getClientes = (params) =>
  api.get('/clientes', { params }).then((r) => r.data);

export const getCliente = (id) =>
  api.get(`/clientes/${id}`).then((r) => r.data);

export const createCliente = (data) =>
  api.post('/clientes', data).then((r) => r.data);

export const updateCliente = (id, data) =>
  api.put(`/clientes/${id}`, data).then((r) => r.data);

export const cambiarEstado = (id, activo) =>
  api.patch(`/clientes/${id}/estado`, { activo }).then((r) => r.data);
