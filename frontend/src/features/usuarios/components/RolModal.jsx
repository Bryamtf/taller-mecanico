import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '@/components/Modal/Modal';

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#e5ba4a] transition-colors';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
const errorClass = 'text-xs text-red-500 mt-0.5';
const ACTIONS = [
  { key: 'ver', field: 'puede_ver', label: 'Ver' },
  { key: 'crear', field: 'puede_crear', label: 'Crear' },
  { key: 'editar', field: 'puede_editar', label: 'Editar' },
  { key: 'eliminar', field: 'puede_eliminar', label: 'Eliminar' },
];
const normalizarRol = (rol) => String(rol || '').trim().toLowerCase();

export default function RolModal({ open, onClose, rol, permisos, onSave }) {
  const isEdit = !!rol;
  const isProtected = ['admin', 'super_admin'].includes(normalizarRol(rol?.nombre));
  const [saving, setSaving] = useState(false);
  const [matriz, setMatriz] = useState({});
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const matrizPorModulo = useMemo(() => {
    const modulos = permisos.reduce((acc, permiso) => {
      const modulo = permiso.modulo;
      const accion = ACTIONS.find((item) => permiso.nombre === `${item.key}_${modulo}`);

      acc[modulo] = acc[modulo] || {
        modulo,
        acciones: {},
      };

      if (accion) {
        acc[modulo].acciones[accion.field] = permiso;
      }

      return acc;
    }, {});

    return Object.values(modulos).sort((a, b) => a.modulo.localeCompare(b.modulo));
  }, [permisos]);

  useEffect(() => {
    if (!open) return;
    reset({
      nombre: rol?.nombre ?? '',
      descripcion: rol?.descripcion ?? '',
    });

    const inicial = {};
    permisos.forEach((permiso) => {
      const asignado = rol?.permisos?.find((item) => item.permiso_id === permiso.permiso_id);
      inicial[permiso.permiso_id] = {
        permiso_id: permiso.permiso_id,
        puede_ver: asignado?.puede_ver ? 1 : 0,
        puede_crear: asignado?.puede_crear ? 1 : 0,
        puede_editar: asignado?.puede_editar ? 1 : 0,
        puede_eliminar: asignado?.puede_eliminar ? 1 : 0,
      };
    });
    setMatriz(inicial);
  }, [open, permisos, rol, reset]);

  const togglePermiso = (permisoId, actionField) => {
    if (isProtected) return;
    setMatriz((prev) => ({
      ...prev,
      [permisoId]: {
        ...prev[permisoId],
        [actionField]: prev[permisoId]?.[actionField] ? 0 : 1,
      },
    }));
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await onSave({
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        permisos: Object.values(matriz),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar rol' : 'Nuevo rol'} size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre *</label>
            <input
              {...register('nombre', { required: 'Requerido' })}
              disabled={isProtected}
              className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-500`}
            />
            {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Descripción</label>
            <input
              {...register('descripcion')}
              disabled={isProtected}
              className={`${inputClass} disabled:bg-gray-100 disabled:text-gray-500`}
            />
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left bg-gray-50">
                  <th className="px-4 py-3 font-semibold text-gray-600">Permiso</th>
                  {ACTIONS.map((action) => (
                    <th key={action.key} className="px-4 py-3 font-semibold text-gray-600 text-center">{action.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrizPorModulo.map((fila) => (
                  <tr key={fila.modulo} className="border-b border-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-700 uppercase tracking-wide">{fila.modulo}</p>
                    </td>
                    {ACTIONS.map((action) => {
                      const permiso = fila.acciones[action.field];
                      return (
                        <td key={action.field} className="px-4 py-3 text-center">
                          {permiso ? (
                            <input
                              type="checkbox"
                              checked={!!matriz[permiso.permiso_id]?.[action.field]}
                              disabled={isProtected}
                              onChange={() => togglePermiso(permiso.permiso_id, action.field)}
                              className="h-4 w-4 accent-[#e5ba4a]"
                              title={permiso.nombre}
                            />
                          ) : (
                            <span className="inline-block h-px w-5 bg-gray-200 align-middle" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving || isProtected}
            className="px-4 py-2 text-sm rounded-lg bg-[#e5ba4a] text-white font-medium hover:bg-[#d4a93a] disabled:opacity-60 transition-colors">
            {saving ? 'Guardando...' : 'Guardar rol'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
