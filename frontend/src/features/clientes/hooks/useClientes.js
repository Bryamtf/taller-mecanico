import { useState, useEffect, useCallback } from 'react';
import * as clienteService from '../services/clienteService';
import { useDebounce } from '@/hooks/useDebounce';

export function useClientes() {
  const [clientes, setClientes]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina]           = useState(1);
  const [busqueda, setBusqueda]       = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [loading, setLoading]         = useState(false);

  const busquedaDebounced = useDebounce(busqueda, 400);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { pagina, limite: 10, busqueda: busquedaDebounced };
      if (filtroActivo !== '') params.activo = filtroActivo;
      const data = await clienteService.getClientes(params);
      setClientes(data.clientes);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
    } finally {
      setLoading(false);
    }
  }, [pagina, busquedaDebounced, filtroActivo]);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const handleBusqueda = (value) => { setBusqueda(value); setPagina(1); };
  const handleFiltro   = (value) => { setFiltroActivo(value); setPagina(1); };

  const crear = async (data) => {
    await clienteService.createCliente(data);
    await fetchClientes();
  };

  const actualizar = async (id, data) => {
    await clienteService.updateCliente(id, data);
    await fetchClientes();
  };

  const toggleEstado = async (id, activoActual) => {
    await clienteService.cambiarEstado(id, activoActual === 1 ? 0 : 1);
    await fetchClientes();
  };

  return {
    clientes, total, totalPaginas, pagina, setPagina,
    busqueda, handleBusqueda,
    filtroActivo, handleFiltro,
    loading, fetchClientes,
    crear, actualizar, toggleEstado,
  };
}
