import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import * as svc from '../services/inventarioService';

export function useInventario() {
  const [productos, setProductos]         = useState([]);
  const [resumen, setResumen]             = useState({ totalItems: 0, stockTotal: 0 });
  const [total, setTotal]                 = useState(0);
  const [totalPaginas, setTotalPaginas]   = useState(1);
  const [pagina, setPagina]               = useState(1);
  const [busqueda, setBusqueda]           = useState('');
  const [filtroTipo, setFiltroTipo]       = useState('');
  const [filtroStock, setFiltroStock]     = useState('');
  const [orden, setOrden]                 = useState('nombre_asc');
  const [loading, setLoading]             = useState(false);

  const busquedaDebounced = useDebounce(busqueda, 400);

  const fetchInventario = useCallback(async () => {
    setLoading(true);
    try {
      const params = { pagina, limite: 10, busqueda: busquedaDebounced, orden };
      if (filtroTipo)   params.tipo        = filtroTipo;
      if (filtroStock)  params.filtroStock = filtroStock;
      const data = await svc.getInventario(params);
      setProductos(data.productos);
      setResumen(data.resumen);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
    } finally {
      setLoading(false);
    }
  }, [pagina, busquedaDebounced, filtroTipo, filtroStock, orden]);

  useEffect(() => { fetchInventario(); }, [fetchInventario]);

  const handleBusqueda    = (v) => { setBusqueda(v);    setPagina(1); };
  const handleFiltro      = (v) => { setFiltroTipo(v);  setPagina(1); };
  const handleFiltroStock = (v) => { setFiltroStock(v); setPagina(1); };
  const handleOrden       = (col) => {
    setOrden(prev => {
      const [prevCol, prevDir] = prev.split('_');
      const dir = prevCol === col && prevDir === 'asc' ? 'desc' : 'asc';
      return `${col}_${dir}`;
    });
    setPagina(1);
  };

  const eliminar  = async (id) => { await svc.deleteArticulo(id);    await fetchInventario(); };
  const reactivar = async (id) => { await svc.reactivarArticulo(id); await fetchInventario(); };

  return {
    productos, resumen, total, totalPaginas, pagina, setPagina,
    busqueda, handleBusqueda,
    filtroTipo, handleFiltro,
    filtroStock, handleFiltroStock,
    orden, handleOrden,
    loading, fetchInventario, eliminar, reactivar,
  };
}
