import api from '@/lib/axios';

export const consultarPlaca = (placa) =>
  api.post('/consulta-placa', { placa }).then((r) => r.data);

export const createVehiculo = (data) =>
  api.post('/vehiculos', data).then((r) => r.data);
