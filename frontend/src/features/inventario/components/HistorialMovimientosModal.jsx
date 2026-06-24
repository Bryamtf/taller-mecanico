import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal/Modal';
import { getMovimientos } from '../services/inventarioService';

const TIPO_CONFIG = {
  entrada: { label: 'Entrada', cls: 'bg-green-100 text-green-700' },
  salida:  { label: 'Salida',  cls: 'bg-red-100 text-red-700'   },
  ajuste:  { label: 'Ajuste',  cls: 'bg-blue-100 text-blue-700' },
};

const FILTROS = [
  { value: '',        label: 'Todos'   },
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida',  label: 'Salida'  },
  { value: 'ajuste',  label: 'Ajuste'  },
];

const formatFecha = (fecha) => {
  const d = new Date(fecha);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
};

export default function HistorialMovimientosModal({ open, onClose, articulo }) {
  const [movimientos, setMovimientos]   = useState([]);
  const [total, setTotal]               = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina]             = useState(1);
  const [filtroTipo, setFiltroTipo]     = useState('');
  const [loading, setLoading]           = useState(false);

  const fetchMovimientos = useCallback(async () => {
    if (!articulo?.articulo_id) return;
    setLoading(true);
    try {
      const params = { pagina, limite: 15 };
      if (filtroTipo) params.tipo = filtroTipo;
      const data = await getMovimientos(articulo.articulo_id, params);
      setMovimientos(data.movimientos);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
    } finally {
      setLoading(false);
    }
  }, [articulo?.articulo_id, pagina, filtroTipo]);

  useEffect(() => {
    if (open) fetchMovimientos();
  }, [open, fetchMovimientos]);

  const handleClose = () => {
    setPagina(1);
    setFiltroTipo('');
    setMovimientos([]);
    onClose();
  };

  const handleFiltro = (v) => { setFiltroTipo(v); setPagina(1); };

  return (
    <Modal open={open} onClose={handleClose} title={`Historial de movimientos — ${articulo?.nombre ?? ''}`} size="xl">
      <div className="p-6 space-y-4">

        {/* Filtro por tipo */}
        <div className="flex flex-wrap gap-2">
          {FILTROS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleFiltro(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtroTipo === f.value
                  ? 'bg-[#e5ba4a] text-white'
                  : 'border border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
          {total > 0 && (
            <span className="ml-auto text-xs text-[#bababa] self-center">{total} registro{total !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Tabla */}
        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Marca</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Cantidad</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-center">Stock</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Motivo</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">Cargando...</td>
                  </tr>
                )}
                {!loading && !movimientos.length && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">
                      Sin movimientos registrados
                    </td>
                  </tr>
                )}
                {!loading && movimientos.map(m => {
                  const cfg = TIPO_CONFIG[m.tipo_movimiento] ?? { label: m.tipo_movimiento, cls: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={m.movimiento_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{formatFecha(m.fecha)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {m.marca_nombre ?? <span className="text-[#bababa]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${
                          m.tipo_movimiento === 'entrada' ? 'text-green-600' :
                          m.tipo_movimiento === 'salida'  ? 'text-red-500'   : 'text-blue-600'
                        }`}>
                          {m.tipo_movimiento === 'entrada' ? '+' : m.tipo_movimiento === 'salida' ? '−' : ''}
                          {m.cantidad}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">
                        <span>{m.stock_anterior}</span>
                        <span className="mx-1 text-gray-300">→</span>
                        <span className="font-medium text-gray-700">{m.stock_resultante}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">
                        {m.motivo || <span className="text-[#bababa]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {m.registrado_por || <span className="text-[#bababa]">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Página {pagina} de {totalPaginas}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}
