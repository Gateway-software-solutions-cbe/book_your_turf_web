import { useAuth } from '../context/AuthContext';

// ─── Permission Codes ──────────────────────────────────────────────────────────
// Define all permission codenames in one place so usage sites import from here,
// not from raw strings. When the backend ships the dynamic roles/permissions
// endpoints, the VALUES of these strings must match the codenames the API returns.

export const PERMISSIONS = {
  // Partners
  PARTNERS_VIEW: 'partners.view',
  PARTNERS_CREATE: 'partners.create',
  PARTNERS_EDIT: 'partners.edit',
  PARTNERS_DELETE: 'partners.delete',

  // Turfs
  TURFS_VIEW: 'turfs.view',
  TURFS_CREATE: 'turfs.create',
  TURFS_EDIT: 'turfs.edit',

  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',

  // Bookings
  BOOKINGS_VIEW: 'bookings.view',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',

  // Notifications
  NOTIFICATIONS_VIEW: 'notifications.view',
  NOTIFICATIONS_SEND: 'notifications.send',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * usePermission(code)
 *
 * CURRENT BEHAVIOUR (stub):
 *   Returns `true` for any permission if the user is authenticated.
 *   This is intentional — RBAC endpoints are not yet built by the backend team.
 *   All call sites are already wired up so that when the backend ships
 *   `GET /api/admin/me/permissions/`, you update ONLY this hook's internals.
 *
 * FUTURE BEHAVIOUR:
 *   Fetch the permission list for the logged-in admin's role on login,
 *   store it in AuthContext alongside AdminUser, and check membership here.
 */
export const usePermission = (_code: PermissionCode): boolean => {
  const { isAuthenticated } = useAuth();

  // ── TODO: replace stub with real check when RBAC is ready ─────────────────
  // const { admin } = useAuth();
  // return isAuthenticated && (admin?.permissions ?? []).includes(code);

  return isAuthenticated;
};

/**
 * usePermissions(codes[])
 * Returns true only if the user has ALL listed permissions.
 */
export const usePermissions = (codes: PermissionCode[]): boolean => {
  const { isAuthenticated } = useAuth();
  // Same stub — replace with real check alongside usePermission above.
  return isAuthenticated && codes.length > 0;
};
