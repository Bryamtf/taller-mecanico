import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import * as svc from '../services/citaService';

export function useCitas() {
  const [citas, setCitas]               = useState([]);
  const [resumen, setResumen]           = useState({ totalCitas: 0, citasPendientes: 0, enProceso: 0 });
  const [total, setTotal]               = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina]             = useState(1);
  const [busqueda, setBusqueda]         = useState('');
  const [filtroEstado, setFiltroEstado]           = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde]   = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta]   = useState('');
  const [loading, setLoading]           = useState(false);

  const busquedaDebounced = useDebounce(busqueda, 400);

  const fetchCitas = useCallback(async () => {
    setLoading(true);
    try {
      const params = { pagina, busqueda: busquedaDebounced };
      if (filtroEstado)      params.estado      = filtroEstado;
      if (filtroFechaDesde)  params.fechaDesde   = filtroFechaDesde;
      if (filtroFechaHasta)  params.fechaHasta   = filtroFechaHasta;

      const data = await svc.getCitas(params);
      setCitas(data.citas);
      setResumen(data.resumen);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
    } finally {
      setLoading(false);
    }
  }, [pagina, busquedaDebounced, filtroEstado, filtroFechaDesde, filtroFechaHasta]);

  useEffect(() => { fetchCitas(); }, [fetchCitas]);

  const handleBusqueda    = (v) => { setBusqueda(v);         setPagina(1); };
  const handleEstado      = (v) => { setFiltroEstado(v);     setPagina(1); };
  const handleFechaDesde  = (v) => { setFiltroFechaDesde(v); setPagina(1); };
  const handleFechaHasta  = (v) => { setFiltroFechaHasta(v); setPagina(1); };

  const crear         = async (data)       => { await svc.createCita(data);          await fetchCitas(); };
  const actualizar     = async (id, data)   => { await svc.updateCita(id, data);      await fetchCitas(); };
  const cambiarEstado  = async (id, estado) => { await svc.cambiarEstadoCita(id, estado); await fetchCitas(); };
  const eliminar        = async (id)         => { await svc.deleteCita(id);            await fetchCitas(); };

  return {
    citas, resumen, total, totalPaginas, pagina, setPagina,
    busqueda, handleBusqueda,
    filtroEstado, handleEstado,
    filtroFechaDesde, handleFechaDesde,
    filtroFechaHasta, handleFechaHasta,
    loading, fetchCitas, crear, actualizar, cambiarEstado, eliminar,
  };
}
