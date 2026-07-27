import { createContext, useContext, useEffect, useState } from 'react';
import { adminApi } from './api';

const Ctx = createContext(null);
export const useAdmin = () => useContext(Ctx);

// Admin session is kept entirely separate from the user session: its own token
// (admin_token) and its own stored profile, so signing in as admin never
// affects — or is affected by — an ordinary user login.
export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(() => JSON.parse(localStorage.getItem('admin') || 'null'));
  const [ready, setReady] = useState(false);

  // Verify a stored token on load; drop it if the server rejects it.
  useEffect(() => {
    if (localStorage.getItem('admin_token')) {
      adminApi.me().then((u) => setAdmin(u)).catch(logout).finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  // apply persists an admin session from an already-fetched token + user. The
  // shared login page uses this after /api/login reports role === 'admin'.
  const apply = (token, user) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin', JSON.stringify(user));
    setAdmin(user);
  };

  const login = async (email, password) => {
    const { token, user } = await adminApi.login(email, password);
    apply(token, user);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin');
    setAdmin(null);
  };

  return <Ctx.Provider value={{ admin, ready, login, apply, logout }}>{children}</Ctx.Provider>;
}
