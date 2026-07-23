export interface ApiResponse<T = undefined> {
  result: 'success' | 'error';
  message: string;
  data?: T;
}

export type VerificationMethod = 'email' | 'phone';

// 1. Send OTP
export type SendOtpRequest =
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
export type VerifyRegisterRequest =
  | { email: string; otp: string }
  | { number: string; otp: string };

// 3. Resend OTP
export type ResendOtpRequest = { email: string } | { number: string };

// 4. Login
export interface LoginRequest {
  login_id: string; // email or mobile
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

// 5. Forgot Password - Send OTP
export type ForgotPasswordOtpRequest =
  | { verification_method: 'email'; email: string }
  | { verification_method: 'phone'; number: string };

// 6. Reset Password
export type ResetPasswordRequest =
  | { email: string; otp: string; new_password: string }
  | { number: string; otp: string; new_password: string };