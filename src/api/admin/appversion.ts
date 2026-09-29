// ─── App Version ───────────────────────────────────────────────────────────────
import {AppVersion, AppType, AppPlatform,} from '../../types/admin/appversion'
import apiClient from './client';

export const getAppVersion = async (
  app_type: AppType,
  platform: AppPlatform,
): Promise<AppVersion> => {
  const res = await apiClient.get<AppVersion>('/api/admin/app-version/', {
    params: { app_type, platform },
  });
  return res.data;
};