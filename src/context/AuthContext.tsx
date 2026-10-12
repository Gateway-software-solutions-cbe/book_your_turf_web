// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { loginAdmin } from '../api/admin/auth';
import { fetchSideNav } from '../api/admin/sidenav';
import { tokenStorage, ADMIN_KEY, SIDENAV_KEY } from '../api/admin/client';
import type {
  AdminUser,
  AuthContextValue,
  LoginRequest,
  SideNavItem,
} from '../types/admin/auth';

interface ExtendedAuthContextValue extends AuthContextValue {
  sideNav: SideNavItem[];
  refreshSideNav: () => Promise<void>;
}

const AuthContext = createContext<ExtendedAuthContextValue | null>(null);

const cleanOldStorageKeys = () => {
  [
    'turf_admin_token',
    'turf_admin_user',
    'turf_admin_sidenav',
    'turf_user_token',
    'turf_user_data',
  ].forEach((key) => localStorage.removeItem(key));
};

/**
 * Returns the JWT expiration time in milliseconds.
 * Returns null for opaque/non-JWT tokens; those are validated by the API.
 */
const getJwtExpiryMs = (token: string): number | null => {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;

    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const isJwtExpired = (token: string): boolean => {
  const expiry = getJwtExpiryMs(token);
  // A small safety margin avoids treating a token as valid right at expiry.
  return expiry !== null && expiry <= Date.now() + 5000;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sideNav, setSideNav] = useState<SideNavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const clearAdminSession = useCallback(() => {
    tokenStorage.clear();
    cleanOldStorageKeys();
    setToken(null);
    setAdmin(null);
    setSideNav([]);
  }, []);

  const redirectToLogin = useCallback(() => {
    clearAdminSession();
    if (window.location.pathname !== '/admin/login') {
      // replace() prevents the current protected page from remaining as the
      // active history entry after logout/session expiry.
      window.location.replace('/admin/login');
    }
  }, [clearAdminSession]);

  // Restore a valid admin session on a normal page load. Never restore an
  // expired JWT from localStorage.
  useEffect(() => {
    cleanOldStorageKeys();

    const storedToken = tokenStorage.get();
    const storedAdmin = localStorage.getItem(ADMIN_KEY);
    const storedSideNav = localStorage.getItem(SIDENAV_KEY);

    if (storedToken && storedAdmin && !isJwtExpired(storedToken)) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin) as AdminUser;
        const parsedSideNav = storedSideNav
          ? (JSON.parse(storedSideNav) as SideNavItem[])
          : [];

        setToken(storedToken);
        setAdmin(parsedAdmin);
        setSideNav(parsedSideNav);
      } catch {
        tokenStorage.clear();
      }
    } else if (storedToken || storedAdmin) {
      tokenStorage.clear();
    }

    setIsLoading(false);
  }, []);

  // If the JWT has a known expiry, end the session at that time even when
  // the user is not making API requests.
  useEffect(() => {
    if (!token) return;

    const expiry = getJwtExpiryMs(token);
    if (expiry === null) return;

    const remaining = expiry - Date.now();
    if (remaining <= 5000) {
      redirectToLogin();
      return;
    }

    const timer = window.setTimeout(redirectToLogin, remaining);
    return () => window.clearTimeout(timer);
  }, [token, redirectToLogin]);

  // Requirement: browser Back/Forward while an admin session is active must
  // not restore a previous protected page. End the session and go to login.
  useEffect(() => {
    if (!token || !admin) return;

    const handlePopState = () => {
      redirectToLogin();
    };

    const handlePageShow = () => {
      const path = window.location.pathname;
      const isProtectedAdminPath =
        path === '/welcome' || (path.startsWith('/admin') && path !== '/admin/login');

      const storedToken = tokenStorage.get();
      const storedAdmin = localStorage.getItem(ADMIN_KEY);

      if (
        isProtectedAdminPath &&
        (!storedToken || !storedAdmin || isJwtExpired(storedToken))
      ) {
        redirectToLogin();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [token, admin, redirectToLogin]);

  const refreshSideNav = useCallback(async (): Promise<void> => {
    try {
      const navItems = await fetchSideNav();
      setSideNav(navItems);
      localStorage.setItem(SIDENAV_KEY, JSON.stringify(navItems));
    } catch (error) {
      console.error('Failed to refresh admin sidebar navigation:', error);
    }
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    cleanOldStorageKeys();

    const response = await loginAdmin(credentials);
    if (response.result !== 'success') {
      throw new Error(response.message || 'Login failed');
    }

    const { access, admin: adminUser, sidenav } = response.data;

    if (!access || isJwtExpired(access)) {
      throw new Error('Login returned an invalid or expired session. Please try again.');
    }

    tokenStorage.set(access);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(adminUser));

    let navItems = sidenav ?? [];
    if (navItems.length === 0) {
      try {
        navItems = await fetchSideNav();
      } catch (error) {
        console.error('Failed to fetch sidebar navigation:', error);
      }
    }

    setSideNav(navItems);
    localStorage.setItem(SIDENAV_KEY, JSON.stringify(navItems));
    setToken(access);
    setAdmin(adminUser);
  }, []);

  const logout = useCallback((): void => {
    clearAdminSession();
    // Admin logout must go to the admin login route, not the public landing page.
    window.location.replace('/admin/login');
  }, [clearAdminSession]);

  const value: ExtendedAuthContextValue = {
    admin,
    token,
    sideNav,
    isAuthenticated: !!token && !!admin && !isJwtExpired(token),
    isLoading,
    login,
    logout,
    refreshSideNav,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): ExtendedAuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
};
