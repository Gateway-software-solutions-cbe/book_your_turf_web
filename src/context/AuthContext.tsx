// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginAdmin } from '../api/admin/auth';
import { fetchSideNav } from '../api/admin/sidenav';
import { tokenStorage, ADMIN_KEY, SIDENAV_KEY } from '../api/admin/client';
import type { AdminUser, AuthContextValue, LoginRequest, SideNavItem } from '../types/admin/auth';

// ─── Context ───────────────────────────────────────────────────────────────────

interface ExtendedAuthContextValue extends AuthContextValue {
  sideNav: SideNavItem[];
  refreshSideNav: () => Promise<void>;
}

const AuthContext = createContext<ExtendedAuthContextValue | null>(null);

// ─── Helper to clean old storage keys ────────────────────────────────────────

const cleanOldStorageKeys = () => {
  const oldKeys = [
    'turf_admin_token',
    'turf_admin_user', 
    'turf_admin_sidenav',
    'turf_user_token',
    'turf_user_data'
  ];
  oldKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
    }
  });
};

// ─── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sideNav, setSideNav] = useState<SideNavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Hydrate from localStorage on app load ──────────────────────────────────
  useEffect(() => {
    // Clean up old keys on app start
    cleanOldStorageKeys();
    
    const storedToken = tokenStorage.get();
    const storedAdmin = localStorage.getItem(ADMIN_KEY);
    const storedSideNav = localStorage.getItem(SIDENAV_KEY);

    if (storedToken && storedAdmin) {
      try {
        setToken(storedToken);
        setAdmin(JSON.parse(storedAdmin) as AdminUser);
        if (storedSideNav) {
          setSideNav(JSON.parse(storedSideNav) as SideNavItem[]);
        }
      } catch {
        tokenStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  // ── Refresh Sidebar ──────────────────────────────────────────────────────
  const refreshSideNav = useCallback(async (): Promise<void> => {
    try {
      const navItems = await fetchSideNav();
      setSideNav(navItems);
      localStorage.setItem(SIDENAV_KEY, JSON.stringify(navItems));
    } catch (error) {
      console.error('Failed to fetch sidebar navigation:', error);
    }
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    // Clean old keys before login
    cleanOldStorageKeys();
    
    const response = await loginAdmin(credentials);

    if (response.result !== 'success') {
      throw new Error(response.message || 'Login failed');
    }

    const { access, admin: adminUser, sidenav } = response.data;

    // Persist to storage
    tokenStorage.set(access);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(adminUser));
    
    // Store sidebar navigation - either from login response or fetch separately
    let navItems = sidenav ?? [];
    
    if (navItems.length === 0) {
      // If no sidebar in login response, fetch it separately
      try {
        console.log('Fetching sidebar from /api/admin/sidenav/');
        const fetchedNav = await fetchSideNav();
        navItems = fetchedNav;
        console.log('Fetched sidebar items:', navItems);
      } catch (error) {
        console.error('Failed to fetch sidebar navigation:', error);
      }
    }
    
    setSideNav(navItems);
    localStorage.setItem(SIDENAV_KEY, JSON.stringify(navItems));

    setToken(access);
    setAdmin(adminUser);
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback((): void => {
    // Clear all admin-related storage
    tokenStorage.clear();
    
    // Clean up any remaining old keys
    cleanOldStorageKeys();
    
    // Reset state
    setToken(null);
    setAdmin(null);
    setSideNav([]);
    
    // Navigate to login page
    window.location.href = '/';
  }, []);

  const value: ExtendedAuthContextValue = {
    admin,
    token,
    sideNav,
    isAuthenticated: !!token && !!admin,
    isLoading,
    login,
    logout,
    refreshSideNav,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export const useAuth = (): ExtendedAuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
};