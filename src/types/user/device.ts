// src/types/user/device.ts

// ─── Device Registration (POST /api/user/device-token/) ───────────────────
export type DevicePlatform = 'android' | 'ios' | 'web';

export interface RegisterDeviceRequest {
  token: string;             // FCM token (push) — can be dummy on web
  device_id: string;         // client-generated unique ID
  device_name: string;       // "Chrome on Windows" / "motorola moto g64"
  platform: DevicePlatform;
  os_version: string;        // "Windows 11", "Android 15"
  location?: string;         // "Chennai, IN"
}

export interface RegisterDeviceResponse {
  id: number;
  device_id: string;
  [key: string]: any;
}

// ─── Devices List (GET /api/user/devices/) ────────────────────────────────
export interface UserDevice {
  id: number;                        // backend PK — used for logout
  device_id: string;                 // client-generated ID (matches localStorage)
  device_name: string;
  platform: DevicePlatform;
  os_version: string;
  location?: string;
  is_active?: boolean;
  last_active?: string;              // ISO timestamp
  created_at: string;                // ISO timestamp
  device_identifier?: string;        // e.g. "AND-V1TD..." (truncated)
  [key: string]: any;
}

export type DevicesListResponse = UserDevice[];

// ─── Logout Device (POST /api/user/devices/logout/) ───────────────────────
export interface LogoutDeviceRequest {
  device_id: number;                 // backend PK (integer)
}

export interface LogoutDeviceResponse {
  [key: string]: any;
}