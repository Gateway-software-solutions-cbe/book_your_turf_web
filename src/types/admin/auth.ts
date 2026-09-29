// src/types/admin/auth.ts
// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface SideNavItem {
  title: string;
  path: string;
  icon: string;
}

export interface LoginResponse {
  result: 'success' | 'error';
  message: string;
  data: {
    access: string;
    admin: AdminUser;
    sidenav?: SideNavItem[]; // Added: dynamic sidebar from login
  };
}

export interface SideNavResponse {
  result: 'success' | 'error';
  message: string;
  data: {
    items: SideNavItem[];
  };
}

export interface LoginRequest {
  login_id: string;
  password: string;
}

// ─── Admin Registration Types ────────────────────────────────────────────────

export interface SendOtpRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
}

export interface VerifyRegisterRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ForgotPasswordOtpRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  new_password: string;
}

// ─── Admin Roles ─────────────────────────────────────────────────────────────

export type AdminRole = 'super_admin' | 'admin' | 'cpadmin' | 'accounts' | 'userbooking';

export const ADMIN_ROLES: AdminRole[] = ['super_admin', 'admin', 'cpadmin', 'accounts', 'userbooking'];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  cpadmin: 'Channel Partner Admin',
  accounts: 'Accounts Manager',
  userbooking: 'Booking Manager',
};

export const ADMIN_ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: 'bg-danger',
  admin: 'bg-primary',
  cpadmin: 'bg-info text-dark',
  accounts: 'bg-warning text-dark',
  userbooking: 'bg-success',
};

// ─── Auth Context Shape ──────────────────────────────────────────────────────

export interface AuthContextValue {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}