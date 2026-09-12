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
          if (res.success) {
            setAdmin(res.admin);
            localStorage.setItem('engineers_day_admin_user', JSON.stringify(res.admin));
          } else {
            logout();
          }
        })
        .catch(() => {
          // If token expired or network fails but we have token, don't immediately clear unless 401
          // but if getMe fails we handle gracefully
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    if (res.success && res.token) {
      setAuthToken(res.token);
      localStorage.setItem('engineers_day_admin_user', JSON.stringify(res.admin));
      setAdmin(res.admin);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('engineers_day_admin_user');
    setAdmin(null);
  };

  const hasValidToken = !!getAuthToken();
  const isAuthenticated = hasValidToken;

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
