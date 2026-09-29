// src/api/partner/auth.ts
import client from '../admin/client';
import type {
  PartnerSendOtpPayload,
  PartnerVerifyRegisterPayload,
  PartnerLoginPayload,
  PartnerForgotPasswordPayload,
  PartnerResetPasswordPayload,
  PartnerResendOtpPayload,
  ApiResponse,
  PartnerLoginData,
  PartnerPhoneSendOtpPayload,
  PartnerPhoneSendOtpData,
  PartnerPhoneVerifyOtpPayload,
  PartnerPhoneVerifyOtpData,
  PartnerProfile,
  PartnerCompleteProfilePayload,
  PartnerUpdateProfilePayload,
} from '../../types/partner/partnerAuth';

const PARTNER_BASE = '/api/partner';

export const partnerAuthApi = {
  sendOtp: async (payload: PartnerSendOtpPayload) => {
    const { data } = await client.post<ApiResponse>(
      `${PARTNER_BASE}/send-otp/`,
      payload,
    );
    return data;
  },

  verifyRegister: async (payload: PartnerVerifyRegisterPayload) => {
    const { data } = await client.post<ApiResponse>(
      `${PARTNER_BASE}/verify-register/`,
      payload,
    );
    return data;
  },

  resendOtp: async (payload: PartnerResendOtpPayload) => {
    const { data } = await client.post<ApiResponse>(
      `${PARTNER_BASE}/resend-otp/`,
      payload,
    );
    return data;
  },

  login: async (payload: PartnerLoginPayload) => {
    const { data } = await client.post<ApiResponse<PartnerLoginData>>(
      `${PARTNER_BASE}/login/`,
      payload,
    );
    return data;
  },

  forgotPasswordOtp: async (payload: PartnerForgotPasswordPayload) => {
    const { data } = await client.post<ApiResponse>(
      `${PARTNER_BASE}/forgot-password-otp/`,
      payload,
    );
    return data;
  },

  resetPassword: async (payload: PartnerResetPasswordPayload) => {
    const { data } = await client.post<ApiResponse>(
      `${PARTNER_BASE}/reset-password/`,
      payload,
    );
    return data;
  },

  // ─── Phone Auth ────────────────────────────────────────────
  phoneSendOtp: async (payload: PartnerPhoneSendOtpPayload) => {
    const { data } = await client.post<ApiResponse<PartnerPhoneSendOtpData>>(
      `${PARTNER_BASE}/phone/send-otp/`,
      payload,
    );
    return data;
  },

  phoneVerifyOtp: async (payload: PartnerPhoneVerifyOtpPayload) => {
    const { data } = await client.post<ApiResponse<PartnerPhoneVerifyOtpData>>(
      `${PARTNER_BASE}/phone/verify-otp/`,
      payload,
    );
    return data;
  },

  // ─── Profile ───────────────────────────────────────────────
  getProfile: async () => {
    const { data } = await client.get<ApiResponse<PartnerProfile>>(
      `${PARTNER_BASE}/profile/me/`,
    );
    return data;
  },

  updateProfile: async (payload: PartnerUpdateProfilePayload) => {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        fd.append(k, v as any);
      }
    });

    const { data } = await client.patch<ApiResponse<PartnerProfile>>(
      `${PARTNER_BASE}/profile/me/`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  deactivateAccount: async (reason: string) => {
  const { data } = await client.post<ApiResponse>(
    `${PARTNER_BASE}/profile/deactivate/`,
    { reason },
  );
  return data;
},
};