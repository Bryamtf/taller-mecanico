import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import { getHistorialPrecios } from '../services/inventarioService';

const fmt = (v) => v != null ? `S/ ${Number(v).toFixed(2)}` : null;

const CambioPrecios = ({ anterior, nuevo, label }) => {
  if (anterior == null && nuevo == null) return null;
  const subio = Number(nuevo) > Number(anterior);
  const igual = Number(nuevo) === Number(anterior);
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-gray-400">{label}:</span>
      <span className="text-gray-600">{fmt(anterior)}</span>
      <span className="text-gray-300">→</span>
      <span className={`font-semibold ${subio ? 'text-red-500' : igual ? 'text-gray-500' : 'text-green-600'}`}>
        {fmt(nuevo)}
      </span>
      {!igual && (subio
        ? <TrendingUp size={11} className="text-red-500" />
        : <TrendingDown size={11} className="text-green-600" />)}
    </div>
  );
};

export default function HistorialPreciosModal({ open, onClose, articulo }) {
  const [registros, setRegistros]     = useState([]);
  const [total, setTotal]             = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina]           = useState(1);
  const [loading, setLoading]         = useState(false);

  const fetchHistorial = useCallback(async () => {
    if (!articulo?.articulo_id) return;
    setLoading(true);
    try {
      const data = await getHistorialPrecios(articulo.articulo_id, { pagina, limite: 15 });
      setRegistros(data.registros || []);
      setTotal(data.total || 0);
      setTotalPaginas(data.totalPaginas || 1);
    } finally {
      setLoading(false);
    }
  }, [articulo?.articulo_id, pagina]);

  useEffect(() => {
    if (open) fetchHistorial();
  }, [open, fetchHistorial]);

  useEffect(() => {
    if (!open) { setPagina(1); setRegistros([]); setTotal(0); }
  }, [open]);

  const formatFecha = (f) => {
    if (!f) return '—';
    return new Date(f).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal open={open} onClose={onClose} title={`Historial de precios — ${articulo?.nombre || ''}`} size="lg">
      <div className="space-y-4">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-[#e5ba4a] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && registros.length === 0 && (
          <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
            <Minus size={32} className="text-gray-300" />
            <p className="text-sm">Sin cambios de precio registrados</p>
            <p className="text-xs text-gray-300">Los cambios se registran al editar el precio de una marca</p>
          </div>
        )}

        {!loading && registros.length > 0 && (
          <>
            <p className="text-xs text-gray-400">{total} cambio{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>

            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">Fecha</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">Marca</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">Cambios</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => (
                    <tr key={r.historial_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatFecha(r.fecha)}</td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-700">{r.marca_nombre || '—'}</td>
                      <td className="px-4 py-3 space-y-1">
                        <CambioPrecios anterior={r.precio_venta_anterior} nuevo={r.precio_venta_nuevo} label="Venta" />
                        <CambioPrecios anterior={r.precio_costo_anterior} nuevo={r.precio_costo_nuevo} label="Costo" />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{r.registrado_por || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-xs text-gray-400">Página {pagina} de {totalPaginas}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    <ChevronLeft size={15} />
                  </button>
                  <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
