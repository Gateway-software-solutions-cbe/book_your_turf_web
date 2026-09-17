// src/api/user/devices.ts
import apiClient from '../admin/client';
import type { ApiResponse } from '../../types/user/userAuth';
import type {
  RegisterDeviceRequest,
  RegisterDeviceResponse,
  DevicesListResponse,
  LogoutDeviceRequest,
  LogoutDeviceResponse,
} from '../../types/user/device';

// ─── Register / Update Current Device ─────────────────────────────────────

/**
 * POST /api/user/device-token/
 * Registers or refreshes the current device's push token and metadata.
 * Body: application/json
 */
export const registerDevice = async (
  payload: RegisterDeviceRequest
): Promise<ApiResponse<RegisterDeviceResponse>> => {
  console.log('📤 POST /api/user/device-token/', payload);
  const response = await apiClient.post<ApiResponse<RegisterDeviceResponse>>(
    '/api/user/device-token/',
    payload
  );
  return response.data;
};

// ─── Devices List ─────────────────────────────────────────────────────────

/**
 * GET /api/user/devices/
 * Lists all devices logged in to the current user account.
 */
export const listDevices = async (): Promise<ApiResponse<DevicesListResponse>> => {
  const response = await apiClient.get<ApiResponse<DevicesListResponse>>(
    '/api/user/devices/'
  );
  return response.data;
};

// ─── Logout a Device ──────────────────────────────────────────────────────

/**
 * POST /api/user/devices/logout/
 * Logs out a specific device (by backend PK).
 * Body: application/json  { device_id: number }
 */
export const logoutDevice = async (
  payload: LogoutDeviceRequest
): Promise<ApiResponse<LogoutDeviceResponse>> => {
  console.log('📤 POST /api/user/devices/logout/', payload);
  const response = await apiClient.post<ApiResponse<LogoutDeviceResponse>>(
    '/api/user/devices/logout/',
    payload
  );
  return response.data;
};