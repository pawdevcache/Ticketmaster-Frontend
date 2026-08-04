import { createContext, useContext, useState } from 'react';
import { api } from '../../services/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));

  const persist = (u, token) => {
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('token', token);
    setUser(u);
  };

  const login = async (email, password) => {
    const { token, user } = await api.login({ email, password });
    persist(user || { email }, token);
  };

  const register = async (name, email, password) => {
    await api.register({ name, email, password });
    await login(email, password); // auto sign-in after registering
  };

  const logout = () => {
    api.logout().catch(() => {}); // revoke the session server-side, best-effort
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  // setSession persists a session from an already-fetched { user, token }, so a
  // shared login page can decide the role first and then apply the session.
  return <Ctx.Provider value={{ user, login, register, logout, setSession: persist }}>{children}</Ctx.Provider>;
}
