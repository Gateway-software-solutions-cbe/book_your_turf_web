import client from "../admin/client";
import type {
  PartnerDevice,
  PartnerDevicesListResponse,
  LogoutPartnerDeviceRequest,
  LogoutPartnerDeviceResponse,
  RegisterPartnerDeviceRequest,
  RegisterPartnerDeviceResponse,
} from "../../types/partner/device";

interface ApiResponse<T = unknown> {
  result: "success" | "error";
  message: string;
  data: T;
}

const PARTNER_PROFILE = "/api/partner/profile";

/**
 * GET /api/partner/profile/devices/
 * Lists all devices logged into the current partner account.
 */
export const listPartnerDevices = async (): Promise<
  ApiResponse<PartnerDevicesListResponse>
> => {
  const response = await client.get<ApiResponse<PartnerDevicesListResponse>>(
    `${PARTNER_PROFILE}/devices/`,
  );
  return response.data;
};

/**
 * POST /api/partner/profile/devices/logout/
 * Logs out a specific partner device (by backend PK).
 */
export const logoutPartnerDevice = async (
  payload: LogoutPartnerDeviceRequest,
): Promise<ApiResponse<LogoutPartnerDeviceResponse>> => {
  const response = await client.post<ApiResponse<LogoutPartnerDeviceResponse>>(
    `${PARTNER_PROFILE}/devices/logout/`,
    payload,
  );
  return response.data;
};

/**
 * POST /api/partner/profile/device-token/
 * Registers (or refreshes) the current device's FCM token + metadata.
 * Called automatically on login.
 */
export const registerPartnerDevice = async (
  payload: RegisterPartnerDeviceRequest,
): Promise<ApiResponse<RegisterPartnerDeviceResponse>> => {
  const response = await client.post<
    ApiResponse<RegisterPartnerDeviceResponse>
  >(`${PARTNER_PROFILE}/device-token/`, payload);
  return response.data;
};