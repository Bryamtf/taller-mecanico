import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import * as svc from '../services/proveedorService';

export function useProveedores() {
  const [proveedores, setProveedores]   = useState([]);
  const [total, setTotal]               = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina]             = useState(1);
  const [busqueda, setBusqueda]         = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [loading, setLoading]           = useState(false);

  const busquedaDebounced = useDebounce(busqueda, 400);

  const fetchProveedores = useCallback(async () => {
    setLoading(true);
    try {
      const params = { pagina, limite: 10, busqueda: busquedaDebounced };
      if (filtroActivo !== '') params.activo = filtroActivo;
      const data = await svc.getProveedores(params);
      setProveedores(data.proveedores);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
    } finally {
      setLoading(false);
    }
  }, [pagina, busquedaDebounced, filtroActivo]);

  useEffect(() => { fetchProveedores(); }, [fetchProveedores]);

  const handleBusqueda = (v) => { setBusqueda(v); setPagina(1); };
  const handleFiltro   = (v) => { setFiltroActivo(v); setPagina(1); };

  const crear = async (data) => {
    await svc.createProveedor(data);
    await fetchProveedores();
  };

  const actualizar = async (id, data) => {
    await svc.updateProveedor(id, data);
    await fetchProveedores();
  };

  const toggleEstado = async (id, activoActual) => {
    await svc.cambiarEstado(id, activoActual ? 0 : 1);
    await fetchProveedores();
  };

  return {
    proveedores, total, totalPaginas, pagina, setPagina,
    busqueda, handleBusqueda,
    filtroActivo, handleFiltro,
    loading, fetchProveedores,
    crear, actualizar, toggleEstado,
  };
}
