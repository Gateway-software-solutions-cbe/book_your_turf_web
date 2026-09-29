import apiClient from './client';
import type {
  LoginRequest,
  LoginResponse,
  SendOtpRequest,
  VerifyRegisterRequest,
  ForgotPasswordOtpRequest,
  ResetPasswordRequest,
  ResendOtpRequest,
} from '../../types/admin/auth';

// ─── Auth API ──────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/login/
 * Accepts email or phone as login_id.
 * Returns access token + admin profile.
 */
export const loginAdmin = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/admin/login/', data);
  return response.data;
};

/**
 * POST /api/admin/send-otp/
 * Step 1 of admin registration — sends OTP to provided email.
 */
export const sendRegistrationOtp = async (data: SendOtpRequest): Promise<string> => {
  const response = await apiClient.post<string>('/api/admin/send-otp/', data);
  return response.data;
};

/**
 * POST /api/admin/verify-register/
 * Step 2 of admin registration — verifies OTP and creates the admin account.
 */
export const verifyAndRegister = async (data: VerifyRegisterRequest): Promise<string> => {
  const response = await apiClient.post<string>('/api/admin/verify-register/', data);
  return response.data;
};

/**
 * POST /api/admin/resend-otp/
 * Resend OTP for registration.
 */
export const resendOtp = async (data: ResendOtpRequest): Promise<string> => {
  const response = await apiClient.post<string>('/api/admin/resend-otp/', data);
  return response.data;
};

/**
 * POST /api/admin/forgot-password-otp/
 * Send OTP for password reset.
 */
export const forgotPasswordOtp = async (data: ForgotPasswordOtpRequest): Promise<string> => {
  const response = await apiClient.post<string>('/api/admin/forgot-password-otp/', data);
  return response.data;
};

/**
 * POST /api/admin/reset-password/
 * Reset password with OTP.
 */
export const resetPassword = async (data: ResetPasswordRequest): Promise<string> => {
  const response = await apiClient.post<string>('/api/admin/reset-password/', data);
  return response.data;
};