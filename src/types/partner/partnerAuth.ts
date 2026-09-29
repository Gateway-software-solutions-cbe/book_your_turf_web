// Request payloads
export interface PartnerSendOtpPayload {
  name: string;
  email: string;
  number: string;
  password: string;
  verification_method: 'email' | 'phone';
}

export interface PartnerVerifyRegisterPayload {
  identifier: string;
  otp: string;
}

export interface PartnerLoginPayload {
  login_id: string; // email or phone
  password: string;
}

export interface PartnerForgotPasswordPayload {
  email: string;
  number: string;
  verification_method: 'email' | 'phone';
}

export interface PartnerResetPasswordPayload {
  identifier: string;
  otp: string;
  new_password: string;
}

export interface PartnerResendOtpPayload {
  identifier: string;
}

// Response shapes
export interface PartnerLoginData {
  access: string;
  profile_complete: boolean;
  partner: PartnerProfile;
}

export interface ApiResponse<T = unknown> {
  result: 'success' | 'error';
  message: string;
  data: T;
}

// ─── Phone Auth ──────────────────────────────────────────────
export interface PartnerPhoneSendOtpPayload {
  number: string;
}

export interface PartnerPhoneSendOtpData {
  number: string;
  is_registered: boolean;
  is_number_verified: boolean;
  enquiry_verified: boolean;
}

export interface PartnerPhoneVerifyOtpPayload {
  number: string;
  otp: string;
}

export interface PartnerPhoneVerifyOtpData {
  access: string;
  is_new_user: boolean;
  profile_complete: boolean;
  partner: PartnerProfile;
}


export interface PartnerProfile {
  id: number;
  name: string;
  email: string | null;
  number: string;
  business_name: string;
  is_verified: boolean;
  is_number_verified: boolean;
  is_active?: boolean;
  profile_complete?: boolean;
  profile_image_url?: string | null;
  turfs?: string[];
}

export interface PartnerCompleteProfilePayload {
  name: string;
  email: string;
  number?: string;
  business_name?: string;
  password?: string;
  profile_image?: File | null;
}

export interface PartnerUpdateProfilePayload {
  name?: string;
  email?: string;
  number?: string;
  business_name?: string;
  password?: string;
  profile_image?: File | null;
}