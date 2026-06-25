import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getToken, getUser, saveToken, saveUser, removeToken, removeUser } from '@/utils/tokenHelper';

const AuthContext = createContext(null);
const normalizarRol = (rol) => String(rol || '').trim().toLowerCase();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => ({
    token: getToken(),
    user: getUser(),
    isAuthenticated: !!getToken(),
  }));

  useEffect(() => {
    if (!auth.token) return;
    api.get('/auth/verificar')
      .then((res) => {
        const user = res.data?.data?.usuario;
        if (!user) return;
        saveUser(user);
        setAuth((current) => ({ ...current, user, isAuthenticated: true }));
      })
      .catch(() => {
        removeToken();
        removeUser();
        setAuth({ token: null, user: null, isAuthenticated: false });
      });
  }, [auth.token]);

  const login = (token, user) => {
    saveToken(token);
    saveUser(user);
    setAuth({ token, user, isAuthenticated: true });
  };

  const logout = () => {
    removeToken();
    removeUser();
    setAuth({ token: null, user: null, isAuthenticated: false });
  };

  const can = (permisoNombre, accion = 'puede_ver') => {
    const user = auth.user;
    if (normalizarRol(user?.rol_nombre) === 'super_admin' || normalizarRol(user?.rol) === 'super_admin') return true;
    const permiso = user?.permisos?.find((item) => item.nombre === permisoNombre);
    return !!permiso?.[accion];
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
