import api from '@/lib/axios';

export const getVentasResumen = () =>
  api.get('/ventas/resumen').then((r) => r.data);

export const getInventarioResumen = () =>
  api.get('/inventario', { params: { limite: 1 } }).then((r) => r.data.resumen);

export const getIncidenciasResumen = () =>
  api.get('/incidencias').then((r) => r.data.resumen);

export const getCitasResumen = () =>
  api.get('/citas').then((r) => r.data.resumen);
