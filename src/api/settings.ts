import apiClient from './client';
import type {
  GameCoinSettings, UpdateGameCoinSettings,
  TurfDefaultSettings, UpdateTurfDefaultSettings,
  BulkUpdateTurfSettings, BulkUpdateResponse,
} from '../types/setting';

// ─── Game Coin Settings ────────────────────────────────────────────────────────

export const getGameCoinSettings = async (): Promise<GameCoinSettings> => {
  const res = await apiClient.get<GameCoinSettings>('/api/admin/settings/current/');
  return res.data;
};

export const updateGameCoinSettings = async (
  data: UpdateGameCoinSettings,
): Promise<GameCoinSettings> => {
  const res = await apiClient.patch<GameCoinSettings>('/api/admin/settings/current/', data);
  return res.data;
};

// ─── Turf Default Settings ─────────────────────────────────────────────────────

export const getTurfDefaultSettings = async (): Promise<TurfDefaultSettings> => {
  const res = await apiClient.get<TurfDefaultSettings>('/api/admin/settings/turf-defaults/current/');
  return res.data;
};

export const updateTurfDefaultSettings = async (
  data: UpdateTurfDefaultSettings,
): Promise<TurfDefaultSettings> => {
  const res = await apiClient.patch<TurfDefaultSettings>(
    '/api/admin/settings/turf-defaults/current/',
    data,
  );
  return res.data;
};

// ─── Bulk Update Turf Settings ─────────────────────────────────────────────────

export const bulkUpdateTurfSettings = async (
  data: BulkUpdateTurfSettings,
): Promise<BulkUpdateResponse> => {
  const res = await apiClient.post<BulkUpdateResponse>(
    '/api/admin/turfs/bulk-update-settings/',
    data,
  );
  return res.data;
};



// ─── Discount Mode Settings ──────────────────────────────────────────────────

// export interface DiscountModeSettings {
//   global_discount_mode: 'overall' | 'payable';
// }

/**
 * GET /api/admin/settings/discount-mode/
 * Get the global discount mode setting.
 */
// export const getDiscountMode = async (): Promise<DiscountModeSettings> => {
//   const response = await apiClient.get<{ result: string; data: DiscountModeSettings }>(
//     '/api/admin/settings/discount-mode/'
//   );
//   return response.data.data;
// };

/**
 * PATCH /api/admin/settings/discount-mode/
 * Update the global discount mode setting.
 */
// export const updateDiscountMode = async (
//   data: DiscountModeSettings
// ): Promise<DiscountModeSettings> => {
//   const response = await apiClient.patch<{ result: string; data: DiscountModeSettings }>(
//     '/api/admin/settings/discount-mode/',
//     data
//   );
//   return response.data.data;
// };