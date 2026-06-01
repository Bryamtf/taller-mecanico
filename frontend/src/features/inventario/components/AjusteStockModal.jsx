import { useState } from 'react';
import Modal from '@/components/Modal/Modal';
import { ajustarStock } from '../services/inventarioService';
import { swalError } from '@/lib/swal';

const TIPOS = [
  { value: 'entrada', label: 'Entrada',       color: 'text-green-600', desc: 'Suma unidades al stock actual' },
  { value: 'salida',  label: 'Salida',         color: 'text-red-500',   desc: 'Resta unidades del stock actual' },
  { value: 'ajuste',  label: 'Ajuste manual',  color: 'text-blue-500',  desc: 'Establece el stock a un valor exacto' },
];

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#e5ba4a] transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

export default function AjusteStockModal({ open, onClose, onSaved, articuloId, marca }) {
  const [tipo, setTipo]       = useState('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo]   = useState('');
  const [saving, setSaving]   = useState(false);

  const tipoInfo = TIPOS.find(t => t.value === tipo);

  const handleClose = () => { setTipo('entrada'); setCantidad(''); setMotivo(''); onClose(); };

  const calcularPreview = () => {
    const cant = parseInt(cantidad, 10);
    if (!cant || cant <= 0 || !marca) return null;
    const actual = marca.stock_actual ?? 0;
    if (tipo === 'entrada') return actual + cant;
    if (tipo === 'salida')  return Math.max(0, actual - cant);
    return cant;
  };

  const preview = calcularPreview();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cant = parseInt(cantidad, 10);
    if (!cant || cant <= 0) return swalError('Cantidad inválida', 'Ingresa una cantidad mayor a 0.');

    setSaving(true);
    try {
      await ajustarStock(articuloId, marca.marca_id, { tipo_movimiento: tipo, cantidad: cant, motivo });
      handleClose();
      onSaved();
    } catch (err) {
      swalError('Error', err.response?.data?.message || 'No se pudo ajustar el stock.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Ajustar stock" size="sm">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">

        {/* Info de la marca */}
        {marca && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
            <p className="font-medium text-gray-800">{marca.marca_nombre}</p>
            <p className="text-[#bababa]">Stock actual: <span className="font-semibold text-gray-700">{marca.stock_actual ?? 0}</span> unidades</p>
          </div>
        )}

        {/* Tipo de movimiento */}
        <div>
          <label className={labelClass}>Tipo de movimiento</label>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTipo(t.value)}
                className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${
                  tipo === t.value
                    ? 'border-[#e5ba4a] bg-amber-50 text-[#e5ba4a]'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">{tipoInfo?.desc}</p>
        </div>

        {/* Cantidad */}
        <div>
          <label className={labelClass}>
            {tipo === 'ajuste' ? 'Nuevo stock' : 'Cantidad'}
          </label>
          <input
            type="number"
            min="1"
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            placeholder="0"
            className={inputClass}
            required
          />
        </div>

        {/* Preview */}
        {preview !== null && (
          <div className={`text-sm text-center font-medium py-2 rounded-lg ${preview < (marca?.stock_actual ?? 0) ? 'bg-red-50 text-red-600' : preview > (marca?.stock_actual ?? 0) ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
            Stock resultante: {preview} unidades
          </div>
        )}

        {/* Motivo */}
        <div>
          <label className={labelClass}>Motivo (opcional)</label>
          <input
            type="text"
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ej: compra a proveedor, corrección de inventario..."
            className={inputClass}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={handleClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-[#e5ba4a] text-white font-medium hover:bg-[#d4a93a] disabled:opacity-60 transition-colors">
            {saving ? 'Guardando...' : 'Confirmar ajuste'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
