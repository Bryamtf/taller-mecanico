import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import * as svc from '../services/incidenciaService';

export function useIncidencias() {
  const [incidencias, setIncidencias]   = useState([]);
  const [resumen, setResumen]           = useState({ abiertas: 0, en_proceso: 0, criticas: 0 });
  const [total, setTotal]               = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina]             = useState(1);
  const [busqueda, setBusqueda]         = useState('');
  const [filtroEstado, setFiltroEstado]       = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [loading, setLoading]           = useState(false);

  const busquedaDebounced = useDebounce(busqueda, 400);

  const fetchIncidencias = useCallback(async () => {
    setLoading(true);
    try {
      const params = { pagina, busqueda: busquedaDebounced };
      if (filtroEstado)     params.estado     = filtroEstado;
      if (filtroPrioridad)  params.prioridad  = filtroPrioridad;
      if (filtroCategoria)  params.categoria  = filtroCategoria;

      const data = await svc.getIncidencias(params);
      setIncidencias(data.datos);
      setResumen(data.resumen);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
    } finally {
      setLoading(false);
    }
  }, [pagina, busquedaDebounced, filtroEstado, filtroPrioridad, filtroCategoria]);

  useEffect(() => { fetchIncidencias(); }, [fetchIncidencias]);

  const handleBusqueda  = (v) => { setBusqueda(v);       setPagina(1); };
  const handleEstado    = (v) => { setFiltroEstado(v);   setPagina(1); };
  const handlePrioridad = (v) => { setFiltroPrioridad(v); setPagina(1); };
  const handleCategoria = (v) => { setFiltroCategoria(v); setPagina(1); };

  const crear     = async (formData) => { await svc.createIncidencia(formData);  await fetchIncidencias(); };
  const actualizar = async (id, data) => { await svc.updateIncidencia(id, data); await fetchIncidencias(); };
  const eliminar   = async (id)       => { await svc.deleteIncidencia(id);       await fetchIncidencias(); };

  return {
    incidencias, resumen, total, totalPaginas, pagina, setPagina,
    busqueda, handleBusqueda,
    filtroEstado, handleEstado,
    filtroPrioridad, handlePrioridad,
    filtroCategoria, handleCategoria,
    loading, fetchIncidencias, crear, actualizar, eliminar,
  };
}
