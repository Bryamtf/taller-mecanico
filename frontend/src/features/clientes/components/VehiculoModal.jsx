import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Loader } from 'lucide-react';
import Modal from '@/components/Modal/Modal';
import { consultarPlaca, createVehiculo } from '../services/vehiculoService';
import { swalError } from '@/lib/swal';

const COMBUSTIBLES = ['gasolina', 'diesel', 'GLP', 'GNV', 'electrico', 'hibrido'];

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#e5ba4a] transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
const errorClass = 'text-xs text-red-500 mt-0.5';

export default function VehiculoModal({ open, onClose, onSaved, clienteId }) {
  const [buscandoPlaca, setBuscandoPlaca] = useState(false);
  const [saving, setSaving]               = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const placaValue = watch('placa', '');

  const handleClose = () => { reset(); onClose(); };

  const handleConsultarPlaca = async () => {
    const placa = placaValue?.trim();
    if (!placa || placa.length < 4) {
      swalError('Placa inválida', 'Ingresa una placa válida antes de consultar.');
      return;
    }
    setBuscandoPlaca(true);
    try {
      const data = await consultarPlaca(placa.toUpperCase());
      if (data.marca)  setValue('marca',  data.marca);
      if (data.modelo) setValue('modelo', data.modelo);
      if (data.año)    setValue('anio',   data.año);
      if (data.color)  setValue('color',  data.color);
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
      await createVehiculo({
        cliente_id:         clienteId,
        placa:              data.placa.trim().toUpperCase(),
        marca:              data.marca?.trim()            || undefined,
        modelo:             data.modelo?.trim()           || undefined,
        anio:               data.anio                     || undefined,
        color:              data.color?.trim()            || undefined,
        tipo_combustible:   data.tipo_combustible         || undefined,
        kilometraje_actual: data.kilometraje_actual       || undefined,
      });
      reset();
      onSaved();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al registrar el vehículo.';
      swalError('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Agregar vehículo" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

        {/* Placa con consulta */}
        <div>
          <label className={labelClass}>Placa *</label>
          <div className="flex gap-2">
            <input
              {...register('placa', {
                required: 'La placa es requerida',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                maxLength: { value: 10, message: 'Máximo 10 caracteres' },
                onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
              })}
              placeholder="ABC-123"
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleConsultarPlaca}
              disabled={buscandoPlaca}
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

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-[#e5ba4a] text-white font-medium hover:bg-[#d4a93a] disabled:opacity-60 transition-colors"
          >
            {saving ? 'Guardando...' : 'Agregar vehículo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
