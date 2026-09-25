import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('socialstream_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiService.getMe();
      setUser(data.user);
      setError(null);
    } catch (err) {
      console.warn('Failed to restore session:', err?.response?.data?.message || err.message);
      // Remove stale token if unauthorized
      if (err?.response?.status === 401) {
        localStorage.removeItem('socialstream_token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.login(email, password);
      localStorage.setItem('socialstream_token', data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.signup(username, email, password);
      localStorage.setItem('socialstream_token', data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || 'Signup failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('socialstream_token');
      setUser(null);
    }
  };

  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    isAdmin,
    loading,
    error,
    login,
    signup,
    logout,
    refreshUser: fetchCurrentUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
