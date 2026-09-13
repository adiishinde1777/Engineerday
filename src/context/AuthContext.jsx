import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem('engineers_day_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getMe()
        .then((res) => {
          if (res.success && res.admin) {
            setAdmin(res.admin);
            localStorage.setItem('engineers_day_admin_user', JSON.stringify(res.admin));
          } else {
            logout();
          }
        })
        .catch((err) => {
          // If unauthorized or token invalid, clear session immediately
          const msg = (err?.message || '').toLowerCase();
          if (msg.includes('unauthorized') || msg.includes('401') || msg.includes('invalid') || msg.includes('expired')) {
            logout();
          }
        })
        .finally(() => setLoading(false));
    } else {
      // No token present
      setAdmin(null);
      localStorage.removeItem('engineers_day_admin_user');
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    if (res.success && res.token && res.admin) {
      setAuthToken(res.token);
      localStorage.setItem('engineers_day_admin_user', JSON.stringify(res.admin));
      setAdmin(res.admin);
      setLoading(false);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('engineers_day_admin_user');
    setAdmin(null);
  };

  const hasValidToken = Boolean(getAuthToken());
  const isAuthenticated = Boolean(admin && hasValidToken);

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
