// src/types/user/userAuth.ts

export interface ApiResponse<T = undefined> {
  result: 'success' | 'error';
  message: string;
  data?: T;
}

export type VerificationMethod = 'email' | 'phone';

// ─── Phone Authentication Types ──────────────────────────────────────────

// 1. Send OTP
export interface PhoneSendOtpRequest {
  number: string;
  referral_code?: string;
}

export interface PhoneSendOtpResponse {
  number: string;
  is_registered: boolean;
  is_number_verified: boolean;
}

// 2. Verify OTP
export interface PhoneVerifyOtpRequest {
  number: string;
  otp: string;
}

export interface PhoneUser {
  id: number;
  name: string;
  email: string;
  number: string;
  is_number_verified: boolean;
  wallet_balance: string;
  game_coins: number;
  referral_code: string;
}

export interface PhoneVerifyOtpResponse {
  access: string;
  is_new_user: boolean;
  profile_complete: boolean;
  user: PhoneUser;
}

// ─── Legacy Auth Types (for backward compatibility) ─────────────────────

// 1. Send OTP (Registration - Email/Phone with password)
export type SendRegistrationOtpRequest =
  | {
      verification_method: 'email';
      name: string;
      email: string;
      password: string;
      referral_code?: string;
    }
  | {
      verification_method: 'phone';
      name: string;
      number: string;
      password: string;
      referral_code?: string;
    };

// 2. Verify OTP & Create Account
export interface VerifyRegisterRequest {
  identifier: string;
  otp: string;
}

// 3. Login
export interface LoginRequest {
  login_id: string;
  password: string;
}

export interface LoginUser {
  id: number;
  name: string;
  email: string;
  number: string;
  is_number_verified: boolean;      // ← ADD
  wallet_balance: string;
  game_coins: number;
  referral_code: string;
  profile_image_url?: string; 
}

export interface LoginData {
  access: string;
  user: LoginUser;
}

// 4. Forgot Password - Send OTP
export interface ForgotPasswordOtpRequest {
  email: string;
  number: string;
  verification_method: VerificationMethod;
}

// 5. Reset Password
export interface ResetPasswordRequest {
  identifier: string;
  otp: string;
  new_password: string;
}

// ─── Profile Types
export interface ProfileResponse {
  id: number;
  name: string;
  email: string;
  number: string;
  is_number_verified: boolean;
  wallet_balance: string;
  game_coins: number;
  referral_code: string;
  profile_image_url?: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  email?: string;
  number?: string;
  profile_image?: File;
}

export interface ApiErrorResponse {
  result: 'fail';
  message: string;
  data?: any;
}