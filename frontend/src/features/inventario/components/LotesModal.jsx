import { useState, useEffect, useCallback } from 'react';
import { Plus, PackageOpen, Pencil, X, Check } from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import { swalConfirm, swalSuccess, swalError } from '@/lib/swal';
import { getLotes, createLote, updateLote, deleteLote, getArticulo } from '../services/inventarioService';
import { onKeyDown, sanitizar } from '@/utils/inputSanitizer';

const hoy = () => new Date().toISOString().slice(0, 10);

const estadoVencimiento = (fecha) => {
  if (!fecha) return null;
  const dias = Math.ceil((new Date(fecha) - new Date()) / 86400000);
  if (dias < 0)   return { label: 'Vencido',       cls: 'bg-red-100 text-red-700' };
  if (dias <= 7)  return { label: `Vence en ${dias}d`, cls: 'bg-red-100 text-red-700' };
  if (dias <= 30) return { label: `Vence en ${dias}d`, cls: 'bg-orange-100 text-orange-600' };
  if (dias <= 90) return { label: `Vence en ${Math.round(dias/30)}m`, cls: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Vigente', cls: 'bg-green-100 text-green-700' };
};

const fmtFecha = (f) => f ? new Date(f + 'T00:00:00').toLocaleDateString('es-PE') : '—';

const FORM_INICIAL = { marca_id: '', numero_lote: '', cantidad: '', fecha_vencimiento: '', fecha_ingreso: hoy(), observaciones: '' };

export default function LotesModal({ open, onClose, articulo }) {
  const [lotes, setLotes]       = useState([]);
  const [marcas, setMarcas]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm]         = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [editCantidad, setEditCantidad] = useState('');

  const cargar = useCallback(async () => {
    if (!articulo?.articulo_id) return;
    setLoading(true);
    try {
      const [lotesData, artData] = await Promise.all([
        getLotes(articulo.articulo_id),
        getArticulo(articulo.articulo_id),
      ]);
      setLotes(lotesData.data || []);
      setMarcas(artData.data?.marcas || []);
    } finally {
      setLoading(false);
    }
  }, [articulo?.articulo_id]);

  useEffect(() => { if (open) cargar(); }, [open, cargar]);
  useEffect(() => { if (!open) { setLotes([]); setMarcas([]); setMostrarForm(false); setForm(FORM_INICIAL); setEditando(null); } }, [open]);

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!form.marca_id) return swalError('Campo requerido', 'Selecciona una marca.');
    if (!form.cantidad || parseInt(form.cantidad) <= 0) return swalError('Campo requerido', 'La cantidad debe ser mayor a 0.');

    setGuardando(true);
    try {
      await createLote(articulo.articulo_id, {
        marca_id: form.marca_id,
        numero_lote: form.numero_lote || null,
        cantidad: parseInt(form.cantidad),
        fecha_vencimiento: form.fecha_vencimiento || null,
        fecha_ingreso: form.fecha_ingreso || hoy(),
        observaciones: form.observaciones || null,
      });
      swalSuccess('Lote registrado', 'El stock fue actualizado automáticamente.');
      setForm(FORM_INICIAL);
      setMostrarForm(false);
      await cargar();
    } catch (err) {
      swalError('Error', err?.response?.data?.message || 'No se pudo registrar el lote.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditarCantidad = async (lote) => {
    const ok = await updateLote(articulo.articulo_id, lote.lote_id, {
      cantidad_actual: parseInt(editCantidad),
      observaciones: lote.observaciones,
    });
    if (ok) { swalSuccess('Actualizado', 'Cantidad del lote actualizada.'); await cargar(); }
    else swalError('Error', 'No se pudo actualizar el lote.');
    setEditando(null);
  };

  const handleDesactivar = async (lote) => {
    const res = await swalConfirm('¿Dar de baja el lote?', `Lote ${lote.numero_lote || lote.lote_id} · ${lote.marca_nombre}`);
    if (!res.isConfirmed) return;
    try {
      await deleteLote(articulo.articulo_id, lote.lote_id);
      swalSuccess('Lote dado de baja', '');
      await cargar();
    } catch {
      swalError('Error', 'No se pudo dar de baja el lote.');
    }
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e5ba4a] focus:border-transparent';

  return (
    <Modal open={open} onClose={onClose} title={`Lotes — ${articulo?.nombre || ''}`} size="xl">
      <div className="space-y-4 px-6 py-4">
        {/* Botón nuevo lote */}
        {!mostrarForm && (
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-2 bg-[#e5ba4a] hover:bg-[#d4a93a] text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} /> Registrar nuevo lote
          </button>
        )}

        {/* Formulario nuevo lote */}
        {mostrarForm && (
          <form onSubmit={handleCrear} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Nuevo lote</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Marca *</label>
                <select value={form.marca_id} onChange={e => setForm(p => ({ ...p, marca_id: e.target.value }))} className={inputCls} required>
                  <option value="">Seleccionar marca</option>
                  {marcas.map(m => <option key={m.marca_id} value={m.marca_id}>{m.marca_nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">N° de lote (opcional)</label>
                <input value={form.numero_lote} onChange={e => setForm(p => ({ ...p, numero_lote: sanitizar.texto(e.target.value) }))}
                  className={inputCls} placeholder="Ej: LOT-2024-001" />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Cantidad *</label>
                <input type="text" inputMode="numeric" value={form.cantidad}
                  onChange={e => setForm(p => ({ ...p, cantidad: sanitizar.entero(e.target.value) }))}
                  onKeyDown={onKeyDown.soloNumeros}
                  className={inputCls} required />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Fecha de ingreso *</label>
                <input type="date" value={form.fecha_ingreso}
                  onChange={e => setForm(p => ({ ...p, fecha_ingreso: e.target.value }))}
                  className={inputCls} required />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Fecha de vencimiento
                  <span className="ml-1 text-gray-400">(dejar vacío si no vence)</span>
                </label>
                <input type="date" value={form.fecha_vencimiento}
                  onChange={e => setForm(p => ({ ...p, fecha_vencimiento: e.target.value }))}
                  className={inputCls} />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Observaciones</label>
                <input value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: sanitizar.texto(e.target.value) }))}
                  className={inputCls} placeholder="Notas adicionales..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => { setMostrarForm(false); setForm(FORM_INICIAL); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={guardando}
                className="px-4 py-2 text-sm bg-[#e5ba4a] hover:bg-[#d4a93a] text-white rounded-lg transition-colors disabled:opacity-60">
                {guardando ? 'Registrando...' : 'Registrar lote'}
              </button>
            </div>
          </form>
        )}

        {/* Lista de lotes */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-[#e5ba4a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : lotes.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-gray-400 gap-2">
            <PackageOpen size={32} className="text-gray-300" />
            <p className="text-sm">No hay lotes registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">N° Lote</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Marca</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-center">Cant. inicial</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-center">Cant. actual</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Vencimiento</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500">Ingreso</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map(l => {
                  const estado = estadoVencimiento(l.fecha_vencimiento);
                  const enEdicion = editando === l.lote_id;
                  return (
                    <tr key={l.lote_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 text-xs text-gray-600 font-mono">{l.numero_lote || <span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-2.5 text-xs font-medium text-gray-700">{l.marca_nombre}</td>
                      <td className="px-3 py-2.5 text-xs text-center text-gray-500">{l.cantidad_inicial}</td>
                      <td className="px-3 py-2.5 text-center">
                        {enEdicion ? (
                          <div className="flex items-center gap-1 justify-center">
                            <input type="text" inputMode="numeric" value={editCantidad}
                              onChange={e => setEditCantidad(sanitizar.entero(e.target.value))}
                              onKeyDown={onKeyDown.soloNumeros}
                              className="w-16 text-center px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#e5ba4a]" />
                            <button onClick={() => handleEditarCantidad(l)} className="text-green-600 hover:text-green-700"><Check size={13} /></button>
                            <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
                          </div>
                        ) : (
                          <span className={`font-semibold text-xs ${l.cantidad_actual === 0 ? 'text-red-500' : 'text-gray-800'}`}>
                            {l.cantidad_actual}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {estado ? (
                          <div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${estado.cls}`}>{estado.label}</span>
                            <p className="text-xs text-gray-400 mt-0.5">{fmtFecha(l.fecha_vencimiento)}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">Sin vencimiento</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{fmtFecha(l.fecha_ingreso)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditando(l.lote_id); setEditCantidad(String(l.cantidad_actual)); }}
                            title="Editar cantidad" className="p-1.5 rounded text-gray-400 hover:text-[#e5ba4a] hover:bg-amber-50 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDesactivar(l)}
                            title="Dar de baja" className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
