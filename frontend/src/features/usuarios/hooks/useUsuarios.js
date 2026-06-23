import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import * as usuariosService from '../services/usuariosService';
import * as rolesService from '../services/rolesService';
import * as permisosService from '../services/permisosService';

export function useUsuarios() {
  const { user } = useAuth();
  const normalizarRol = (rol) => String(rol || '').trim().toLowerCase();
  const isSuperAdmin = normalizarRol(user?.rol_nombre) === 'super_admin' || normalizarRol(user?.rol) === 'super_admin';
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState(() => (isSuperAdmin ? 'todos' : 'activos'));
  const [loading, setLoading] = useState(false);

  const busquedaDebounced = useDebounce(busqueda, 400);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usuariosService.getUsuarios({
        estado,
        busqueda: busquedaDebounced,
      });
      setUsuarios(data.usuarios ?? []);
    } finally {
      setLoading(false);
    }
  }, [estado, busquedaDebounced]);

  const fetchCatalogos = useCallback(async () => {
    const [rolesData, permisosData] = await Promise.all([
      rolesService.getRoles({ estado: isSuperAdmin ? 'todos' : 'activos' }),
      permisosService.getPermisos(),
    ]);
    setRoles(rolesData.roles ?? []);
    setPermisos(permisosData.permisos ?? []);
  }, [isSuperAdmin]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);
  useEffect(() => { fetchCatalogos(); }, [fetchCatalogos]);
  useEffect(() => {
    if (isSuperAdmin && estado === 'activos') setEstado('todos');
  }, [isSuperAdmin, estado]);

  const handleBusqueda = (value) => setBusqueda(value);
  const handleEstado = (value) => setEstado(value);

  const crearUsuario = async (data) => {
    await usuariosService.createUsuario(data);
    await fetchUsuarios();
  };

  const actualizarUsuario = async (username, data) => {
    await usuariosService.updateUsuario(username, data);
    await fetchUsuarios();
  };

  const eliminarUsuario = async (username) => {
    await usuariosService.deleteUsuario(username);
    await fetchUsuarios();
  };

  const cambiarEstadoUsuario = async (username, activo) => {
    await usuariosService.cambiarEstadoUsuario(username, activo);
    await fetchUsuarios();
  };

  const resetPassword = async (username, passwordNueva) => {
    await usuariosService.resetPasswordUsuario(username, passwordNueva);
  };

  const crearRol = async (data) => {
    await rolesService.createRol(data);
    await fetchCatalogos();
  };

  const actualizarRol = async (rolId, data) => {
    await rolesService.updateRol(rolId, data);
    await fetchCatalogos();
    await fetchUsuarios();
  };

  const eliminarRol = async (rolId) => {
    await rolesService.deleteRol(rolId);
    await fetchCatalogos();
  };

  const cambiarEstadoRol = async (rolId, activo) => {
    await rolesService.cambiarEstadoRol(rolId, activo);
    await fetchCatalogos();
  };

  return {
    usuarios,
    roles,
    permisos,
    busqueda,
    estado,
    loading,
    handleBusqueda,
    handleEstado,
    fetchUsuarios,
    fetchCatalogos,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    cambiarEstadoUsuario,
    resetPassword,
    crearRol,
    actualizarRol,
    eliminarRol,
    cambiarEstadoRol,
  };
}
