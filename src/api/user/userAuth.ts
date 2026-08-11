// src/api/userAuth.ts
import client from '../admin/client';
import type {
  ApiResponse,
  SendOtpRequest,
  VerifyRegisterRequest,
  ResendOtpRequest,
  LoginRequest,
  LoginData,
  ForgotPasswordOtpRequest,
  ResetPasswordRequest,
} from '../../types/user/userAuth';

export const sendOtp = (payload: SendOtpRequest) =>
  client.post<ApiResponse>('/api/user/send-otp/', payload);

export const verifyRegister = (payload: VerifyRegisterRequest) =>
  client.post<ApiResponse>('/api/user/verify-register/', payload);

export const resendOtp = (payload: ResendOtpRequest) =>
  client.post<ApiResponse>('/api/user/resend-otp/', payload);

export const login = (payload: LoginRequest) =>
  client.post<ApiResponse<LoginData>>('/api/user/login/', payload);

export const forgotPasswordOtp = (payload: ForgotPasswordOtpRequest) =>
  client.post<ApiResponse>('/api/user/forgot-password-otp/', payload);

export const resetPassword = (payload: ResetPasswordRequest) =>
  client.post<ApiResponse>('/api/user/reset-password/', payload);