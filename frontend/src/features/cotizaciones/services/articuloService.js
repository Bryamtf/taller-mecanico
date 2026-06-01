import api from '@/lib/axios';

const articuloService = {
    async listar() {
        const response = await api.get("/inventario/articulos");
        return response.data;
    },

    async buscar(termino) {
        const response = await api.get(`/inventario/articulos/buscar?q=${termino}`);
        return response.data;
    },

    async obtenerPorId(id) {
        const response = await api.get(`/inventario/articulos/${id}`);
        return response.data;
    }
};

export default articuloService;