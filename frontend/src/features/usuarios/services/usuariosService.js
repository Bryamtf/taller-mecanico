import api from '@/lib/axios';

export const getUsuarios = (params) =>
  api.get('/usuarios', { params }).then((res) => res.data.data);

export const createUsuario = (data) =>
  api.post('/usuarios', data).then((res) => res.data);

export const updateUsuario = (username, data) =>
  api.put(`/usuarios/${username}`, data).then((res) => res.data);

export const deleteUsuario = (username) =>
  api.delete(`/usuarios/${username}`).then((res) => res.data);

export const cambiarEstadoUsuario = (username, activo) =>
  api.patch(`/usuarios/${username}/estado`, { activo }).then((res) => res.data);

export const resetPasswordUsuario = (username, password_nueva) =>
  api.patch(`/usuarios/${username}/reset-password`, { password_nueva }).then((res) => res.data);
