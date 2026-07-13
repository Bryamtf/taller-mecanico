import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import * as svc from '../services/dashboardService';

const RESUMEN_INICIAL = {
  ventas: null,
  inventario: null,
  incidencias: { abiertas: 0, en_proceso: 0, criticas: 0 },
  citas: null,
};

export function useDashboardData() {
  const { can } = useAuth();
  const [data, setData] = useState(RESUMEN_INICIAL);
  const [loading, setLoading] = useState(true);

  const puedeVentas = can('ver_ventas');
  const puedeInventario = can('ver_inventario');
  const puedeCitas = can('ver_citas');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const tareas = [
      { key: 'incidencias', fn: svc.getIncidenciasResumen },
    ];
    if (puedeVentas) tareas.push({ key: 'ventas', fn: svc.getVentasResumen });
    if (puedeInventario) tareas.push({ key: 'inventario', fn: svc.getInventarioResumen });
    if (puedeCitas) tareas.push({ key: 'citas', fn: svc.getCitasResumen });

    const resultados = await Promise.allSettled(tareas.map((t) => t.fn()));

    setData((actual) => {
      const siguiente = { ...actual };
      resultados.forEach((res, i) => {
        if (res.status === 'fulfilled') siguiente[tareas[i].key] = res.value;
      });
      return siguiente;
    });
    setLoading(false);
  }, [puedeVentas, puedeInventario, puedeCitas]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return {
    ventas: data.ventas,
    inventario: data.inventario,
    incidencias: data.incidencias,
    citas: data.citas,
    puedeVentas,
    puedeInventario,
    puedeCitas,
    loading,
    refetch: fetchAll,
  };
}
