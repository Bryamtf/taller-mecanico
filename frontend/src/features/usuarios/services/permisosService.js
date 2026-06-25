import api from '@/lib/axios';

export const getPermisos = () =>
  api.get('/permisos').then((res) => res.data.data);
