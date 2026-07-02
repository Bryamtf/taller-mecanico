import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/Modal/Modal';
import { onKeyDown, sanitizar, validar } from '@/utils/inputSanitizer';

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#e5ba4a] transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
const errorClass = 'text-xs text-red-500 mt-0.5';

export default function ProveedorModal({ open, onClose, onSave, proveedor }) {
  const isEdit = !!proveedor;
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (open) reset(proveedor ?? {});
  }, [open, proveedor, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await onSave({
        razon_social: data.razon_social.trim(),
        ruc:          data.ruc?.trim()       || null,
        telefono:     data.telefono?.trim()  || null,
        email:        data.email?.trim()     || null,
        direccion:    data.direccion?.trim() || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar proveedor' : 'Nuevo proveedor'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

        <div>
          <label className={labelClass}>Razón social *</label>
          <input
            {...register('razon_social', { required: 'La razón social es requerida' })}
            onChange={e => setValue('razon_social', sanitizar.texto(e.target.value))}
            placeholder="Ej: Repuestos del Norte S.A.C."
            className={inputClass}
          />
          {errors.razon_social && <p className={errorClass}>{errors.razon_social.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>RUC</label>
            <input
              {...register('ruc', {
                validate: v => !v || validar.ruc(v) === true || validar.ruc(v),
              })}
              onKeyDown={onKeyDown.soloNumeros}
              onChange={e => setValue('ruc', sanitizar.ruc(e.target.value))}
              placeholder="20xxxxxxxxx"
              maxLength={11}
              className={inputClass}
            />
            {errors.ruc && <p className={errorClass}>{errors.ruc.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input
              {...register('telefono', {
                validate: v => !v || validar.telefono(v) === true || validar.telefono(v),
              })}
              onKeyDown={onKeyDown.soloNumeros}
              onChange={e => setValue('telefono', sanitizar.telefono(e.target.value))}
              placeholder="987654321"
              maxLength={9}
              className={inputClass}
            />
            {errors.telefono && <p className={errorClass}>{errors.telefono.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            {...register('email', {
              validate: v => !v || validar.email(v) === true || validar.email(v),
            })}
            onChange={e => setValue('email', sanitizar.email(e.target.value))}
            placeholder="contacto@proveedor.com"
            className={inputClass}
          />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Dirección</label>
          <input
            {...register('direccion')}
            onChange={e => setValue('direccion', sanitizar.texto(e.target.value))}
            placeholder="Av. Industrial 123, Lima"
            className={inputClass}
          />
        </div>

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
