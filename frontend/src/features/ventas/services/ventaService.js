import api from '@/lib/axios';

const ventaService = {
  async obtenerResumen() {
    const r = await api.get('/ventas/resumen');
    return r.data;
  },
  async listarPendientes(params = {}) {
    const r = await api.get('/ventas/pendientes', { params });
    return r.data;
  },
  async listarHistorial(params = {}) {
    const r = await api.get('/ventas/historial', { params });
    return r.data;
  },
  async obtenerPorId(id) {
    const r = await api.get(`/ventas/${id}`);
    return r.data;
  },
  async generarVenta(data) {
    const r = await api.post('/ventas', data);
    return r.data;
  },
  async anular(id) {
    const r = await api.patch(`/ventas/${id}/anular`);
    return r.data;
  },
};

export default ventaService;
