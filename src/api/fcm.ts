import apiClient from './client';
import type {
  UserFcmToken, PartnerFcmToken,
  FcmListParams, FcmPaginatedResponse,
} from '../types/fcm';

// ─── Unwrap helper ─────────────────────────────────────────────────────────────
// Handles both wrapped { result, data: { count, results } }
// and plain DRF paginated { count, results }
const unwrap = <T>(body: unknown): FcmPaginatedResponse<T> => {
  const b = body as Record<string, unknown>;
  if (b?.data && (b.data as Record<string, unknown>)?.results !== undefined) {
    return b.data as unknown as FcmPaginatedResponse<T>;
  }
  return b as unknown as FcmPaginatedResponse<T>;
};

// ─── User FCM Tokens ───────────────────────────────────────────────────────────

/** GET /api/admin/fcm/users/ */
export const listUserFcmTokens = async (
  params?: FcmListParams,
): Promise<FcmPaginatedResponse<UserFcmToken>> => {
  const res = await apiClient.get('/api/admin/fcm/users/', { params });
  return unwrap<UserFcmToken>(res.data);
};

/** GET /api/admin/fcm/users/{id}/ */
export const getUserFcmToken = async (id: number): Promise<UserFcmToken> => {
  const res = await apiClient.get(`/api/admin/fcm/users/${id}/`);
  const b = res.data as Record<string, unknown>;
  return (b?.data ?? b) as UserFcmToken;
};

// ─── Partner FCM Tokens ────────────────────────────────────────────────────────

/** GET /api/admin/fcm/partners/ */
export const listPartnerFcmTokens = async (
  params?: FcmListParams,
): Promise<FcmPaginatedResponse<PartnerFcmToken>> => {
  const res = await apiClient.get('/api/admin/fcm/partners/', { params });
  return unwrap<PartnerFcmToken>(res.data);
};

/** GET /api/admin/fcm/partners/{id}/ */
export const getPartnerFcmToken = async (id: number): Promise<PartnerFcmToken> => {
  const res = await apiClient.get(`/api/admin/fcm/partners/${id}/`);
  const b = res.data as Record<string, unknown>;
  return (b?.data ?? b) as PartnerFcmToken;
};