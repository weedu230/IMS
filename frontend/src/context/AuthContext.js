import React, { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ims_user')); }
    catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('ims_token'));

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { employee, token: jwt } = res.data.data;
    localStorage.setItem('ims_token', jwt);
    localStorage.setItem('ims_user', JSON.stringify(employee));
    setToken(jwt);
    setUser(employee);
    return employee;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ims_token');
    localStorage.removeItem('ims_user');
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles) => {
    return user && roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
