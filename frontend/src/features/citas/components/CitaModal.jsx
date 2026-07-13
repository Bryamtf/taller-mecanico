import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/Modal/Modal';
import SelectorBuscable from '@/components/SelectorBuscable';
import * as svc from '../services/citaService';
import { REGLAS, TIPOS_SERVICIO } from '../utils/citaValidaciones';

const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#e5ba4a] transition-colors bg-white';
const lbl = 'block text-xs font-medium text-gray-600 mb-1';
const err = 'text-xs text-red-500 mt-0.5';

const soloFecha = (v) => (v ? String(v).split('T')[0] : '');
const soloHora  = (v) => (v ? String(v).split('T')[1]?.slice(0, 5) : '');

export default function CitaModal({ open, onClose, onSave, cita }) {
  const isEdit = !!cita;

  const [saving, setSaving]         = useState(false);
  const [clientes, setClientes]     = useState([]);
  const [vehiculos, setVehiculos]   = useState([]);
  const [tecnicos, setTecnicos]     = useState([]);

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm();

  const clienteId = watch('cliente_id');

  useEffect(() => {
    if (!open) return;
    svc.getClientes().then(setClientes).catch(() => setClientes([]));
    svc.getUsuariosActivos().then(setTecnicos).catch(() => setTecnicos([]));

    reset(
      isEdit
        ? {
            cliente_id:             cita.cliente_id,
            vehiculo_id:            cita.vehiculo_id,
            fecha:                  soloFecha(cita.fecha_hora),
            hora:                   soloHora(cita.fecha_hora),
            tipo_servicio:          cita.tipo_servicio ?? '',
            descripcion_problema:   cita.descripcion_problema ?? '',
            atendido_por:           cita.atendido_por ?? '',
            fecha_estimada_entrega: soloFecha(cita.fecha_estimada_entrega),
            observaciones_tecnico:  cita.observaciones_tecnico ?? '',
          }
        : {}
    );
  }, [open, cita, isEdit, reset]);

  useEffect(() => {
    if (!open || !clienteId) { setVehiculos([]); return; }
    svc.getVehiculosPorCliente(clienteId).then(setVehiculos).catch(() => setVehiculos([]));
  }, [open, clienteId]);

  const handleClienteSeleccionado = (cliente) => {
    setValue('cliente_id', cliente.cliente_id);
    setValue('vehiculo_id', '');
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        cliente_id: Number(data.cliente_id),
        vehiculo_id: Number(data.vehiculo_id),
        fecha_hora: `${data.fecha} ${data.hora}:00`,
        tipo_servicio: data.tipo_servicio,
        descripcion_problema: data.descripcion_problema?.trim() || '',
        atendido_por: data.atendido_por || null,
        fecha_estimada_entrega: data.fecha_estimada_entrega || null,
      };
      if (isEdit) payload.observaciones_tecnico = data.observaciones_tecnico?.trim() || '';

      await onSave(payload, isEdit);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar cita' : 'Nueva cita'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Cliente y vehículo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Cliente <span className="text-red-400">*</span></label>
            <SelectorBuscable
              opciones={clientes}
              valorSeleccionado={watch('cliente_id') || null}
              onSeleccionar={handleClienteSeleccionado}
              getLabel={(c) => `${c.nombres} ${c.apellidos} - ${c.dni_ruc || 'Sin DNI'}`}
              getValue={(c) => c.cliente_id}
              placeholder="-- Seleccione un cliente --"
            />
            <input {...register('cliente_id', REGLAS.cliente_id)} type="hidden" />
            {errors.cliente_id && <p className={err}>{errors.cliente_id.message}</p>}
          </div>

          <div>
            <label className={lbl}>Vehículo <span className="text-red-400">*</span></label>
            <select {...register('vehiculo_id', REGLAS.vehiculo_id)} disabled={!clienteId} className={inp}>
              <option value="">-- Seleccione un vehículo --</option>
              {vehiculos.map((v) => (
                <option key={v.vehiculo_id} value={v.vehiculo_id}>
                  {v.placa} - {v.marca} {v.modelo} ({v.anio || 'Sin año'})
                </option>
              ))}
            </select>
            {errors.vehiculo_id && <p className={err}>{errors.vehiculo_id.message}</p>}
          </div>
        </div>

        {/* Fecha, hora, tipo de servicio */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={lbl}>Fecha <span className="text-red-400">*</span></label>
            <input type="date" {...register('fecha', REGLAS.fecha)} className={inp} />
            {errors.fecha && <p className={err}>{errors.fecha.message}</p>}
          </div>
          <div>
            <label className={lbl}>Hora <span className="text-red-400">*</span></label>
            <input type="time" {...register('hora', REGLAS.hora)} className={inp} />
            {errors.hora && <p className={err}>{errors.hora.message}</p>}
          </div>
          <div>
            <label className={lbl}>Tipo de servicio <span className="text-red-400">*</span></label>
            <select {...register('tipo_servicio', REGLAS.tipo_servicio)} className={inp}>
              <option value="">Seleccionar...</option>
              {TIPOS_SERVICIO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.tipo_servicio && <p className={err}>{errors.tipo_servicio.message}</p>}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className={lbl}>Descripción del problema</label>
          <textarea
            {...register('descripcion_problema', REGLAS.descripcion_problema)}
            placeholder="Detalla el motivo de la cita..."
            rows={3}
            className={`${inp} resize-none`}
            maxLength={1000}
          />
          {errors.descripcion_problema && <p className={err}>{errors.descripcion_problema.message}</p>}
        </div>

        {/* Técnico y fecha estimada de entrega */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Técnico asignado</label>
            <select {...register('atendido_por')} className={inp}>
              <option value="">Sin asignar</option>
              {tecnicos.map((u) => (
                <option key={u.username} value={u.username}>{u.nombre_completo || u.username}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Fecha estimada de entrega</label>
            <input type="date" {...register('fecha_estimada_entrega')} className={inp} />
          </div>
        </div>

        {/* Observaciones del técnico (solo edición) */}
        {isEdit && (
          <div>
            <label className={lbl}>Observaciones del técnico</label>
            <textarea
              {...register('observaciones_tecnico', REGLAS.observaciones_tecnico)}
              placeholder="Notas internas sobre el avance del trabajo..."
              rows={3}
              className={`${inp} resize-none`}
              maxLength={1000}
            />
            {errors.observaciones_tecnico && <p className={err}>{errors.observaciones_tecnico.message}</p>}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-[#e5ba4a] hover:bg-[#d4a93a] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Agendar cita'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
