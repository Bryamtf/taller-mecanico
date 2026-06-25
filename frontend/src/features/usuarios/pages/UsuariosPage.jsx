import { useMemo, useState } from 'react';
import { KeyRound, Pencil, Plus, Power, PowerOff, Search, Shield, Trash2, UserCog } from 'lucide-react';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { swalConfirm, swalError, swalSuccess } from '@/lib/swal';
import { useUsuarios } from '../hooks/useUsuarios';
import UsuarioModal from '../components/UsuarioModal';
import PasswordModal from '../components/PasswordModal';
import RolModal from '../components/RolModal';

const BADGE_ESTADO = {
  activo: 'bg-green-100 text-green-700',
  eliminado: 'bg-gray-100 text-gray-500',
};

const ADMIN_ROLES = ['admin', 'super_admin'];
const ROLES_PROTEGIDOS = ['admin', 'super_admin'];
const normalizarRol = (rol) => String(rol || '').trim().toLowerCase();

const tienePermiso = (user, permisoNombre, accion) => {
  if (normalizarRol(user?.rol_nombre) === 'super_admin' || normalizarRol(user?.rol) === 'super_admin') return true;
  const permiso = user?.permisos?.find((item) => item.nombre === permisoNombre);
  return !!permiso?.[accion];
};

const esAdminOSuperAdmin = (user) =>
  ADMIN_ROLES.includes(normalizarRol(user?.rol_nombre)) || ADMIN_ROLES.includes(normalizarRol(user?.rol));

const esRolProtegido = (rolNombre) => ROLES_PROTEGIDOS.includes(normalizarRol(rolNombre));

export default function UsuariosPage() {
  const { user } = useAuth();
  const {
    usuarios, roles, permisos, busqueda, estado, loading,
    handleBusqueda, handleEstado, crearUsuario, actualizarUsuario,
    eliminarUsuario, cambiarEstadoUsuario, resetPassword,
    crearRol, actualizarRol, eliminarRol, cambiarEstadoRol,
  } = useUsuarios();

  const [usuarioModalOpen, setUsuarioModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [rolModalOpen, setRolModalOpen] = useState(false);
  const [usuarioSel, setUsuarioSel] = useState(null);
  const [rolSel, setRolSel] = useState(null);

  const isSuperAdmin = normalizarRol(user?.rol_nombre) === 'super_admin' || normalizarRol(user?.rol) === 'super_admin';
  const isAdminOrSuperAdmin = esAdminOSuperAdmin(user);
  const puedeCrearEstricto = isAdminOrSuperAdmin;
  const puedeEditar = isAdminOrSuperAdmin || tienePermiso(user, 'editar_usuarios', 'puede_editar');
  const puedeEliminar = isAdminOrSuperAdmin || tienePermiso(user, 'editar_usuarios', 'puede_eliminar');
  const puedeEliminarRoles = isAdminOrSuperAdmin;

  const usuariosVisibles = useMemo(
    () => usuarios.filter((usuario) => {
      if (isSuperAdmin) return true;
      if (usuario.username === user?.username) return true;
      return !esRolProtegido(usuario.rol_nombre);
    }),
    [usuarios, isSuperAdmin, user?.username]
  );

  const totalActivos = useMemo(
    () => usuariosVisibles.filter((usuario) => !usuario.eliminado).length,
    [usuariosVisibles],
  );

  const handleNuevoUsuario = () => { setUsuarioSel(null); setUsuarioModalOpen(true); };
  const handleEditarUsuario = (usuario) => { setUsuarioSel(usuario); setUsuarioModalOpen(true); };
  const handlePassword = (usuario) => { setUsuarioSel(usuario); setPasswordModalOpen(true); };
  const handleNuevoRol = () => { setRolSel(null); setRolModalOpen(true); };

  const handleSaveUsuario = async (payload) => {
    try {
      if (usuarioSel) {
        await actualizarUsuario(usuarioSel.username, payload);
        swalSuccess('Actualizado', 'El usuario fue actualizado correctamente.');
      } else {
        await crearUsuario(payload);
        swalSuccess('Registrado', 'El usuario fue creado correctamente.');
      }
    } catch (error) {
      swalError('Error', error.response?.data?.message || 'No se pudo guardar el usuario.');
    }
  };

  const handleEliminar = async (usuario) => {
    const result = await swalConfirm(
      '¿Desactivar usuario?',
      `${usuario.nombre_completo || usuario.username} dejará de aparecer para administradores regulares.`,
    );
    if (!result.isConfirmed) return;
    try {
      await eliminarUsuario(usuario.username);
      swalSuccess('Listo', 'Usuario desactivado correctamente.');
    } catch (error) {
      swalError('Error', error.response?.data?.message || 'No se pudo desactivar el usuario.');
    }
  };

  const handleReactivar = async (usuario) => {
    const result = await swalConfirm('¿Reactivar usuario?', `${usuario.username} volverá a tener acceso al sistema.`);
    if (!result.isConfirmed) return;
    try {
      await cambiarEstadoUsuario(usuario.username, true);
      swalSuccess('Listo', 'Usuario reactivado correctamente.');
    } catch (error) {
      if (error.response?.data?.code === 'ROLE_DISABLED') {
        const rescue = await swalConfirm(
          'Rol desactivado',
          'El rol asignado a este usuario está desactivado. ¿Desea abrir la ventana de edición para asignarle un nuevo rol?',
        );
        if (rescue.isConfirmed) {
          setUsuarioSel(usuario);
          setUsuarioModalOpen(true);
        }
        return;
      }
      swalError('Error', error.response?.data?.message || 'No se pudo reactivar el usuario.');
    }
  };

  const handleSaveRol = async (payload) => {
    try {
      if (rolSel) {
        await actualizarRol(rolSel.rol_id, payload);
        swalSuccess('Actualizado', 'El rol fue actualizado correctamente.');
      } else {
        await crearRol(payload);
        swalSuccess('Registrado', 'El rol fue creado correctamente.');
      }
    } catch (error) {
      swalError('Error', error.response?.data?.message || 'No se pudo guardar el rol.');
    }
  };

  const handleEliminarRol = async (rol) => {
    const result = await swalConfirm(
      '¿Eliminar rol?',
      `${rol.nombre} dejará de estar disponible para asignación.`,
    );
    if (!result.isConfirmed) return;
    try {
      await eliminarRol(rol.rol_id);
      swalSuccess('Listo', 'Rol eliminado correctamente.');
    } catch (error) {
      const message = error.response?.data?.message || 'No se pudo eliminar el rol.';
      swalError('Error', message);
    }
  };

  const handleReactivarRol = async (rol) => {
    const result = await swalConfirm('¿Reactivar rol?', `${rol.nombre} volverá a estar disponible para asignación.`);
    if (!result.isConfirmed) return;
    try {
      await cambiarEstadoRol(rol.rol_id, true);
      swalSuccess('Listo', 'Rol reactivado correctamente.');
    } catch (error) {
      swalError('Error', error.response?.data?.message || 'No se pudo reactivar el rol.');
    }
  };

  const canEditUser = (usuario) => {
    if (!puedeEditar || usuario.eliminado) return false;
    if (!isAdminOrSuperAdmin && esRolProtegido(usuario.rol_nombre)) return false;
    return true;
  };

  const canResetPassword = (usuario) => {
    if (usuario.username === user?.username) return true;
    if (!puedeEditar || usuario.eliminado) return false;
    if (normalizarRol(usuario.rol_nombre) === 'super_admin') return false;
    if (esRolProtegido(usuario.rol_nombre) && !isSuperAdmin) return false;
    return true;
  };

  const canDeleteUser = (usuario) => {
    if (!puedeEliminar || usuario.eliminado) return false;
    if (usuario.username === user?.username) return false;
    if (normalizarRol(usuario.rol_nombre) === 'super_admin') return false;
    if (esRolProtegido(usuario.rol_nombre) && !isSuperAdmin) return false;
    return true;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Usuarios</h1>
          <p className="text-sm text-[#bababa]">
            {totalActivos} usuario{totalActivos !== 1 ? 's' : ''} activo{totalActivos !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {puedeCrearEstricto && (
            <button onClick={handleNuevoRol}
              className="flex items-center justify-center gap-2 border border-[#e5ba4a] text-[#e5ba4a] hover:bg-amber-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Shield size={16} /> Nuevo rol
            </button>
          )}
          {puedeCrearEstricto && (
            <button onClick={handleNuevoUsuario}
              className="flex items-center justify-center gap-2 bg-[#e5ba4a] hover:bg-[#d4a93a] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <Plus size={16} /> Nuevo usuario
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="space-y-5">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bababa]" />
              <input
                value={busqueda}
                onChange={(e) => handleBusqueda(e.target.value)}
                placeholder="Buscar por usuario, nombre, correo o rol..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 bg-white outline-none focus:border-[#e5ba4a] transition-colors"
              />
            </div>
            {!isSuperAdmin && (
              <select
                value={estado}
                onChange={(e) => handleEstado(e.target.value)}
                className="text-sm rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[#e5ba4a] transition-colors"
              >
                <option value="activos">Activos</option>
              </select>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600">Usuario</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Email</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Rol</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-center">Estado</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={5} className="text-center py-12 text-gray-400">Cargando...</td></tr>
                  )}
                  {!loading && !usuariosVisibles.length && (
                    <tr><td colSpan={5} className="text-center py-12 text-gray-400">No se encontraron usuarios</td></tr>
                  )}
                  {!loading && usuariosVisibles.map((usuario) => (
                    <tr
                      key={usuario.username}
                      className={[
                        'border-b border-gray-50 hover:bg-gray-50 transition-colors',
                        usuario.eliminado ? 'opacity-60 text-gray-500 bg-gray-50/60' : '',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{usuario.nombre_completo || usuario.username}</p>
                        <p className="text-xs text-[#bababa]">{usuario.username}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{usuario.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-[#9a6b00]">
                          <UserCog size={12} /> {usuario.rol_nombre}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${usuario.eliminado ? BADGE_ESTADO.eliminado : BADGE_ESTADO.activo}`}>
                          {usuario.eliminado ? 'Desactivado' : 'Activo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {canEditUser(usuario) && (
                            <button onClick={() => handleEditarUsuario(usuario)} title="Editar"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                              <Pencil size={15} />
                            </button>
                          )}
                          {canResetPassword(usuario) && (
                            <button onClick={() => handlePassword(usuario)} title="Cambiar contraseña"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#e5ba4a] hover:bg-amber-50 transition-colors">
                              <KeyRound size={15} />
                            </button>
                          )}
                          {canDeleteUser(usuario) && (
                            <button onClick={() => handleEliminar(usuario)} title="Desactivar"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <PowerOff size={15} />
                            </button>
                          )}
                          {isSuperAdmin && usuario.eliminado === 1 && (
                            <button onClick={() => handleReactivar(usuario)} title="Reactivar"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors">
                              <Power size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden self-start">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Roles</h2>
              <p className="text-xs text-[#bababa]">{roles.length} rol{roles.length !== 1 ? 'es' : ''}</p>
            </div>
            <Shield size={18} className="text-[#e5ba4a]" />
          </div>
          <div className="divide-y divide-gray-50">
            {roles.map((rol) => {
              const rolProtegido = esRolProtegido(rol.nombre);
              const rolDesactivado = rol.activo === 0;
              return (
                <div
                  key={rol.rol_id}
                  className={[
                    'px-4 py-3 flex items-center justify-between gap-3',
                    rolDesactivado ? 'opacity-60 text-gray-500 bg-gray-50/60' : '',
                  ].join(' ')}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{rol.nombre}</p>
                      {rolProtegido && (
                        <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          Protegido por el sistema
                        </span>
                      )}
                      {rolDesactivado && (
                        <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                          Desactivado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#bababa] truncate">{rol.descripcion || 'Sin descripción'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {puedeEditar && !rolDesactivado && (
                      <button
                        onClick={() => { if (!rolProtegido) { setRolSel(rol); setRolModalOpen(true); } }}
                        title={rolProtegido ? 'Protegido por el sistema' : 'Editar rol'}
                        disabled={rolProtegido}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 disabled:opacity-40 disabled:hover:text-gray-400 disabled:hover:bg-transparent transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                    {puedeEliminarRoles && !rolDesactivado && (
                      <button
                        onClick={() => { if (!rolProtegido) handleEliminarRol(rol); }}
                        title={rolProtegido ? 'Protegido por el sistema' : 'Eliminar rol'}
                        disabled={rolProtegido}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:hover:text-gray-400 disabled:hover:bg-transparent transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    {isSuperAdmin && rolDesactivado && (
                      <button onClick={() => handleReactivarRol(rol)} title="Reactivar rol"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors">
                        <Power size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <UsuarioModal
        open={usuarioModalOpen}
        onClose={() => setUsuarioModalOpen(false)}
        usuario={usuarioSel}
        roles={roles}
        onSave={handleSaveUsuario}
      />

      <PasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        usuario={usuarioSel}
        isOwnProfile={usuarioSel?.username === user?.username}
        onResetPassword={async (username, passwordNueva) => {
          try {
            await resetPassword(username, passwordNueva);
            swalSuccess('Listo', 'Contraseña actualizada correctamente.');
          } catch (error) {
            swalError('Error', error.response?.data?.message || 'No se pudo actualizar la contraseña.');
            throw error;
          }
        }}
      />

      <RolModal
        open={rolModalOpen}
        onClose={() => setRolModalOpen(false)}
        rol={rolSel}
        permisos={permisos}
        onSave={handleSaveRol}
      />
    </div>
  );
}