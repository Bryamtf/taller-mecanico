import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/Modal/Modal';
import api from '@/lib/axios';
import PasswordChecklist from './PasswordChecklist';
import { isPasswordValid } from '../utils/validacionesUsuario';

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#e5ba4a] transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
const errorClass = 'text-xs text-red-500 mt-0.5';

export default function PasswordModal({ open, onClose, usuario, isOwnProfile, onResetPassword }) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const passwordNueva = watch('password_nueva', '');

  useEffect(() => {
    if (open) reset({ password_actual: '', password_nueva: '', repetir_password: '' });
  }, [open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (isOwnProfile) {
        await api.post('/auth/cambiar-password', {
          password_actual: data.password_actual,
          password_nueva: data.password_nueva,
        });
      } else {
        await onResetPassword(usuario.username, data.password_nueva);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isOwnProfile ? 'Cambiar mi contraseña' : `Resetear contraseña: ${usuario?.username ?? ''}`}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        {isOwnProfile && (
          <div>
            <label className={labelClass}>Contraseña actual *</label>
            <input
              {...register('password_actual', { required: 'Requerida' })}
              type="password"
              className={inputClass}
            />
            {errors.password_actual && <p className={errorClass}>{errors.password_actual.message}</p>}
          </div>
        )}

        <div>
          <label className={labelClass}>Nueva contraseña *</label>
          <input
            {...register('password_nueva', {
              required: 'Requerida',
              validate: (value) => isPasswordValid(value) || 'La contraseña no cumple los requisitos',
            })}
            type="password"
            className={inputClass}
          />
          <PasswordChecklist value={passwordNueva} />
          {errors.password_nueva && <p className={errorClass}>{errors.password_nueva.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Repetir nueva contraseña *</label>
          <input
            {...register('repetir_password', {
              required: 'Requerida',
              validate: (value) => value === passwordNueva || 'Las contraseñas no coinciden',
            })}
            type="password"
            className={inputClass}
          />
          {errors.repetir_password && <p className={errorClass}>{errors.repetir_password.message}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-[#e5ba4a] text-white font-medium hover:bg-[#d4a93a] disabled:opacity-60 transition-colors">
            {saving ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
