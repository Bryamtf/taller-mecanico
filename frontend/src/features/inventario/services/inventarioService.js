import api from '@/lib/axios';

export const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
export const getImageUrl = (ruta) => `${BASE_URL}${ruta}`;

// Inventario
export const getInventario  = (params) => api.get('/inventario', { params }).then(r => r.data);
export const getArticulo    = (id)     => api.get(`/inventario/articulos/${id}`).then(r => r.data);
export const deleteArticulo = (id)     => api.delete(`/articulos/${id}`).then(r => r.data);
export const reactivarArticulo = (id)  => api.patch(`/articulos/${id}/reactivar`).then(r => r.data);

export const createArticulo = (formData) =>
  api.post('/articulos', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);

export const updateArticulo = (id, formData) =>
  api.put(`/articulos/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);

// Catálogo de marcas
export const getMarcas           = ()           => api.get('/marcas').then(r => r.data);
export const createMarcaCatalog  = (data)       => api.post('/marcas', data).then(r => r.data);
export const updateMarcaCatalog  = (id, data)   => api.put(`/marcas/${id}`, data).then(r => r.data);
export const deleteMarcaCatalog  = (id)         => api.delete(`/marcas/${id}`).then(r => r.data);

// Marcas por artículo
export const agregarMarca  = (artId, data)            => api.post(`/articulos/${artId}/marcas`, data).then(r => r.data);
export const updateMarca   = (artId, marcaId, data)   => api.put(`/articulos/${artId}/marcas/${marcaId}`, data).then(r => r.data);
export const deleteMarca   = (artId, marcaId)         => api.delete(`/articulos/${artId}/marcas/${marcaId}`).then(r => r.data);
export const ajustarStock  = (artId, marcaId, data)   => api.post(`/articulos/${artId}/marcas/${marcaId}/ajuste`, data).then(r => r.data);
