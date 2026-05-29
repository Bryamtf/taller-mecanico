import { createContext, useContext, useState } from 'react';
import { getToken, getUser, saveToken, saveUser, removeToken, removeUser } from '@/utils/tokenHelper';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => ({
    token: getToken(),
    user: getUser(),
    isAuthenticated: !!getToken(),
  }));

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

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
