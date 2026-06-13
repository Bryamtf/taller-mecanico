import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  Clock, User, Tag, Zap, AlertTriangle, MessageSquare,
  UserCheck, RefreshCw, ChevronDown,
} from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import { swalError, swalSuccess } from '@/lib/swal';
import {
  getIncidencia, cambiarEstadoSvc, asignarIncidenciaSvc,
  agregarNotaSvc, getUsuariosActivos,
} from '../services/incidenciaService';
import {
  PRIORIDAD_BADGE, PRIORIDAD_LABEL, ESTADO_BADGE, ESTADO_LABEL,
  CATEGORIA_LABEL, ESTADOS, REGLAS, sanitizar,
} from '../utils/incidenciaValidaciones';

const ACCION = { ESTADO: 'estado', ASIGNAR: 'asignar', NOTA: 'nota' };

const fmtFecha = (f) =>
  f ? new Date(f).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const TIPO_HISTORIAL = {
  nota:          { label: 'Nota',            color: 'bg-gray-400' },
  cambio_estado: { label: 'Cambio de estado', color: 'bg-[#e5ba4a]' },
  escalado:      { label: 'Escalado',         color: 'bg-red-400' },
  asignacion:    { label: 'Asignación',       color: 'bg-blue-400' },
  resolucion:    { label: 'Resolución',       color: 'bg-green-400' },
  cierre:        { label: 'Cierre',           color: 'bg-gray-500' },
};

export default function IncidenciaDetalleModal({
  open, onClose, incidenciaId, onDataChanged,
}) {
  const [inc, setInc]           = useState(null);
  const [loading, setLoading]   = useState(false);
  const [accion, setAccion]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [usuarios, setUsuarios] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchDetalle = useCallback(async () => {
    if (!incidenciaId) return;
    setLoading(true);
    try {
      const data = await getIncidencia(incidenciaId);
      setInc(data);
    } catch {
      swalError('Error', 'No se pudo cargar la incidencia.');
    } finally {
      setLoading(false);
    }
  }, [incidenciaId]);

  useEffect(() => {
    if (open) {
      fetchDetalle();
      setAccion(null);
      reset();
      getUsuariosActivos()
        .then(setUsuarios)
        .catch(() => {});
    }
  }, [open, fetchDetalle, reset]);

  const handleAccion = (tipo) => {
    setAccion((prev) => (prev === tipo ? null : tipo));
    reset();
  };

  const onCambiarEstado = async (data) => {
    setSaving(true);
    try {
      await cambiarEstadoSvc(incidenciaId, {
        estado:      data.estado,
        descripcion: data.descripcion?.trim() || '',
      });
      swalSuccess('Listo', 'Estado actualizado correctamente.');
      setAccion(null);
      await fetchDetalle();
      onDataChanged?.();
    } catch {
      swalError('Error', 'No se pudo actualizar el estado.');
    } finally {
      setSaving(false);
    }
  };

  const onAsignar = async (data) => {
    setSaving(true);
    try {
      await asignarIncidenciaSvc(incidenciaId, { asignado_a: data.asignado_a });
      swalSuccess('Listo', 'Incidencia asignada correctamente.');
      setAccion(null);
      await fetchDetalle();
      onDataChanged?.();
    } catch {
      swalError('Error', 'No se pudo asignar la incidencia.');
    } finally {
      setSaving(false);
    }
  };

  const onAgregarNota = async (data) => {
    setSaving(true);
    try {
      await agregarNotaSvc(incidenciaId, { descripcion: data.nota.trim() });
      swalSuccess('Listo', 'Nota agregada.');
      setAccion(null);
      reset();
      await fetchDetalle();
    } catch {
      swalError('Error', 'No se pudo agregar la nota.');
    } finally {
      setSaving(false);
    }
  };

  const isCerrada = inc?.estado === 'cerrada' || inc?.estado === 'resuelta';
  const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#e5ba4a] transition-colors bg-white';

  return (
    <Modal open={open} onClose={onClose} title="Detalle de Incidencia" size="xl">
      {loading && (
        <div className="p-10 text-center text-gray-400 text-sm">Cargando...</div>
      )}

      {!loading && inc && (
        <div className="divide-y divide-gray-100">

          {/* Header de la incidencia */}
          <div className="px-6 py-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-gray-400">{inc.codigo}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORIDAD_BADGE[inc.prioridad]}`}>
                {PRIORIDAD_LABEL[inc.prioridad]}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE[inc.estado]}`}>
                {ESTADO_LABEL[inc.estado]}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {CATEGORIA_LABEL[inc.categoria]}
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-800">{inc.titulo}</h3>
          </div>

          {/* Info grid */}
          <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Urgencia</p>
              <p className="font-medium text-gray-700 capitalize">{inc.urgencia}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Impacto</p>
              <p className="font-medium text-gray-700 capitalize">{inc.impacto}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Reportado por</p>
              <p className="font-medium text-gray-700">{inc.reportado_por ?? 'Cliente'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Asignado a</p>
              <p className="font-medium text-gray-700">{inc.asignado_a ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Canal</p>
              <p className="font-medium text-gray-700 capitalize">{inc.canal_entrada}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Registrada</p>
              <p className="font-medium text-gray-700">{fmtFecha(inc.fecha_registro)}</p>
            </div>
            {inc.fecha_resolucion && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Resuelta</p>
                <p className="font-medium text-gray-700">{fmtFecha(inc.fecha_resolucion)}</p>
              </div>
            )}
            {inc.fecha_cierre && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Cerrada</p>
                <p className="font-medium text-gray-700">{fmtFecha(inc.fecha_cierre)}</p>
              </div>
            )}
          </div>

          {/* Entidades relacionadas */}
          {(inc.cliente_nombres || inc.placa) && (
            <div className="px-6 py-4 flex flex-wrap gap-4 text-sm">
              {inc.cliente_nombres && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User size={14} className="text-[#e5ba4a]" />
                  <span>{inc.cliente_nombres} {inc.cliente_apellidos}</span>
                </div>
              )}
              {inc.placa && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Tag size={14} className="text-[#e5ba4a]" />
                  <span>{inc.placa} — {inc.vehiculo_marca} {inc.vehiculo_modelo}</span>
                </div>
              )}
            </div>
          )}

          {/* Descripción */}
          <div className="px-6 py-4">
            <p className="text-xs text-gray-400 mb-1">Descripción</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{inc.descripcion}</p>
          </div>

          {/* Solución */}
          {inc.solucion && (
            <div className="px-6 py-4">
              <p className="text-xs text-gray-400 mb-1">Solución aplicada</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{inc.solucion}</p>
              {inc.categoria_cierre && (
                <span className="mt-2 inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full capitalize">
                  {inc.categoria_cierre.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          )}

          {/* Imágenes */}
          {inc.imagenes?.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-xs text-gray-400 mb-2">Imágenes adjuntas</p>
              <div className="flex flex-wrap gap-3">
                {inc.imagenes.map((img) => (
                  <a
                    key={img.imagen_id}
                    href={img.ruta_archivo}
                    target="_blank"
                    rel="noreferrer"
                    className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 block hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={img.ruta_archivo}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Historial */}
          <div className="px-6 py-4">
            <p className="text-xs text-gray-400 mb-3">Historial de actividad</p>
            {inc.historial?.length === 0 && (
              <p className="text-sm text-gray-400">Sin actividad registrada.</p>
            )}
            <div className="space-y-3">
              {inc.historial?.map((h) => {
                const tipo = TIPO_HISTORIAL[h.tipo_accion] ?? { label: h.tipo_accion, color: 'bg-gray-400' };
                return (
                  <div key={h.historial_id} className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 ${tipo.color}`} />
                      <div className="flex-1 w-px bg-gray-100 mt-1" />
                    </div>
                    <div className="pb-3 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-700">{tipo.label}</span>
                        {h.estado_anterior && (
                          <span className="text-[11px] text-gray-400">
                            {ESTADO_LABEL[h.estado_anterior] ?? h.estado_anterior}
                            {' → '}
                            {ESTADO_LABEL[h.estado_nuevo] ?? h.estado_nuevo}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 ml-auto">{fmtFecha(h.fecha)}</span>
                      </div>
                      <p className="text-xs text-gray-600">{h.descripcion}</p>
                      {h.realizado_por && (
                        <p className="text-[11px] text-gray-400 mt-0.5">por {h.nombre_completo ?? h.realizado_por}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel de acciones (solo si no está cerrada/resuelta) */}
          {!isCerrada && (
            <div className="px-6 py-4 space-y-3">

              {/* Botones de acción */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleAccion(ACCION.ESTADO)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    accion === ACCION.ESTADO
                      ? 'bg-[#e5ba4a] text-white border-[#e5ba4a]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#e5ba4a] hover:text-[#e5ba4a]'
                  }`}
                >
                  <RefreshCw size={14} /> Cambiar estado
                  <ChevronDown size={12} className={`transition-transform ${accion === ACCION.ESTADO ? 'rotate-180' : ''}`} />
                </button>

                <button
                  onClick={() => handleAccion(ACCION.ASIGNAR)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    accion === ACCION.ASIGNAR
                      ? 'bg-[#e5ba4a] text-white border-[#e5ba4a]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#e5ba4a] hover:text-[#e5ba4a]'
                  }`}
                >
                  <UserCheck size={14} /> Asignar
                  <ChevronDown size={12} className={`transition-transform ${accion === ACCION.ASIGNAR ? 'rotate-180' : ''}`} />
                </button>

                <button
                  onClick={() => handleAccion(ACCION.NOTA)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    accion === ACCION.NOTA
                      ? 'bg-[#e5ba4a] text-white border-[#e5ba4a]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#e5ba4a] hover:text-[#e5ba4a]'
                  }`}
                >
                  <MessageSquare size={14} /> Agregar nota
                  <ChevronDown size={12} className={`transition-transform ${accion === ACCION.NOTA ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Panel inline: Cambiar Estado */}
              {accion === ACCION.ESTADO && (
                <form onSubmit={handleSubmit(onCambiarEstado)} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nuevo estado</label>
                    <select
                      {...register('estado', { required: 'Selecciona un estado' })}
                      className={inp}
                      defaultValue=""
                    >
                      <option value="" disabled>Seleccionar...</option>
                      {ESTADOS.filter((e) => e.value !== inc.estado).map((e) => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                    {errors.estado && <p className="text-xs text-red-500 mt-0.5">{errors.estado.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
                    <input
                      {...register('descripcion', REGLAS.descripcionEstado)}
                      onChange={(e) => { register('descripcion').onChange(e); }}
                      placeholder="Explica el motivo del cambio..."
                      className={inp}
                      maxLength={300}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setAccion(null)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
                      Cancelar
                    </button>
                    <button type="submit" disabled={saving} className="px-4 py-1.5 bg-[#e5ba4a] hover:bg-[#d4a93a] text-white text-sm rounded-lg transition-colors disabled:opacity-60">
                      {saving ? 'Guardando...' : 'Confirmar'}
                    </button>
                  </div>
                </form>
              )}

              {/* Panel inline: Asignar */}
              {accion === ACCION.ASIGNAR && (
                <form onSubmit={handleSubmit(onAsignar)} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Asignar a</label>
                    <select
                      {...register('asignado_a', { required: 'Selecciona un usuario' })}
                      className={inp}
                      defaultValue={inc.asignado_a ?? ''}
                    >
                      <option value="" disabled>Seleccionar usuario...</option>
                      {usuarios.map((u) => (
                        <option key={u.username} value={u.username}>
                          {u.nombre_completo ?? u.username}
                        </option>
                      ))}
                    </select>
                    {errors.asignado_a && <p className="text-xs text-red-500 mt-0.5">{errors.asignado_a.message}</p>}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setAccion(null)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
                      Cancelar
                    </button>
                    <button type="submit" disabled={saving} className="px-4 py-1.5 bg-[#e5ba4a] hover:bg-[#d4a93a] text-white text-sm rounded-lg transition-colors disabled:opacity-60">
                      {saving ? 'Asignando...' : 'Asignar'}
                    </button>
                  </div>
                </form>
              )}

              {/* Panel inline: Agregar Nota */}
              {accion === ACCION.NOTA && (
                <form onSubmit={handleSubmit(onAgregarNota)} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nota</label>
                    <textarea
                      {...register('nota', REGLAS.nota)}
                      onChange={(e) => { register('nota').onChange(e); e.target.value = sanitizar.texto(e.target.value); }}
                      placeholder="Agrega una observación o avance..."
                      rows={3}
                      className={`${inp} resize-none`}
                      maxLength={500}
                    />
                    {errors.nota && <p className="text-xs text-red-500 mt-0.5">{errors.nota.message}</p>}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setAccion(null)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
                      Cancelar
                    </button>
                    <button type="submit" disabled={saving} className="px-4 py-1.5 bg-[#e5ba4a] hover:bg-[#d4a93a] text-white text-sm rounded-lg transition-colors disabled:opacity-60">
                      {saving ? 'Guardando...' : 'Agregar nota'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
