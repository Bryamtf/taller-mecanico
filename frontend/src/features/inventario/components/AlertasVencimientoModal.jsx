import { useState, useEffect } from 'react';
import { CalendarX } from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import { getLotesPorVencer } from '../services/inventarioService';

const FILTROS = [
  { label: 'Vencidos',     dias: 0 },
  { label: '7 días',       dias: 7 },
  { label: '30 días',      dias: 30 },
  { label: '90 días',      dias: 90 },
];

const fmtFecha = (f) => f ? new Date(f + 'T00:00:00').toLocaleDateString('es-PE') : '—';

const badgeVencimiento = (fecha) => {
  const dias = Math.ceil((new Date(fecha) - new Date()) / 86400000);
  if (dias < 0)   return { label: 'Vencido',          cls: 'bg-red-100 text-red-700' };
  if (dias === 0) return { label: 'Vence hoy',        cls: 'bg-red-100 text-red-700' };
  if (dias <= 7)  return { label: `${dias} día${dias !== 1 ? 's' : ''}`, cls: 'bg-red-100 text-red-600' };
  if (dias <= 30) return { label: `${dias} días`,     cls: 'bg-orange-100 text-orange-600' };
  return              { label: `${dias} días`,         cls: 'bg-yellow-100 text-yellow-700' };
};

export default function AlertasVencimientoModal({ open, onClose }) {
  const [lotes, setLotes]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [diasFiltro, setDiasFiltro] = useState(30);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getLotesPorVencer(diasFiltro)
      .then(r => setLotes(r.data || []))
      .catch(() => setLotes([]))
      .finally(() => setLoading(false));
  }, [open, diasFiltro]);

  useEffect(() => { if (!open) setLotes([]); }, [open]);

  const vencidos  = lotes.filter(l => new Date(l.fecha_vencimiento) < new Date());
  const porVencer = lotes.filter(l => new Date(l.fecha_vencimiento) >= new Date());

  const Grupo = ({ titulo, items, clsTitulo }) => items.length === 0 ? null : (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${clsTitulo}`}>{titulo} ({items.length})</p>
      <div className="overflow-x-auto rounded-lg border border-gray-100 mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left">
              <th className="px-3 py-2 text-xs font-semibold text-gray-500">Artículo</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500">Marca</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500">N° Lote</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500 text-center">Cantidad</th>
              <th className="px-3 py-2 text-xs font-semibold text-gray-500">Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            {items.map(l => {
              const badge = badgeVencimiento(l.fecha_vencimiento);
              return (
                <tr key={l.lote_id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2.5">
                    <p className="text-xs font-medium text-gray-800">{l.articulo_nombre}</p>
                    {l.codigo_interno && <p className="text-xs text-gray-400">{l.codigo_interno}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-600">{l.marca_nombre}</td>
                  <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{l.numero_lote || '—'}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-xs font-semibold text-gray-700">{l.cantidad_actual}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtFecha(l.fecha_vencimiento)}</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Alertas de vencimiento" size="xl">
      <div className="space-y-4 px-6 py-4">
        {/* Chips de filtro */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">Mostrar:</span>
          {FILTROS.map(f => (
            <button key={f.dias} onClick={() => setDiasFiltro(f.dias)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                diasFiltro === f.dias
                  ? 'bg-[#e5ba4a] border-[#e5ba4a] text-white'
                  : 'border-gray-200 text-gray-500 hover:border-[#e5ba4a] hover:text-[#e5ba4a]'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-[#e5ba4a] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && lotes.length === 0 && (
          <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
            <CalendarX size={32} className="text-gray-300" />
            <p className="text-sm">No hay lotes por vencer en este período</p>
          </div>
        )}

        {!loading && lotes.length > 0 && (
          <>
            <Grupo titulo="Ya vencidos"   items={vencidos}  clsTitulo="text-red-500" />
            <Grupo titulo="Por vencer"    items={porVencer} clsTitulo="text-orange-500" />
          </>
        )}
      </div>
    </Modal>
  );
}
