// ─── Device Platform ─────────────────────────────────────────────────────
export type PartnerDevicePlatform = "android" | "ios" | "web";

// ─── Register Device (POST /api/partner/profile/device-token/) ───────────
export interface RegisterPartnerDeviceRequest {
  token: string;             // FCM token (dummy on web)
  device_id: string;         // client-generated
  device_name: string;       // "Chrome on Windows"
  platform: PartnerDevicePlatform;
  os_version: string;        // "Windows 11"
  location?: string;         // "Chennai, IN"
}

export interface RegisterPartnerDeviceResponse {
  id: number;
  device_id: string;
  [key: string]: any;
}

// ─── Device List (GET /api/partner/profile/devices/) ─────────────────────
export interface PartnerDevice {
  id: number;                         // backend PK — used for logout
  device_id: string;
  device_name: string;
  platform: PartnerDevicePlatform;
  os_version: string;
  location?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
  [key: string]: any;
}

export type PartnerDevicesListResponse = PartnerDevice[];

// ─── Logout Device (POST /api/partner/profile/devices/logout/) ───────────
export interface LogoutPartnerDeviceRequest {
  device_id: number;                  // backend PK
}

export interface LogoutPartnerDeviceResponse {
  [key: string]: any;
}