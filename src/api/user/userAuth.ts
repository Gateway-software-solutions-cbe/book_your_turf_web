// src/api/user/userAuth.ts
import client from '../admin/client';
import type {
  ApiResponse,
  SendRegistrationOtpRequest,
  VerifyRegisterRequest,
  LoginRequest,
  LoginData,
  ForgotPasswordOtpRequest,
  ResetPasswordRequest,
  PhoneSendOtpRequest,
  PhoneVerifyOtpRequest,
  PhoneSendOtpResponse,
  PhoneVerifyOtpResponse,
  ProfileResponse,
  ProfileUpdateRequest,
} from '../../types/user/userAuth';

// ─── Phone Authentication ─────────────────────────────────────────────────

/**
 * POST /api/user/send-otp/
 * Send OTP to phone number (phone-only login)
 */
export const phoneSendOtp = (payload: PhoneSendOtpRequest) =>
  client.post<ApiResponse<PhoneSendOtpResponse>>('/api/user/phone/send-otp/', payload);

/**
 * POST /api/user/phone/verify-otp/
 * Phone login/register – verify OTP
 */
export const phoneVerifyOtp = (payload: PhoneVerifyOtpRequest) =>
  client.post<ApiResponse<PhoneVerifyOtpResponse>>('/api/user/phone/verify-otp/', payload);

// ─── Legacy Authentication (for backward compatibility) ──────────────────

/**
 * POST /api/user/send-otp/
 * Send OTP for registration (with name, password)
 */
export const sendRegistrationOtp = (payload: SendRegistrationOtpRequest) =>
  client.post<ApiResponse>('/api/user/send-otp/', payload);

/**
 * POST /api/user/verify-register/
 * Verify OTP & create account
 */
export const verifyRegister = (payload: VerifyRegisterRequest) =>
  client.post<ApiResponse>('/api/user/verify-register/', payload);

/**
 * POST /api/user/login/
 * User login
 */
export const login = (payload: LoginRequest) =>
  client.post<ApiResponse<LoginData>>('/api/user/login/', payload);

/**
 * POST /api/user/forgot-password-otp/
 * Forgot password - send OTP
 */
export const forgotPasswordOtp = (payload: ForgotPasswordOtpRequest) =>
  client.post<ApiResponse>('/api/user/forgot-password-otp/', payload);

/**
 * POST /api/user/reset-password/
 * Reset password
 */
export const resetPassword = (payload: ResetPasswordRequest) =>
  client.post<ApiResponse>('/api/user/reset-password/', payload);

/**
 * GET /api/user/profile/
 * Get user profile
 */
export const getProfile = () =>
  client.get<ApiResponse<ProfileResponse>>('/api/user/profile/');

/**
 * PATCH /api/user/profile/
 * Update user profile (supports multipart/form-data for image upload)
 */
export const updateProfile = (data: ProfileUpdateRequest) => {
  const formData = new FormData();
  if (data.name) formData.append('name', data.name);
  if (data.email) formData.append('email', data.email);
  if (data.profile_image) formData.append('profile_image', data.profile_image);
  
  return client.patch<ApiResponse<ProfileResponse>>('/api/user/profile/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};