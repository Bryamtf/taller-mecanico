import api from '@/lib/axios';

export const getProveedores   = (params) => api.get('/proveedores', { params }).then(r => r.data);
export const getProveedor     = (id)     => api.get(`/proveedores/${id}`).then(r => r.data);
export const createProveedor  = (data)   => api.post('/proveedores', data).then(r => r.data);
export const updateProveedor  = (id, data) => api.put(`/proveedores/${id}`, data).then(r => r.data);
export const cambiarEstado    = (id, activo) => api.patch(`/proveedores/${id}/estado`, { activo }).then(r => r.data);
