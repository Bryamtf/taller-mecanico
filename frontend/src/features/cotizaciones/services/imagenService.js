import api from "@/lib/axios";

const imagenService = {
  // Obtener imágenes de una cotización
  async listar(cotizacionId) {
    const response = await api.get(`/cotizaciones/${cotizacionId}/imagenes`);
    return response.data;
  },

  // Agregar nueva imagen
  async agregar(cotizacionId, formData) {
    const response = await api.post(
      `/cotizaciones/${cotizacionId}/imagenes`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  // Eliminar imagen
  async eliminar(imagenId) {
    const response = await api.delete(`/imagenes/${imagenId}`);
    return response.data;
  },
};

export default imagenService;
