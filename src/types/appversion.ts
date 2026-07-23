// ─── App Version ───────────────────────────────────────────────────────────────
// GET /api/admin/app-version/?app_type=partner&platform=android

export type AppType = 'user' | 'partner';
export type AppPlatform = 'android' | 'ios';

export interface AppVersion {
  id:              number;
  platform:        AppPlatform;
  app_type:        AppType;
  minimum_version: string;
  latest_version:  string;
  force_update:    boolean;
  update_url:      string;
  is_active:       boolean;
}