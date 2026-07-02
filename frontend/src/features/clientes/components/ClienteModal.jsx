import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronDown, ChevronUp, Search, Loader } from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import { consultarPlaca } from '../services/vehiculoService';
import { swalError } from '@/lib/swal';

const COMBUSTIBLES = ['gasolina', 'diesel', 'GLP', 'GNV', 'electrico', 'hibrido'];

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#e5ba4a] transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
const errorClass = 'text-xs text-red-500 mt-0.5';

export default function ClienteModal({ open, onClose, onSave, cliente }) {
  const isEdit = !!cliente;
  const [showVehiculo, setShowVehiculo] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [buscandoPlaca, setBuscandoPlaca] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const placaValue = watch('placa', '');

  useEffect(() => {
    if (open) {
      reset(cliente ?? {});
      setShowVehiculo(false);
    }
  }, [open, cliente, reset]);

  const handleConsultarPlaca = async () => {
    const placa = placaValue?.trim();
    if (!placa || placa.length < 4) {
      swalError('Placa inválida', 'Ingresa una placa válida antes de consultar.');
      return;
    }
    setBuscandoPlaca(true);
    try {
      const data = await consultarPlaca(placa.toUpperCase());
      if (data.marca)    setValue('marca',   data.marca);
      if (data.modelo)   setValue('modelo',  data.modelo);
      if (data.año)      setValue('anio',    data.año);
      if (data.color)    setValue('color',   data.color);
    } catch (err) {
      const msg = err.response?.status === 404
        ? 'No se encontró información para esa placa.'
        : 'No se pudo consultar la placa. Ingresa los datos manualmente.';
      swalError('Sin resultados', msg);
    } finally {
      setBuscandoPlaca(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        nombres:   data.nombres.trim(),
        apellidos: data.apellidos.trim(),
        dni_ruc:   data.dni_ruc?.trim()   || null,
        telefono:  data.telefono?.trim()  || null,
        email:     data.email?.trim()     || null,
        direccion: data.direccion?.trim() || null,
      };

      if (!isEdit && showVehiculo && data.placa?.trim()) {
        payload.vehiculo = {
          placa:              data.placa.trim().toUpperCase(),
          marca:              data.marca?.trim()            || null,
          modelo:             data.modelo?.trim()           || null,
          anio:               data.anio                     || null,
          color:              data.color?.trim()            || null,
          tipo_combustible:   data.tipo_combustible         || null,
          kilometraje_actual: data.kilometraje_actual       || null,
        };
      }

      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar cliente' : 'Nuevo cliente'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

        {/* Datos del cliente */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombres *</label>
            <input
              {...register('nombres', { required: 'Requerido', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
              className={inputClass}
            />
            {errors.nombres && <p className={errorClass}>{errors.nombres.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Apellidos *</label>
            <input
              {...register('apellidos', { required: 'Requerido', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
              className={inputClass}
            />
            {errors.apellidos && <p className={errorClass}>{errors.apellidos.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>DNI / RUC</label>
            <input
              {...register('dni_ruc', {
                pattern: cliente?.dni_ruc !== '00000000'
                  ? { value: /^\d{8}$|^\d{11}$/, message: 'Debe tener 8 (DNI) u 11 dígitos (RUC)' }
                  : undefined,
              })}
              placeholder="8 u 11 dígitos"
              disabled={cliente?.dni_ruc === '00000000'}
              className={`${inputClass} ${cliente?.dni_ruc === '00000000' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
            />
            {cliente?.dni_ruc === '00000000' && (
              <p className="text-xs text-gray-400 mt-0.5">DNI protegido — cliente del sistema</p>
            )}
            {errors.dni_ruc && <p className={errorClass}>{errors.dni_ruc.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input
              {...register('telefono', {
                pattern: { value: /^\d{7,15}$/, message: 'Solo números, 7–15 dígitos' },
              })}
              placeholder="987654321"
              className={inputClass}
            />
            {errors.telefono && <p className={errorClass}>{errors.telefono.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            {...register('email', {
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
            })}
            type="email"
            placeholder="cliente@email.com"
            className={inputClass}
          />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Dirección</label>
          <input {...register('direccion')} className={inputClass} />
        </div>

        {/* Sección vehículo — solo en creación */}
        {!isEdit && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowVehiculo((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span>Agregar vehículo (opcional)</span>
              {showVehiculo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showVehiculo && (
              <div className="p-4 space-y-4">

                {/* Placa con botón consultar */}
                <div>
                  <label className={labelClass}>Placa *</label>
                  <div className="flex gap-2">
                    <input
                      {...register('placa', {
                        required: showVehiculo ? 'Requerida si agrega vehículo' : false,
                        pattern: { value: /^[A-Z0-9-]{4,8}$/i, message: 'Formato inválido' },
                        onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
                      })}
                      placeholder="ABC-123"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={handleConsultarPlaca}
                      disabled={buscandoPlaca}
                      title="Consultar datos del vehículo por placa"
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[#e5ba4a] text-white hover:bg-[#d4a93a] disabled:opacity-60 transition-colors"
                    >
                      {buscandoPlaca ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
                      {buscandoPlaca ? 'Buscando...' : 'Consultar'}
                    </button>
                  </div>
                  {errors.placa && <p className={errorClass}>{errors.placa.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Marca</label>
                    <input {...register('marca')} placeholder="Toyota" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Modelo</label>
                    <input {...register('modelo')} placeholder="Corolla" className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Año</label>
                    <input
                      {...register('anio', {
                        min: { value: 1950, message: 'Año inválido' },
                        max: { value: new Date().getFullYear() + 1, message: 'Año inválido' },
                      })}
                      type="number"
                      placeholder="2020"
                      className={inputClass}
                    />
                    {errors.anio && <p className={errorClass}>{errors.anio.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Color</label>
                    <input {...register('color')} placeholder="Blanco" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Combustible</label>
                    <select {...register('tipo_combustible')} className={inputClass}>
                      <option value="">Seleccionar</option>
                      {COMBUSTIBLES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Kilometraje actual</label>
                  <input
                    {...register('kilometraje_actual', { min: { value: 0, message: 'Inválido' } })}
                    type="number"
                    placeholder="50000"
                    className={inputClass}
                  />
                  {errors.kilometraje_actual && <p className={errorClass}>{errors.kilometraje_actual.message}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-[#e5ba4a] text-white font-medium hover:bg-[#d4a93a] disabled:opacity-60 transition-colors"
          >
            {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
