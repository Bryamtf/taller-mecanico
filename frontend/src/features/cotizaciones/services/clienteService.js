import api from "@/lib/axios";

const clienteService = {
  // Obtener todos los clientes
  async listar() {
    const response = await api.get("/clientes");
    console.log(response.data);
    return response.data;
  },

  // Obtener vehículos de un cliente
  async obtenerVehiculosPorCliente(clienteId) {
    const response = await api.get(`/vehiculos/${clienteId}/vehiculos`);
    console.log(response.data);
    return response.data;
  },
};

export default clienteService;
