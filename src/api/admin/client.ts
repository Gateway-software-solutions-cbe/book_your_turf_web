import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// ─── Constants ─────────────────────────────────────────────────────────────────

// Strip trailing slash so paths like /api/admin/users/ resolve correctly
// regardless of whether VITE_API_BASE_URL ends with / or not.
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const BASE_URL = rawBaseUrl.replace(/\/$/, '');

export const TOKEN_KEY = 'turf_admin_token';
export const ADMIN_KEY = 'turf_admin_user';
export const USER_TOKEN_KEY = 'turf_user_token';
export const USER_KEY = 'turf_user_data';

// Log which backend is active so you can confirm env mode at a glance
console.info(`[API] Base URL: ${BASE_URL} (env: ${import.meta.env.VITE_APP_ENV ?? 'default'})`);

// ─── Token Helpers ─────────────────────────────────────────────────────────────

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => { localStorage.setItem(TOKEN_KEY, token); },
  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
  },
};

export const userTokenStorage = {
  get: (): string | null => localStorage.getItem(USER_TOKEN_KEY),
  set: (token: string): void => { localStorage.setItem(USER_TOKEN_KEY, token); },
  clear: (): void => {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// ─── Axios Instance ────────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ─── Request Interceptor — Attach Bearer Token ─────────────────────────────────
//
// Admin and user have separate tokens. We pick the right one based on the
// request path — adjust the `/api/admin/` check if your backend uses a
// different prefix convention.

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
//
// Neither admin nor user login responses include a refresh token. On 401, we
// clear the relevant stored credentials and redirect to the relevant login
// page — token from live backend won't work on test backend either, so this
// also self-heals when switching envs.

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