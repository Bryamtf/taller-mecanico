import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/Modal/Modal';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { onKeyDown, sanitizar, validar } from '@/utils/inputSanitizer';
import PasswordChecklist from './PasswordChecklist';
import { isPasswordValid, nombreRegex } from '../utils/validacionesUsuario';

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#e5ba4a] transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
const errorClass = 'text-xs text-red-500 mt-0.5';
const normalizarRol = (rol) => String(rol || '').trim().toLowerCase();

export default function UsuarioModal({ open, onClose, usuario, roles, onSave }) {
  const isEdit = !!usuario;
  const { user } = useAuth();
  const isSuperAdmin = normalizarRol(user?.rol_nombre) === 'super_admin' || normalizarRol(user?.rol) === 'super_admin';
  const isOwnUser = isEdit && usuario?.username === user?.username;
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const passwordValue = watch('password', '');

  const rolesDisponibles = useMemo(
    () => roles.filter((rol) => (
      rol.activo !== 0 &&
      (
        isSuperAdmin ||
        normalizarRol(rol.nombre) !== 'super_admin'
      )
    )),
    [roles, isSuperAdmin],
  );

  useEffect(() => {
    if (!open) return;
    reset({
      username: usuario?.username ?? '',
      email: usuario?.email ?? '',
      nombre_completo: usuario?.nombre_completo ?? '',
      rol_id: usuario?.rol_id ?? '',
      password: '',
    });
  }, [open, usuario, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        username: data.username?.trim(),
        email: sanitizar.email(data.email || ''),
        nombre_completo: sanitizar.nombre(data.nombre_completo || ''),
        rol_id: Number(data.rol_id),
      };

      if (!isEdit) payload.password = data.password;
      if (isEdit) delete payload.username;

      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar usuario' : 'Nuevo usuario'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Usuario *</label>
            <input
              {...register('username', {
                required: 'Requerido',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
              disabled={isEdit}
              className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-500`}
            />
            {errors.username && <p className={errorClass}>{errors.username.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Rol *</label>
            <select
              {...register('rol_id', { required: 'Selecciona un rol' })}
              disabled={isOwnUser}
              className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-500`}
            >
              <option value="">Seleccionar</option>
              {rolesDisponibles.map((rol) => (
                <option key={rol.rol_id} value={rol.rol_id}>{rol.nombre}</option>
              ))}
            </select>
            {errors.rol_id && <p className={errorClass}>{errors.rol_id.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Nombre completo *</label>
          <input
            {...register('nombre_completo', {
              required: 'Requerido',
              pattern: { value: nombreRegex, message: 'Solo letras y espacios' },
              onChange: (e) => setValue('nombre_completo', sanitizar.nombre(e.target.value), { shouldValidate: true }),
            })}
            onKeyDown={onKeyDown.soloLetras}
            className={inputClass}
          />
          {errors.nombre_completo && <p className={errorClass}>{errors.nombre_completo.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Email *</label>
          <input
            {...register('email', {
              required: 'Requerido',
              validate: validar.email,
              onChange: (e) => setValue('email', sanitizar.email(e.target.value), { shouldValidate: true }),
            })}
            type="email"
            className={inputClass}
          />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>

        {!isEdit && (
          <div>
            <label className={labelClass}>Contraseña *</label>
            <input
              {...register('password', {
                required: 'Requerida',
                validate: (value) => isPasswordValid(value) || 'La contraseña no cumple los requisitos',
              })}
              type="password"
              className={inputClass}
            />
            <PasswordChecklist value={passwordValue} />
            {errors.password && <p className={errorClass}>{errors.password.message}</p>}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-[#e5ba4a] text-white font-medium hover:bg-[#d4a93a] disabled:opacity-60 transition-colors">
            {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
