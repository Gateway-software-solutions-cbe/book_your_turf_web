// ─── Auth Types ───────────────────────────────────────────────────────────────
// Derived from real POST /api/admin/login/ response (verified via Swagger Try it out)

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  /**
   * Currently always "admin" — will expand to dynamic roles once
   * the backend ships the roles/permissions endpoints.
   */
  role: string;
}

export interface LoginResponse {
  result: 'success' | 'error';
  message: string;
  data: {
    access: string;
    admin: AdminUser;
  };
}

export interface LoginRequest {
  /** Email or phone number */
  login_id: string;
  password: string;
}

export interface SendOtpRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface VerifyRegisterRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordOtpRequest {
  login_id: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  new_password: string;
}

// ─── Auth Context Shape ────────────────────────────────────────────────────────

export interface AuthContextValue {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}
