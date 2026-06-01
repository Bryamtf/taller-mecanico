import api from '@/lib/axios';

export const consultarPlaca = (placa) =>
  api.post('/consulta-placa', { placa }).then((r) => r.data);
