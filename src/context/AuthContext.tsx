import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginAdmin } from '../api/admin/auth';
import { tokenStorage, ADMIN_KEY } from '../api/admin/client';
import type { AdminUser, AuthContextValue, LoginRequest } from '../types/admin/auth';

// ─── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true on mount — hydrating from storage

  // ── Hydrate from localStorage on app load ──────────────────────────────────
  useEffect(() => {
    const storedToken = tokenStorage.get();
    const storedAdmin = localStorage.getItem(ADMIN_KEY);

    if (storedToken && storedAdmin) {
      try {
        setToken(storedToken);
        setAdmin(JSON.parse(storedAdmin) as AdminUser);
      } catch {
        // Corrupted storage — clear and start fresh
        tokenStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    const response = await loginAdmin(credentials);

    if (response.result !== 'success') {
      throw new Error(response.message || 'Login failed');
    }

    const { access, admin: adminUser } = response.data;

    // Persist to storage so the interceptor & page reloads work
    tokenStorage.set(access);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(adminUser));

    setToken(access);
    setAdmin(adminUser);
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback((): void => {
    tokenStorage.clear();
    setToken(null);
    setAdmin(null);
  }, []);

  const value: AuthContextValue = {
    admin,
    token,
    isAuthenticated: !!token && !!admin,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
};
