// src/types/userAuth.ts
export interface ApiResponse<T = undefined> {
  result: 'success' | 'error';
  message: string;
  data?: T;
}

export type VerificationMethod = 'email' | 'phone';

// 1. Send OTP - Matches the API exactly
export type SendOtpRequest = {
  name: string;
  email?: string;
  number?: string;
  password: string;
  referral_code?: string;
  verification_method: VerificationMethod;
};

// 2. Verify OTP & Create Account - identifier is the actual email or number (string)
export interface VerifyRegisterRequest {
  identifier: string; // The actual email address or phone number as a string
  otp: string;
}

// 3. Resend OTP - identifier is the actual email or number (string)
export interface ResendOtpRequest {
  identifier: string; // The actual email address or phone number as a string
}

// 4. Login
export interface LoginRequest {
  login_id: string;
  password: string;
}

export interface LoginUser {
  id: number;
  name: string;
  email: string;
  number: string;
  wallet_balance: string;
  game_coins: number;
  referral_code: string;
}

export interface LoginData {
  access: string;
  user: LoginUser;
}

// 5. Forgot Password - Send OTP - API expects email, number, and verification_method
export type ForgotPasswordOtpRequest = 
  | { verification_method: 'email'; email: string }
  | { verification_method: 'phone'; number: string };

// 6. Reset Password - identifier can be email OR phone number
export interface ResetPasswordRequest {
  identifier: string; // The actual email address OR phone number
  otp: string;
  new_password: string;
}