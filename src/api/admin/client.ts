// src/api/admin/client.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// ─── Constants ─────────────────────────────────────────────────────────────────

// Strip trailing slash so paths like /api/admin/users/ resolve correctly
// regardless of whether VITE_API_BASE_URL ends with / or not.
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const BASE_URL = rawBaseUrl.replace(/\/$/, '');

// Use consistent key names - remove duplicates
export const TOKEN_KEY = 'admin_token';
export const ADMIN_KEY = 'admin_user';
export const SIDENAV_KEY = 'admin_sidenav';
export const USER_TOKEN_KEY = 'user_token';
export const USER_KEY = 'user_data';

// Log which backend is active so you can confirm env mode at a glance
console.info(`[API] Base URL: ${BASE_URL} (env: ${import.meta.env.VITE_APP_ENV ?? 'default'})`);

// ─── Token Helpers ─────────────────────────────────────────────────────────────

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => { localStorage.setItem(TOKEN_KEY, token); },
  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(SIDENAV_KEY);
    // Remove any old keys that might exist
    localStorage.removeItem('turf_admin_token');
    localStorage.removeItem('turf_admin_user');
    localStorage.removeItem('turf_admin_sidenav');
  },
};

export const userTokenStorage = {
  get: (): string | null => localStorage.getItem(USER_TOKEN_KEY),
  set: (token: string): void => { localStorage.setItem(USER_TOKEN_KEY, token); },
  clear: (): void => {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Remove any old keys
    localStorage.removeItem('turf_user_token');
    localStorage.removeItem('turf_user_data');
  },
};

// ─── Axios Instance ────────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ─── Request Interceptor — Attach Bearer Token ─────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const isAdminRequest = config.url?.includes('/api/admin/');
    const token = isAdminRequest ? tokenStorage.get() : userTokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor — Handle 401 ────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isAdminRequest = error.config?.url?.includes('/api/admin/');
      if (isAdminRequest) {
        tokenStorage.clear();
        if (!window.location.pathname.includes('/admin/login')) {
          window.location.href = '/admin/login';
        }
      } else {
        userTokenStorage.clear();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;