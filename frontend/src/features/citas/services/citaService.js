import api from '@/lib/axios';

export const getCitas = (params) =>
  api.get('/citas', { params }).then((r) => r.data);

export const getCita = (id) =>
  api.get(`/citas/${id}`).then((r) => r.data);

export const createCita = (data) =>
  api.post('/citas', data).then((r) => r.data);

export const updateCita = (id, data) =>
  api.put(`/citas/${id}`, data).then((r) => r.data);

export const cambiarEstadoCita = (id, estado) =>
  api.patch(`/citas/${id}/estado`, { estado }).then((r) => r.data);

export const deleteCita = (id) =>
  api.delete(`/citas/${id}`).then((r) => r.data);

export const getClientes = () =>
  api.get('/clientes', { params: { limite: 1000 } }).then((r) => r.data.clientes ?? []);

export const getVehiculosPorCliente = (clienteId) =>
  api.get(`/vehiculos/${clienteId}/vehiculos`).then((r) => r.data ?? []);

export const getUsuariosActivos = () =>
  api.get('/usuarios').then((r) => {
    const lista = r.data?.data?.usuarios ?? [];
    return lista.filter((u) => u.activo !== 0);
  });
