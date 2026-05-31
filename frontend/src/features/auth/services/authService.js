import api from '@/lib/axios';

export const login = (credentials) =>
  api.post('/auth/login', credentials).then((res) => res.data.data);
