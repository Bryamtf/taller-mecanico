// services/cotizacionService.js
import api from '@/lib/axios';

const cotizacionService = {
  // Obtener todas las cotizaciones
  async listar() {
    const response = await api.get("/cotizaciones");
    return response.data;
  },

  // Obtener una cotización por ID
  async obtenerPorId(id) {
    const response = await api.get(`/cotizaciones/${id}`);
    return response.data;
  },

  // Crear nueva cotización (con imágenes)
  async crear(formData) {
    const response = await api.post("/cotizaciones", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Actualizar cotización
  async actualizar(id, data) {
    const response = await api.put(`/cotizaciones/${id}`, data);
    return response.data;
  },

  // Cambiar estado
  async cambiarEstado(id, estado) {
    const response = await api.patch(`/cotizaciones/${id}/estado`, { estado });
    return response.data;
  },

  // Eliminar cotización
  async eliminar(id) {
    const response = await api.delete(`/cotizaciones/${id}`);
    return response.data;
  },

  // Descargar PDF
  async descargarPDF(id) {
    const response = await api.get(`/cotizaciones/${id}/pdf`, {
      responseType: "blob",
    });
    return response;
  },

  // Compartir por WhatsApp
  async compartirWhatsApp(id, telefono) {
    const response = await api.post(`/cotizaciones/${id}/compartir/whatsapp`, {
      telefono,
    });
    return response.data;
  },

  // Compartir por Email
  async compartirEmail(id, email) {
    const response = await api.post(`/cotizaciones/${id}/compartir/email`, {
      email,
    });
    return response.data;
  },
};

export default cotizacionService;
