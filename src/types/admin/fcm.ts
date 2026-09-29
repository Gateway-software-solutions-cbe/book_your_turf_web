// ─── FCM Token Types ───────────────────────────────────────────────────────────
// GET /api/admin/fcm/users/  — active user device tokens
// GET /api/admin/fcm/partners/ — active partner device tokens

export type FcmPlatform = 'android' | 'ios';

export interface UserFcmToken {
  id:          number;
  user_name:   string;
  user_email:  string;
  user_phone:  string;
  token:       string;
  device_id:   string;
  device_name: string;
  platform:    FcmPlatform;
  os_version:  string;
  location:    string;
  is_active:   boolean;
  created_at:  string;
  updated_at:  string;
}

export interface PartnerFcmToken {
  id:               number;
  partner_name:     string;
  partner_email:    string;
  partner_business: string;
  token:            string;
  device_id:        string;
  device_name:      string;
  platform:         FcmPlatform;
  os_version:       string;
  location:         string;
  is_active:        boolean;
  created_at:       string;
  updated_at:       string;
}

export interface FcmListParams {
  page?:      number;
  page_size?: number;
  platform?:  FcmPlatform;
  search?:    string;
}

export interface FcmPaginatedResponse<T> {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  T[];
}