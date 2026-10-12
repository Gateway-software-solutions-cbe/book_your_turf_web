// src/api/admin/client.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const BASE_URL = (rawBaseUrl ?? '').replace(/\/$/, '');

export const TOKEN_KEY = 'admin_token';
export const ADMIN_KEY = 'admin_user';
export const SIDENAV_KEY = 'admin_sidenav';
export const USER_TOKEN_KEY = 'user_token';
export const USER_KEY = 'user_data';
export const PARTNER_TOKEN_KEY = 'partner_access_token';
export const PARTNER_KEY = 'partner_profile';

console.info(
  `[API] Base URL: ${BASE_URL} (env: ${import.meta.env.VITE_APP_ENV ?? 'default'})`,
);

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(SIDENAV_KEY);
    localStorage.removeItem('turf_admin_token');
    localStorage.removeItem('turf_admin_user');
    localStorage.removeItem('turf_admin_sidenav');
  },
};

export const userTokenStorage = {
  get: (): string | null => localStorage.getItem(USER_TOKEN_KEY),
  set: (token: string): void => {
    localStorage.setItem(USER_TOKEN_KEY, token);
  },
  clear: (): void => {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('turf_user_token');
    localStorage.removeItem('turf_user_data');
  },
};

export const partnerTokenStorage = {
  get: (): string | null => localStorage.getItem(PARTNER_TOKEN_KEY),
  set: (token: string): void => {
    localStorage.setItem(PARTNER_TOKEN_KEY, token);
  },
  clear: (): void => {
    localStorage.removeItem(PARTNER_TOKEN_KEY);
    localStorage.removeItem(PARTNER_KEY);
  },
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? '';
    const isAdminRequest = url.includes('/api/admin/');
    const isPartnerRequest = url.includes('/api/partner/');
    const isUserRequest = url.includes('/api/user/');

    let token: string | null = null;
    if (isAdminRequest) token = tokenStorage.get();
    else if (isPartnerRequest) token = partnerTokenStorage.get();
    else if (isUserRequest) token = userTokenStorage.get();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let redirectingAdminToLogin = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? '';
      const isAdminRequest = url.includes('/api/admin/');
      const isPartnerRequest = url.includes('/api/partner/');

      if (isAdminRequest) {
        tokenStorage.clear();

        // Do not redirect repeatedly when the login request itself is rejected.
        if (
          !redirectingAdminToLogin &&
          window.location.pathname !== '/admin/login'
        ) {
          redirectingAdminToLogin = true;
          window.location.replace('/admin/login');
        }
      } else if (isPartnerRequest) {
        partnerTokenStorage.clear();
        if (!window.location.pathname.startsWith('/partner/login')) {
          window.location.replace('/partner/login');
        }
      } else {
        userTokenStorage.clear();
        if (window.location.pathname !== '/') {
          window.location.replace('/');
        }
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
